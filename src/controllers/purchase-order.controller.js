const createError = require("http-errors");
const {PurchaseOrder ,PurchaseOrderDetail,Product, sequelize, ImportSuggestionHistory} = require("~/models");
const { generateMaPhieu } = require("~/utils");
const { Op } = require('sequelize');


// Middleware kiểm tra và cập nhật trạng thái đề xuất
const checkAndUpdateSuggestionStatus = async (req, res, next) => {
  try {
    const products = req.body.products;
    
    // Lấy tất cả các đề xuất chưa hoàn thành của các sản phẩm đang được nhập
    const pendingSuggestions = await ImportSuggestionHistory.findAll({
      where: {
        productId: {
          [Op.in]: products.map(product => product.productId)
        },
        status: 'pending'
      }
    });

    // Lưu thông tin đề xuất cần cập nhật vào req để xử lý trong controller
    req.pendingSuggestions = pendingSuggestions;
    next();
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái đề xuất:', error);
    next(createError(500, "Lỗi khi kiểm tra trạng thái đề xuất"));
  }
};

// Cập nhật controller createPurchaseOrder
const createPurchaseOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      supplier_id,
      note,
      dateImport,
      products
    } = req.body;
    
    const userId = req.user.id;
    const codePurchaseOrder = generateMaPhieu('PN');

    // 1. Tạo đơn nhập hàng
    const newPurchaseOrder = await PurchaseOrder.create({
      codePurchaseOrder,
      supplier_id,
      note,
      dateImport,
      userId
    }, { transaction });

    // 2. Tạo chi tiết đơn nhập hàng
    const purchaseOrderDetails = await Promise.all(products.map(async (product) => {
      return await PurchaseOrderDetail.create({
        purchaseOrderId: newPurchaseOrder.id,
        productId: product.productId,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.totalPrice
      }, { transaction });
    }));

    // 3. Cập nhật số lượng tồn kho
    await Promise.all(products.map(async (product) => {
      const currentProduct = await Product.findByPk(product.productId, { transaction });
      if (!currentProduct) {
        throw new Error(`Product with id ${product.productId} not found`);
      }
      
      const newQuantity = currentProduct.inventory_quantity + parseInt(product.quantity, 10);
      
      await Product.update(
        { inventory_quantity: newQuantity },
        { 
          where: { id: product.productId },
          transaction 
        }
      );
    }));

    // 4. Cập nhật trạng thái đề xuất nếu có
    if (req.pendingSuggestions && req.pendingSuggestions.length > 0) {
      await Promise.all(req.pendingSuggestions.map(async (suggestion) => {
        const importProduct = products.find(
          product => product.productId === suggestion.productId
        );

        if (importProduct && parseInt(importProduct.quantity) >= parseInt(suggestion.suggestedQuantity)) {
          await suggestion.update({
            status: 'completed',
            note: `${suggestion.note}\nĐã nhập đủ số lượng đề xuất vào ngày ${new Date().toLocaleDateString('vi-VN')}`
          }, { transaction });
        }
      }));
    }

    // 5. Tính và cập nhật tổng giá trị đơn hàng
    const totalOrderValue = purchaseOrderDetails.reduce((sum, detail) => sum + parseFloat(detail.totalPrice), 0);
    await newPurchaseOrder.update({ total_price: totalOrderValue }, { transaction });

    // 6. Commit transaction
    await transaction.commit();

    return res.json({
      data: {
        purchaseOrder: newPurchaseOrder.toJSON(),
        purchaseOrderDetails: purchaseOrderDetails.map(detail => detail.toJSON())
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return next(createError(500));
  }
};

  const getPurchaseById = async (req,res,next) =>{
    const {id} = req.params
        console.log("ID:",id)
    try {
        const puschaseOrder = await PurchaseOrder.findByPk(id,{
          include: [
            {
              association: 'purchaseOrderDetails',
              include: [
                {
                  association: 'product',
                  attributes:{
                    include:['product_name']
                  }
                }
              ]
            },
            {
              association: 'supplier',
              attributes:{
                include:['supplier_name']
              }
            },
            {
              association: 'user',
              attributes:{
                exclude:['password']
              }
            }
          ]
          
        })
        return res.json({
            data:puschaseOrder
        })
    } catch (error) {
      console.log(error)
        return next(createError(500))
    }
}
const getAllPurchaseOrder = async (req,res,next) =>{
    try {
        const puschaseOrder = await PurchaseOrder.findAll({
          include: [
            
            {
              association: 'supplier',
              attributes:{
                include:['supplier_name']
              }
            },
            {
              association: 'user',
              attributes:{
                exclude:['password']
              }
            }
          ]
        })
        return res.json({
            data:puschaseOrder
        })
    } catch (error) {
        return next(createError(500))
    }
}

const updatePurchaseOrder = async (req,res,next) =>{
    try {
        const {id} = req.params
        console.log("ID:",id)
        const {
          product_id,
          quantity,
          unit_price,
          total_price,
          supplier_id,
          note,
          } = req.body;
        const newPurchaseOrder = await PurchaseOrder.update(
            {
              product_id,
              quantity,
              unit_price,
              total_price,
              supplier_id,
              note,
            },
            {
              where:{id}   
            }
        )
        return res.json({
            data: newPurchaseOrder
        })
    } catch (error) {
        return next(createError(500))
    
    }
}

const delPurchaseOrderById = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    // Lấy thông tin chi tiết của purchase order trước khi xóa
    const purchaseOrderDetails = await PurchaseOrderDetail.findAll({
      where: { purchaseOrderId: id },
      transaction
    });

    // Cập nhật lại số lượng sản phẩm trong kho
    await Promise.all(purchaseOrderDetails.map(async (detail) => {
      const product = await Product.findByPk(detail.productId, { transaction });
      if (!product) {
        throw new Error(`Product with id ${detail.productId} not found`);
      }
      
      const updatedQuantity = product.inventory_quantity - parseInt(detail.quantity, 10);
      
      await Product.update(
        { inventory_quantity: updatedQuantity },
        { 
          where: { id: detail.productId },
          transaction 
        }
      );
    }));

    // Xóa tất cả purchase order details
    await PurchaseOrderDetail.destroy({
      where: { purchaseOrderId: id },
      transaction
    });

    // Xóa purchase order
    await PurchaseOrder.destroy({
      where: { id },
      transaction
    });

    // Commit transaction nếu mọi thứ thành công
    await transaction.commit();

    // Lấy danh sách purchase orders mới
    const newPurchaseOrders = await PurchaseOrder.findAll();

    return res.json({
      message: "Purchase order deleted successfully and inventory updated",
      data: newPurchaseOrders
    });

  } catch (error) {
    // Rollback transaction nếu có lỗi
    await transaction.rollback();
    console.error("Error in delPurchaseOrderById:", error);
    return next(createError(500, "An error occurred while deleting the purchase order"));
  }
};

module.exports = {
  createPurchaseOrder,
  getAllPurchaseOrder,
  updatePurchaseOrder,
  delPurchaseOrderById,
  getPurchaseById,
  checkAndUpdateSuggestionStatus
};
