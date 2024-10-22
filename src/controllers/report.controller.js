const { Op } = require('sequelize');
const { Product,Category, PurchaseOrder, PurchaseOrderDetail, ExportOrder, ExportOrderDetail } = require('~/models');

const getInventoryReport = async (req, res) => {
    try {
      const { startDate, endDate, month } = req.query;
      console.log("startDate:",startDate)
      console.log("endDate:",endDate)
      let startPeriod, endPeriod;
      
      // Xử lý filter theo tháng hoặc khoảng thời gian
      if (month) {
        const [monthNum, year] = month.split('-');
        startPeriod = new Date(year, parseInt(monthNum) - 1, 1);
        endPeriod = new Date(year, parseInt(monthNum), 0);
      } else if (startDate && endDate) {
        startPeriod = new Date(startDate);
        endPeriod = new Date(endDate);
      } else {
        const now = new Date();
        startPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
        endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
  
      console.log('Query Period:', {
        startPeriod: startPeriod.toISOString(),
        endPeriod: endPeriod.toISOString()
      });
  
      // Lấy danh sách sản phẩm và category
      const products = await Product.findAll({
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['name']
          }
        ]
      });
  
      // Lấy chi tiết nhập kho
      const purchaseDetails = await PurchaseOrderDetail.findAll({
        include: [
          {
            model: PurchaseOrder,
            as: 'purchaseOrder',
            where: {
              dateImport: {
                [Op.between]: [startPeriod, endPeriod]
              }
            }
          },
          {
            model: Product,
            as: 'product',
          }
        ]
      });
  
      console.log('Purchase Details Found:', purchaseDetails.length);
      // Log một vài record đầu tiên để kiểm tra
      if (purchaseDetails.length > 0) {
        console.log('Sample Purchase Detail:', {
          purchaseOrderId: purchaseDetails[0].purchaseOrderId,
          dateImport: purchaseDetails[0].purchaseOrder?.dateImport,
          quantity: purchaseDetails[0].quantity
        });
      }
  
      // Lấy chi tiết xuất kho
      const exportDetails = await ExportOrderDetail.findAll({
        include: [
          {
            model: ExportOrder,
            as: 'exportOrder',
            where: {
              dateExport: {
                [Op.between]: [
                  startPeriod.toISOString().split('T')[0], 
                  endPeriod.toISOString().split('T')[0]
                ]
              },
              status: 1
            }
          },
          {
            model: Product,
            as: 'product',
          }
        ]
      });
  
      console.log('Export Details Found:', exportDetails.length);
      // Log một vài record đầu tiên để kiểm tra
      if (exportDetails.length > 0) {
        console.log('Sample Export Detail:', {
          exportOrderId: exportDetails[0].exportOrderId,
          dateExport: exportDetails[0].exportOrder?.dateExport,
          quantity: exportDetails[0].quantity
        });
      }
  
      // Tính toán báo cáo cho từng sản phẩm
      const inventoryReport = products.map(product => {



        // Tính tổng số lượng nhập
        const totalImported = purchaseDetails
          .filter(detail => Number(detail.productId) === Number(product.id))
          .reduce((sum, detail) => {
            const quantity = Number(detail.quantity || 0);
            console.log(`AAAImport for product ${product.id}: ${quantity}`);
            return sum + quantity;
          }, 0);
  
        // Tính tổng số lượng xuất
        const totalExported = exportDetails
          .filter(detail => Number(detail.productId) === Number(product.id))
          .reduce((sum, detail) => {
            const quantity = Number(detail.quantity || 0);
            console.log(`AAAExport for product ${product.id}: ${quantity}`);
            return sum + quantity;
          }, 0);
  
        console.log(`Product ${product.id} Summary:`, {
          totalImported,
          totalExported
        });
  
        const endingInventory = parseInt(product.inventory_quantity || 0);
        const beginningInventory = endingInventory - totalImported + totalExported;
        const inventoryValue = endingInventory * parseInt(product.price || 0);
  
        return {
          product_id: product.id,
          product_name: product.product_name,
          category_name: product.category?.name || 'Chưa phân loại',
          unit: product.unit_calc,
          beginning_inventory: beginningInventory,
          quantity_imported: totalImported,
          quantity_exported: totalExported,
          ending_inventory: endingInventory,
          unit_price: parseInt(product.price || 0),
          inventory_value: inventoryValue,
          last_updated: product.warehouse_latest
        };
      });
  
      // Thêm log để kiểm tra raw query
      console.log('Raw Query Conditions:', {
        dateImport: {
          between: [startPeriod, endPeriod]
        },
        dateExport: {
          between: [
            startPeriod.toISOString().split('T')[0],
            endPeriod.toISOString().split('T')[0]
          ]
        }
      });
  
      const summaryReport = {
        total_beginning: inventoryReport.reduce((sum, item) => sum + item.beginning_inventory, 0),
        total_imported: inventoryReport.reduce((sum, item) => sum + item.quantity_imported, 0),
        total_exported: inventoryReport.reduce((sum, item) => sum + item.quantity_exported, 0),
        total_ending: inventoryReport.reduce((sum, item) => sum + item.ending_inventory, 0),
        total_value: inventoryReport.reduce((sum, item) => sum + item.inventory_value, 0),
      };
  
      res.json({data: {
        success: true,
        
          period: {
            start_date: startPeriod.toISOString().split('T')[0],
            end_date: endPeriod.toISOString().split('T')[0]
          },
          summary: summaryReport,
          details: inventoryReport
        }
      });
  
    } catch (error) {
      console.error('Error generating inventory report:', error);
      console.error('Error stack:', error.stack);
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

module.exports = {
  getInventoryReport,
  validateDateRange
};