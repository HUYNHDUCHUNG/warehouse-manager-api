const { Product, ExportOrder, ExportOrderDetail,Customer,User } = require('~/models');
const { Op } = require('sequelize');

exports.getInventoryRecommendations = async (req, res) => {
  try {
    // Lấy tất cả các sản phẩm
    const products = await Product.findAll();
    
    // Mảng lưu các sản phẩm cần nhập thêm
    const recommendedProducts = [];

    for (let product of products) {
      // Tính tổng số lượng xuất của sản phẩm từ các đơn hàng chưa xử lý (status = false)
      const totalExportQuantity = await ExportOrderDetail.sum('quantity', {
        include: [{
          model: ExportOrder,
          as: 'exportOrder',
          where: {
            status: false, // Chỉ lấy các đơn hàng chưa xử lý
            dateExport: {
              // Giới hạn trong khoảng thời gian gần đây (ví dụ: 30 ngày)
              [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }],
        where: {
          productId: product.id
        }
      });

      // Kiểm tra nếu tổng số lượng xuất vượt quá tồn kho
      const inventoryThreshold = product.inventory_quantity;
      
      if (totalExportQuantity > inventoryThreshold) {
        const recommendQuantity = Math.ceil(totalExportQuantity - product.inventory_quantity);
        
        recommendedProducts.push({
          productId: product.id,
          productName: product.product_name,
          currentInventory: product.inventory_quantity,
          totalUnprocessedExportQuantity: totalExportQuantity,
          recommendedImportQuantity: recommendQuantity
        });
      }
    }

    // Trả về danh sách sản phẩm cần nhập
    res.status(200).json({
      data:{
        message: 'Danh sách sản phẩm đề xuất nhập từ các đơn hàng chưa xử lý',
        recommendations: recommendedProducts
      }
      
    });
  } catch (error) {
    console.error('Lỗi khi tạo đề xuất nhập hàng:', error);
    res.status(500).json({ 
      message: 'Có lỗi xảy ra khi tạo đề xuất nhập hàng',
      error: error.message 
    });
  }
};

// Endpoint để lấy chi tiết các đơn hàng chưa xử lý cho sản phẩm cụ thể
exports.getUnprocessedExportOrderDetails = async (req, res) => {
  try {
    const { productId } = req.params;

    const unprocessedOrders = await ExportOrderDetail.findAll({
      where: { 
        productId: productId 
      },
      include: [{
        model: ExportOrder,
        as: 'exportOrder',
        where: { 
          status: false 
        },
        include: [
          { 
            model: Customer, 
            as: 'customer' 
          },
          { 
            model: User, 
            as: 'user' 
          }
        ]
      }, {
        model: Product,
        as: 'product'
      }]
    });

    res.status(200).json({
      data:{
        message: 'Chi tiết các đơn hàng chưa xử lý cho sản phẩm',
        unprocessedOrders: unprocessedOrders
      }
      
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đơn hàng chưa xử lý:', error);
    res.status(500).json({ 
      message: 'Có lỗi xảy ra khi lấy chi tiết đơn hàng',
      error: error.message 
    });
  }
};

// API để đánh dấu đơn hàng đã được xử lý
exports.markExportOrderAsProcessed = async (req, res) => {
  try {
    const { exportOrderId } = req.params;

    const updatedOrder = await ExportOrder.update(
      { status: true },
      { 
        where: { id: exportOrderId },
        returning: true // Trả về bản ghi đã được cập nhật
      }
    );

    res.status(200).json({
      message: 'Đánh dấu đơn hàng đã xử lý thành công',
      order: updatedOrder[1][0] // Lấy bản ghi đã được cập nhật
    });
  } catch (error) {
    console.error('Lỗi khi đánh dấu đơn hàng:', error);
    res.status(500).json({ 
      message: 'Có lỗi xảy ra khi đánh dấu đơn hàng',
      error: error.message 
    });
  }
};