const createError = require('http-errors');
const { Op } = require('sequelize');
const {ExportOrder,PurchaseOrder,ExportOrderDetail,Product, Customer,User, sequelize} = require('~/models');

const getTotalIncomeCurrentMonth = async (req, res) => {
  try {
    const now = new Date(); 
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Tính tổng thu nhập tháng hiện tại
    const currentMonthResult = await ExportOrder.findOne({
      attributes: [
        [sequelize.fn('COALESCE', 
          sequelize.fn('SUM', 
            sequelize.cast(sequelize.col('total_price'), 'DECIMAL(15,2)')
          ), 
          0
        ), 'total_income']
      ],
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn('YEAR', sequelize.col('dateExport')), currentYear),
          sequelize.where(sequelize.fn('MONTH', sequelize.col('dateExport')), currentMonth + 1),
          { status: true }
        ]
      }
    });

    // Tính tổng thu nhập tháng trước
    const previousMonthResult = await ExportOrder.findOne({
      attributes: [
        [sequelize.fn('COALESCE', 
          sequelize.fn('SUM', 
            sequelize.cast(sequelize.col('total_price'), 'DECIMAL(15,2)')
          ), 
          0
        ), 'total_income']
      ],
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn('YEAR', sequelize.col('dateExport')),
            currentMonth === 0 ? currentYear - 1 : currentYear
          ),
          sequelize.where(
            sequelize.fn('MONTH', sequelize.col('dateExport')),
            currentMonth === 0 ? 12 : currentMonth
          ),
          { status: true }
        ]
      }
    });

    const currentMonthIncome = parseFloat(currentMonthResult.getDataValue('total_income') || 0);
    const previousMonthIncome = parseFloat(previousMonthResult.getDataValue('total_income') || 0);

    // Tính tỷ lệ tăng trưởng
    let growthRate = 0;
    if (previousMonthIncome > 0) {
      growthRate = ((currentMonthIncome - previousMonthIncome) / previousMonthIncome * 100).toFixed(2);
    } else if (currentMonthIncome > 0) {
      growthRate = 100; // Nếu tháng trước = 0 và tháng này > 0 thì tăng 100%
    }

    // Format định dạng tiền tệ
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    return res.status(200).json({
      data:{
        success: true,
        current_month: {
          year: currentYear,
          month: currentMonth + 1,
          income: currentMonthIncome,
          formatted_income: formatCurrency(currentMonthIncome)
        },
        previous_month: {
          year: currentMonth === 0 ? currentYear - 1 : currentYear,
          month: currentMonth === 0 ? 12 : currentMonth,
          income: previousMonthIncome,
          formatted_income: formatCurrency(previousMonthIncome)
        },
        growth_rate: growthRate,
        growth_direction: growthRate > 0 ? 'increase' : growthRate < 0 ? 'decrease' : 'stable'
      }
    });

  } catch (error) {
    console.error('Error calculating growth rate:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


const getMonthlyOrderStats = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Lấy thống kê tháng hiện tại
    const currentMonthStats = await ExportOrder.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [
          sequelize.fn('SUM', 
            sequelize.literal('CASE WHEN status = 1 THEN 1 ELSE 0 END')
          ),
          'completed_orders'
        ],
        [
          sequelize.fn('SUM', 
            sequelize.literal('CASE WHEN status = 0 THEN 1 ELSE 0 END')
          ),
          'pending_orders'
        ]
      ],
      where: sequelize.and(
        sequelize.where(sequelize.fn('MONTH', sequelize.col('dateExport')), currentMonth),
        sequelize.where(sequelize.fn('YEAR', sequelize.col('dateExport')), currentYear)
      )
    });

    // Lấy thống kê tháng trước
    const previousMonthStats = await ExportOrder.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders']
      ],
      where: sequelize.and(
        sequelize.where(sequelize.fn('MONTH', sequelize.col('dateExport')), previousMonth),
        sequelize.where(sequelize.fn('YEAR', sequelize.col('dateExport')), previousYear)
      )
    });

    // Parse kết quả
    const currentStats = currentMonthStats?.get({ plain: true }) || {
      total_orders: 0,
      completed_orders: 0,
      pending_orders: 0
    };
    
    const previousStats = previousMonthStats?.get({ plain: true }) || {
      total_orders: 0
    };

    // Convert từ string sang number
    const currentTotal = parseInt(currentStats.total_orders || 0);
    const completedOrders = parseInt(currentStats.completed_orders || 0);
    const pendingOrders = parseInt(currentStats.pending_orders || 0);
    const previousTotal = parseInt(previousStats.total_orders || 0);

    // Tính tỷ lệ tăng trưởng
    let growthRate = 0;
    if (previousTotal > 0) {
      growthRate = ((currentTotal - previousTotal) / previousTotal * 100).toFixed(2);
    } else if (currentTotal > 0) {
      growthRate = 100;
    }

    // Format số với dấu phẩy ngăn cách hàng nghìn
    const formatNumber = (num) => {
      return new Intl.NumberFormat('vi-VN').format(num);
    };

    return res.status(200).json({
      data: {
      success: true,
        current_month: {
          year: currentYear,
          month: currentMonth,
          total_orders: currentTotal,
          formatted_total: formatNumber(currentTotal),
          completed_orders: completedOrders,
          pending_orders: pendingOrders,
          completion_rate: currentTotal > 0 
            ? ((completedOrders / currentTotal) * 100).toFixed(2) 
            : 0
        },
        previous_month: {
          year: previousYear,
          month: previousMonth,
          total_orders: previousTotal,
          formatted_total: formatNumber(previousTotal)
        },
        growth_rate: parseFloat(growthRate),
        growth_direction: growthRate > 0 ? 'increase' : growthRate < 0 ? 'decrease' : 'stable'
      }
    });

  } catch (error) {
    console.error('Error calculating order statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getMonthlyPurchaseOrderStats = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Lấy thống kê tháng hiện tại
    const currentMonthStats = await PurchaseOrder.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [
          sequelize.fn('SUM', 
            sequelize.literal('CASE WHEN total_price > 0 THEN 1 ELSE 0 END')
          ),
          'completed_orders'
        ],
        [
          sequelize.fn('SUM', 
            sequelize.literal('CASE WHEN total_price = 0 OR total_price IS NULL THEN 1 ELSE 0 END')
          ),
          'pending_orders'
        ]
      ],
      where: sequelize.and(
        sequelize.where(sequelize.fn('MONTH', sequelize.col('dateImport')), currentMonth),
        sequelize.where(sequelize.fn('YEAR', sequelize.col('dateImport')), currentYear)
      )
    });

    // Lấy thống kê tháng trước
    const previousMonthStats = await PurchaseOrder.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders']
      ],
      where: sequelize.and(
        sequelize.where(sequelize.fn('MONTH', sequelize.col('dateImport')), previousMonth),
        sequelize.where(sequelize.fn('YEAR', sequelize.col('dateImport')), previousYear)
      )
    });

    // Parse kết quả
    const currentStats = currentMonthStats?.get({ plain: true }) || {
      total_orders: 0,
      completed_orders: 0,
      pending_orders: 0
    };
    
    const previousStats = previousMonthStats?.get({ plain: true }) || {
      total_orders: 0
    };

    // Convert từ string sang number
    const currentTotal = parseInt(currentStats.total_orders || 0);
    const completedOrders = parseInt(currentStats.completed_orders || 0);
    const pendingOrders = parseInt(currentStats.pending_orders || 0);
    const previousTotal = parseInt(previousStats.total_orders || 0);

    // Tính tỷ lệ tăng trưởng và hướng tăng trưởng
    let growthRate = 0;
    if (previousTotal > 0) {
      growthRate = ((currentTotal - previousTotal) / previousTotal * 100);
    } else if (currentTotal > 0) {
      growthRate = 100;
    }

    // Format số
    const formatNumber = (num) => {
      return num.toString();
    };

    // Tính completion rate
    const completionRate = currentTotal > 0 
      ? ((completedOrders / currentTotal) * 100).toFixed(2)
      : "0.00";

    return res.status(200).json({
      data: {
        success: true,
        current_month: {
          year: currentYear,
          month: currentMonth,
          total_orders: currentTotal,
          formatted_total: formatNumber(currentTotal),
          completed_orders: completedOrders,
          pending_orders: pendingOrders,
          completion_rate: completionRate
        },
        previous_month: {
          year: previousYear,
          month: previousMonth,
          total_orders: previousTotal,
          formatted_total: formatNumber(previousTotal)
        },
        growth_rate: growthRate,
        growth_direction: growthRate > 0 ? 'increase' : growthRate < 0 ? 'decrease' : 'stable'
      }
    });

  } catch (error) {
    console.error('Error calculating purchase order statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getCustomerStats = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Lấy tổng số khách hàng tháng hiện tại
    const currentMonthCustomers = await Customer.count({
      where: sequelize.and(
        sequelize.where(sequelize.fn('MONTH', sequelize.col('createdAt')), currentMonth),
        sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), currentYear)
      )
    });

    // Lấy tổng số khách hàng tháng trước
    const previousMonthCustomers = await Customer.count({
      where: sequelize.and(
        sequelize.where(sequelize.fn('MONTH', sequelize.col('createdAt')), previousMonth),
        sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), previousYear)
      )
    });

    // Lấy tổng số khách hàng
    const totalCustomers = await Customer.count();

    // Thống kê theo loại liên hệ
    const contactStats = await Customer.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.literal(`
          CASE 
            WHEN phone IS NOT NULL AND email IS NOT NULL THEN 'both'
            WHEN phone IS NOT NULL THEN 'phone'
            WHEN email IS NOT NULL THEN 'email'
            ELSE 'none'
          END
        `), 'contact_type']
      ],
      group: [sequelize.literal(`
        CASE 
          WHEN phone IS NOT NULL AND email IS NOT NULL THEN 'both'
          WHEN phone IS NOT NULL THEN 'phone'
          WHEN email IS NOT NULL THEN 'email'
          ELSE 'none'
        END
      `)]
    });

    // Tính tỷ lệ tăng trưởng
    let growthRate = 0;
    if (previousMonthCustomers > 0) {
      growthRate = ((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers * 100).toFixed(2);
    } else if (currentMonthCustomers > 0) {
      growthRate = 100;
    }

    // Format số với dấu phẩy ngăn cách hàng nghìn
    const formatNumber = (num) => {
      return new Intl.NumberFormat('vi-VN').format(num);
    };

    // Chuyển đổi contactStats thành object dễ sử dụng
    const contactTypeCounts = contactStats.reduce((acc, stat) => {
      acc[stat.dataValues.contact_type] = parseInt(stat.dataValues.count);
      return acc;
    }, {});

    return res.status(200).json({
      data: {
      success: true,
        current_month: {
          year: currentYear,
          month: currentMonth,
          new_customers: currentMonthCustomers,
          formatted_new_customers: formatNumber(currentMonthCustomers)
        },
        previous_month: {
          year: previousYear,
          month: previousMonth,
          new_customers: previousMonthCustomers,
          formatted_new_customers: formatNumber(previousMonthCustomers)
        },
        total_customers: totalCustomers,
        formatted_total: formatNumber(totalCustomers),
        growth_rate: parseFloat(growthRate),
        growth_direction: growthRate > 0 ? 'increase' : growthRate < 0 ? 'decrease' : 'stable',
        // contact_statistics: {
        //   both_contacts: contactTypeCounts.both || 0,
        //   phone_only: contactTypeCounts.phone || 0,
        //   email_only: contactTypeCounts.email || 0,
        //   no_contacts: contactTypeCounts.none || 0
        // },
        // contact_coverage: {
        //   percentage: totalCustomers > 0 
        //     ? (((contactTypeCounts.both || 0) + (contactTypeCounts.phone || 0) + (contactTypeCounts.email || 0)) / totalCustomers * 100).toFixed(2)
        //     : 0
        // }
      }
    });

  } catch (error) {
    console.error('Error calculating customer statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


const getTopExportProducts = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const topProducts = await ExportOrderDetail.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.cast(sequelize.col('quantity'), 'DECIMAL')), 'export_quantity'],
        [sequelize.fn('COUNT', sequelize.col('exportOrderId')), 'order_count'],
        [sequelize.fn('SUM', 
          sequelize.cast(sequelize.col('totalPrice'), 'DECIMAL')
        ), 'total_amount']
      ],
      include: [
        {
          model: ExportOrder,
          as: 'exportOrder',
          attributes: [],
          where: sequelize.and(
            sequelize.where(
              sequelize.fn('MONTH', sequelize.col('exportOrder.createdAt')), 
              currentMonth
            ),
            sequelize.where(
              sequelize.fn('YEAR', sequelize.col('exportOrder.createdAt')), 
              currentYear
            )
          )
        },
        {
          model: Product,
          as: 'product',
          attributes: [
            'product_name',
            'inventory_quantity'
          ]
        }
      ],
      group: ['productId', 'product.id'],
      order: [[sequelize.fn('SUM', sequelize.cast(sequelize.col('quantity'), 'DECIMAL')), 'DESC']],
      limit: 5
    });

    // Format response data
    const formattedData = topProducts.map((item, index) => {
      const plainItem = item.get({ plain: true });
      return {
        stt: index + 1,
        product_name: plainItem.product.product_name,
        export_quantity: parseInt(plainItem.export_quantity),
        order_count: parseInt(plainItem.order_count),
        inventory: plainItem.product.inventory_quantity > 0 
          ? plainItem.product.inventory_quantity 
          : 'Out of stock',
        total_amount: new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(plainItem.total_amount)
      };
    });

    return res.status(200).json({
      data: formattedData
    });

  } catch (error) {
    console.error('Error getting top export products:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};



const getTopEmployees = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const topEmployees = await User.findAll({
      where: {
        role: 'SELL'
      },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'role',
        [sequelize.fn('COUNT', sequelize.col('exportOrder.id')), 'order_count'], // Dùng alias 'ExportOrders.id'
        [
          sequelize.fn('SUM', sequelize.cast(sequelize.col('ExportOrders.total_price'), 'DECIMAL')),
          'total_amount'
        ]
      ],
      include: [{
        model: ExportOrder,
        as: 'exportOrder', // Khớp với alias mới
        attributes: [],
        where: sequelize.and(
          sequelize.where(
            sequelize.fn('MONTH', sequelize.fn('STR_TO_DATE', sequelize.col('exportOrder.dateExport'), '%Y-%m-%d')),
            currentMonth
          ),
          sequelize.where(
            sequelize.fn('YEAR', sequelize.fn('STR_TO_DATE', sequelize.col('exportOrder.dateExport'), '%Y-%m-%d')),
            currentYear
          ),
          {
            status: true
          }
        ),
        required: true
      }],
      
      group: ['User.id', 'User.firstName', 'User.lastName', 'User.role'],
      order: [[sequelize.literal('total_amount'), 'DESC']],
      limit: 4
    });

    // Format response data
    const formattedData = topEmployees.map((employee, index) => {
      const plainEmployee = employee.get({ plain: true });
      
      // Format tổng thu nhập
      const totalAmount = parseFloat(plainEmployee.total_amount || 0);
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(totalAmount);

      return {
        stt: index + 1,
        employee: plainEmployee.firstName + ' ' + plainEmployee.lastName,
        department: plainEmployee.role || 'Staff',
        order_count: parseInt(plainEmployee.order_count || 0),
        total_amount: formattedAmount
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        current_month: {
          year: currentYear,
          month: currentMonth
        },
        employees: formattedData
      }
    });

  } catch (error) {
    console.error('Error getting top employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


// Format date helper function (nếu cần)
// const formatDate = (dateStr) => {
//   try {
//     const date = new Date(dateStr);
//     return date.toISOString().split('T')[0];
//   } catch (error) {
//     return dateStr;
//   }
// };

const getOrderStatistics = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Thống kê đơn xuất hàng theo tháng
    const exportStats = await ExportOrder.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('dateExport')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'exportCount']
      ],
      where: {
        dateExport: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        },
        status: true // Chỉ lấy những đơn đã hoàn thành
      },
      group: [sequelize.fn('MONTH', sequelize.col('dateExport'))],
      raw: true
    });

    // Thống kê đơn nhập hàng theo tháng
    const purchaseStats = await PurchaseOrder.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('dateImport')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'purchaseCount']
      ],
      where: {
        dateImport: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        }
      },
      group: [sequelize.fn('MONTH', sequelize.col('dateImport'))],
      raw: true
    });

    // Tạo mảng kết quả cho 12 tháng
    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const exportData = exportStats.find(stat => Number(stat.month) === month) || {
        exportCount: 0
      };
      const purchaseData = purchaseStats.find(stat => Number(stat.month) === month) || {
        purchaseCount: 0
      };

      // Tổng số đơn = đơn nhập + đơn xuất
      const totalOrders = Number(exportData.exportCount) + Number(purchaseData.purchaseCount);

      return {
        name: `T${month}`,
        Orders: totalOrders,
        ExportOrder: Number(exportData.exportCount),
        PurchaseOrder: Number(purchaseData.purchaseCount)
      };
    });

    return res.status(200).json({
      data:{
        success: true,
        data: monthlyStats,
        message: 'Lấy thống kê đơn hàng thành công'
      }
      
    });

  } catch (error) {
    console.error('Error in orderStatistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê đơn hàng',
      error: error.message
    });
  }
};

module.exports ={
    getTotalIncomeCurrentMonth,
    getMonthlyOrderStats,
    getMonthlyPurchaseOrderStats,
    getCustomerStats,
    getTopExportProducts,
    getTopEmployees,
    getOrderStatistics
}