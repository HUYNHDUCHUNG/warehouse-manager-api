const { Op } = require('sequelize');
const { Product,Category,User,sequelize, PurchaseOrder, InventoryReport,PurchaseOrderDetail, ExportOrder, ExportOrderDetail } = require('~/models');

const saveInventoryReportPeriodically = async () => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Lấy danh sách sản phẩm 
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });

    // Lấy chi tiết nhập kho trong khoảng thời gian
    const purchaseDetails = await PurchaseOrderDetail.findAll({
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
        },
        {
          model: Product,
          as: 'product',
        }
      ]
    });

    // Lấy chi tiết xuất kho 
    const exportDetails = await ExportOrderDetail.findAll({
      include: [
        {
          model: ExportOrder,
          as: 'exportOrder',
          where: {
            status: 1
          }
        },
        {
          model: Product,
          as: 'product',
        }
      ]
    });

    // Xử lý từng sản phẩm và lưu báo cáo
    const inventoryReportPromises = products.map(async (product) => {
      const totalImported = purchaseDetails
        .filter(detail => Number(detail.productId) === Number(product.id))
        .reduce((sum, detail) => sum + Number(detail.quantity || 0), 0);

      const totalExported = exportDetails
        .filter(detail => Number(detail.productId) === Number(product.id))
        .reduce((sum, detail) => sum + Number(detail.quantity || 0), 0);

      const endingInventory = parseInt(product.inventory_quantity || 0);
      const beginningInventory = endingInventory - totalImported + totalExported;
      const inventoryValue = endingInventory * parseInt(product.price || 0);

      // Tìm kiếm hoặc tạo mới báo cáo tồn kho
      const [inventoryReport, created] = await InventoryReport.findOrCreate({
        where: {
          productId: product.id,
          month: currentMonth,
          year: currentYear
        },
        defaults: {
          beginningInventory,
          quantityImported: totalImported,
          quantityExported: totalExported,
          endingInventory,
          inventoryValue,
          unitPrice: parseInt(product.price || 0)
        }
      });

      // Nếu báo cáo đã tồn tại, cập nhật lại
      if (!created) {
        await inventoryReport.update({
          beginningInventory,
          quantityImported: totalImported,
          quantityExported: totalExported,
          endingInventory,
          inventoryValue,
          unitPrice: parseInt(product.price || 0)
        });
      }

      return inventoryReport;
    });

    // Thực hiện song song việc tạo/cập nhật báo cáo
    await Promise.all(inventoryReportPromises);

    console.log('Inventory report saved successfully');
  } catch (error) {
    console.error('Error saving inventory report:', error);
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;
    let startPeriod, endPeriod;
    let isCurrentPeriod = false;
    
    // Xác định khoảng thời gian
    if (month) {
      const [monthNum, year] = month.split('-');
      startPeriod = new Date(year, parseInt(monthNum) - 1, 1);
      endPeriod = new Date(year, parseInt(monthNum), 0);
    } else if (startDate && endDate) {
      startPeriod = new Date(startDate);
      endPeriod = new Date(endDate);
    } else {
      // Nếu không có tham số, xem như là tháng hiện tại
      const now = new Date();
      startPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
      endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      isCurrentPeriod = true;
    }

    const currentMonth = startPeriod.getMonth() + 1;
    const currentYear = startPeriod.getFullYear();

    // Kiểm tra và lấy báo cáo tồn kho
    const existingReport = await InventoryReport.findOne({
      where: {
        month: currentMonth,
        year: currentYear
      }
    });

    let inventoryReport;

    // Nếu không có báo cáo hoặc là tháng hiện tại, tính toán lại
    if (!existingReport || isCurrentPeriod) {
      // Chạy hàm tính toán báo cáo
      await saveInventoryReportPeriodically();

      // Lấy lại báo cáo vừa tính
      inventoryReport = await InventoryReport.findAll({
        where: {
          month: currentMonth,
          year: currentYear
        },
        include: [
          {
            model: Product,
            as: 'product',
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['name']
              }
            ]
          }
        ]
      });
    } else {
      // Nếu đã có báo cáo, lấy báo cáo đã lưu
      inventoryReport = await InventoryReport.findAll({
        where: {
          month: currentMonth,
          year: currentYear
        },
        include: [
          {
            model: Product,
            as: 'product',
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['name']
              }
            ]
          }
        ]
      });
    }

    // Tính tổng kết
    const summaryReport = {
      total_beginning: inventoryReport.reduce((sum, item) => sum + item.beginningInventory, 0),
      total_imported: inventoryReport.reduce((sum, item) => sum + item.quantityImported, 0),
      total_exported: inventoryReport.reduce((sum, item) => sum + item.quantityExported, 0),
      total_ending: inventoryReport.reduce((sum, item) => sum + item.endingInventory, 0),
      total_value: inventoryReport.reduce((sum, item) => sum + item.inventoryValue, 0),
    };

    res.json({
      success: true,
      data: {
        period: {
          start_date: startPeriod.toISOString().split('T')[0],
          end_date: endPeriod.toISOString().split('T')[0]
        },
        summary: summaryReport,
        details: inventoryReport.map(report => ({
          product_id: report.product.id,
          product_name: report.product.product_name,
          category_name: report.product.category?.name || 'Chưa phân loại',
          unit: report.product.unit_calc,
          beginning_inventory: report.beginningInventory,
          quantity_imported: report.quantityImported,
          quantity_exported: report.quantityExported,
          ending_inventory: report.endingInventory,
          unit_price: report.unitPrice,
          inventory_value: report.inventoryValue,
          last_updated: report.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// Tạo API endpoint kiểm tra tính hợp lệ của dữ liệu đầu vào
const validateDateRange = (req, res, next) => {
  const { startDate, endDate, month } = req.query;

  if (!startDate && !endDate && !month) {
    return next(); // Sử dụng giá trị mặc định
  }

  if (month) {
    // Kiểm tra định dạng MM-YYYY
    const monthRegex = /^(0[1-9]|1[0-2])-\d{4}$/;
    if (!monthRegex.test(month)) {
      return res.status(400).json({
        error: 'Invalid month format',
        message: 'Month should be in MM-YYYY format'
      });
    }
  } else if (startDate && endDate) {
    // Kiểm tra định dạng ngày
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Dates should be in YYYY-MM-DD format'
      });
    }

    // Kiểm tra startDate <= endDate
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'Start date must be before or equal to end date'
      });
    }
  }

  next();
};


// Helper function để lấy điều kiện thời gian
const getDateCondition = (timeRange) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  switch(timeRange) {
    case 'thisMonth':
      return {
        dateExport: {
          [Op.gte]: startOfMonth.toISOString(),
          [Op.lte]: now.toISOString()
        }
      };
    case 'lastMonth':
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        dateExport: {
          [Op.gte]: startOfLastMonth.toISOString(),
          [Op.lte]: endOfLastMonth.toISOString()
        }
      };
    case 'thisYear':
      return {
        dateExport: {
          [Op.gte]: startOfYear.toISOString(),
          [Op.lte]: now.toISOString()
        }
      };
    default:
      return {};
  }
};

  // Get overall statistics
const getOverallStats = async (req, res) => {
    try {
      const { timeRange = 'thisMonth' } = req.query;
      const dateCondition = getDateCondition(timeRange);

      // Lấy tất cả đơn hàng trong khoảng thời gian
      const orders = await ExportOrder.findAll({
        where: {
          ...dateCondition,
          
        }
      });

      // Tính toán thống kê
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
      const completedOrders = orders.filter(order => order.status).length;
      
      // Tính % thay đổi so với tháng trước (nếu timeRange là thisMonth)
      let revenueGrowth = 0;
      if (timeRange === 'thisMonth') {
        const lastMonthCondition = getDateCondition('lastMonth');
        const lastMonthOrders = await ExportOrder.findAll({
          where: {
            ...lastMonthCondition,
            userId: {
              [Op.in]: sequelize.literal(`(SELECT id FROM Users WHERE role = 'SALE')`)
            }
          }
        });
        const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => 
          sum + parseFloat(order.total_price || 0), 0);
        revenueGrowth = lastMonthRevenue ? 
          ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0;
      }

      res.json({data:{
        totalOrders,
        totalRevenue,
        completedOrders,
        completionRate: ((completedOrders / totalOrders) * 100).toFixed(1),
        revenueGrowth
      }
        
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get monthly revenue chart data
const  getMonthlyRevenue = async (req, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const monthlyData = await ExportOrder.findAll({
        attributes: [
          [sequelize.fn('MONTH', sequelize.col('dateExport')), 'month'],
          [sequelize.fn('SUM', sequelize.cast(sequelize.col('total_price'), 'float')), 'revenue']
        ],
        where: {
          dateExport: {
            [Op.gte]: new Date(currentYear, 0, 1).toISOString(),
            [Op.lte]: new Date(currentYear, 11, 31).toISOString()
          },
          userId: {
            [Op.in]: sequelize.literal(`(SELECT id FROM Users WHERE role = 'SALE')`)
          }
        },
        group: [sequelize.fn('MONTH', sequelize.col('dateExport'))],
        order: [[sequelize.fn('MONTH', sequelize.col('dateExport')), 'ASC']]
      });

      const chartData = Array.from({ length: 12 }, (_, i) => ({
        name: `T${i + 1}`,
        'Doanh thu': 0
      }));

      monthlyData.forEach(data => {
        const month = data.getDataValue('month') - 1;
        chartData[month]['Doanh thu'] = parseFloat(data.getDataValue('revenue'));
      });

      res.json({data:chartData});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get employee statistics
const getEmployeeStats = async (req, res) => {
    try {
      const { timeRange = 'thisMonth' } = req.query;
      const dateCondition = getDateCondition(timeRange);

      const employees = await User.findAll({
        where: { role: 'SALE' },
        include: [{
          model: ExportOrder,
          as: 'exportOrder',
          where: dateCondition,
          required: false
        }],
        attributes: [
          'id',
          'fullName',
          [sequelize.fn('COUNT', sequelize.col('exportOrder.id')), 'totalOrders'],
          [sequelize.fn('SUM', 
            sequelize.cast(sequelize.col('exportOrder.total_price'), 'float')), 'totalRevenue'],
          [sequelize.fn('SUM', 
            sequelize.literal('CASE WHEN exportOrder.status = true THEN 1 ELSE 0 END')), 
            'completedOrders']
        ],
        group: ['User.id'],
        order: [[sequelize.literal('totalRevenue'), 'DESC']],
      });

      const employeeData = employees.map(emp => ({
        id: emp.id,
        name: `${emp.fullName}`,
        totalOrders: parseInt(emp.getDataValue('totalOrders')),
        totalRevenue: parseFloat(emp.getDataValue('totalRevenue') || 0),
        completedOrders: parseInt(emp.getDataValue('completedOrders')),
        pendingOrders: parseInt(emp.getDataValue('totalOrders')) - 
          parseInt(emp.getDataValue('completedOrders'))
      }));

      res.json({data:employeeData});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


module.exports = {
  getInventoryReport,
  validateDateRange,
  getOverallStats,
  getMonthlyRevenue,
  getEmployeeStats
};