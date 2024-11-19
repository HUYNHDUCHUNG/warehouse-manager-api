const { Product, ExportOrder, ExportOrderDetail, Customer, User, ImportSuggestionHistory } = require('~/models');
const { Op } = require('sequelize');

exports.getInventoryRecommendations = async (req, res) => {
  try {
    const products = await Product.findAll();
    const recommendedProducts = [];
    console.log("1")
    for (let product of products) {
      // Kiểm tra xem sản phẩm đã có đề xuất chưa xử lý hay chưa
      const existingSuggestion = await ImportSuggestionHistory.findOne({
        where: {
          productId: product.id,
          status: 'pending' // Giả sử 'pending' là trạng thái chưa xử lý
        }
      });

      // Chỉ tiếp tục nếu sản phẩm chưa có đề xuất chưa xử lý
      if (!existingSuggestion) {
        // Tính tổng số lượng xuất của sản phẩm từ các đơn hàng chưa xử lý
        const totalExportQuantity = await ExportOrderDetail.sum('quantity', {
          include: [{
            model: ExportOrder,
            as: 'exportOrder',
            where: {
              status: false,
              dateExport: {
                [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }],
          where: {
            productId: product.id
          }
        });

        // Kiểm tra điều kiện: tồn kho < 100 HOẶC tổng số lượng xuất > tồn kho
        if (product.inventory_quantity < 100 || totalExportQuantity > product.inventory_quantity) {
          const recommendQuantity = Math.ceil(totalExportQuantity - product.inventory_quantity);

          // Tạo đề xuất mới trong lịch sử
          await ImportSuggestionHistory.create({
            productId: product.id,
            // userId: req.user.id, // Giả sử có thông tin user từ middleware xác thực
            currentInventory: product.inventory_quantity.toString(),
            suggestedQuantity: recommendQuantity.toString(),
            totalUnprocessedOrders: totalExportQuantity.toString(),
            status: 'pending',
            note: 'Đề xuất tự động từ hệ thống'
          });

          recommendedProducts.push({
            productId: product.id,
            productName: product.product_name,
            currentInventory: product.inventory_quantity,
            totalUnprocessedExportQuantity: totalExportQuantity,
            recommendedImportQuantity: recommendQuantity
          });
        }
      }
    }

  } catch (error) {
    console.error('Lỗi khi tạo đề xuất nhập hàng:', error);
    res.status(500).json({
      message: 'Có lỗi xảy ra khi tạo đề xuất nhập hàng',
      error: error.message
    });
  }
};



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