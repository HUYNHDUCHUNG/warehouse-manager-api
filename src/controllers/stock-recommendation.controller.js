const { Product, ExportOrder, ExportOrderDetail, Customer, User, ImportSuggestionHistory } = require('~/models');
const { Op } = require('sequelize');

exports.getInventoryRecommendations = async (req, res) => {
  try {
    const products = await Product.findAll();
    const recommendedProducts = [];

    for (let product of products) {
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

      // Kiểm tra điều kiện mới: tồn kho < 100 VÀ tổng số lượng xuất > tồn kho
      if (product.inventory_quantity < 100 && totalExportQuantity > product.inventory_quantity) {
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

    res.status(200).json({
      data: {
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

// API để tạo lịch sử đề xuất nhập hàng
exports.createImportSuggestion = async (req, res) => {
  try {
    const { productId, suggestedQuantity, notes } = req.body;
    const userId = req.user.id; // Assuming you have user information in request

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm'
      });
    }

    const totalUnprocessedOrders = await ExportOrderDetail.sum('quantity', {
      include: [{
        model: ExportOrder,
        as: 'exportOrder',
        where: { status: false }
      }],
      where: { productId }
    });

    const suggestion = await ImportSuggestionHistory.create({
      productId,
      userId,
      currentInventory: product.inventory_quantity,
      suggestedQuantity,
      totalUnprocessedOrders,
      notes
    });

    res.status(201).json({
      message: 'Đã tạo đề xuất nhập hàng',
      data: suggestion
    });
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