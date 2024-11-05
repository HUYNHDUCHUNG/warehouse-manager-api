const createError = require("http-errors");
const {PurchaseOrder ,PurchaseOrderDetail,Product, sequelize, Sequelize} = require("~/models");
const { generateMaPhieu } = require("~/utils");


const createPurchaseOrder = async (req, res, next) => {
    try {
      const {
        supplier_id,
        note,
        dateImport,
        products

      } = req.body;
      const userId = req.user.id
      console.log('ID:',userId)
      // console.log("note:",products)
       const codePurchaseOrder = generateMaPhieu('PN')
  
      const newPurchaseOrder = await PurchaseOrder.create({
        codePurchaseOrder,
        supplier_id,
        note,
        dateImport,
        userId
      });

       // Tạo PurchaseOrderDetail cho mỗi sản phẩm
    const purchaseOrderDetails = await Promise.all(products.map(async (product) => {
      return await PurchaseOrderDetail.create({
        purchaseOrderId: newPurchaseOrder.id, // Sử dụng ID của PurchaseOrder làm khóa ngoại
        productId: product.productId,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.totalPrice
      });
    }));
    // Cập nhật số lượng tồn kho cho sản phẩm
    const updateInventoryProduct = await Promise.all(products.map(async (product) => {
      const currentProduct = await Product.findByPk(product.productId);
      if (!currentProduct) {
        throw new Error(`Product with id ${product.productId} not found`);
      }
      
      const newQuantity = currentProduct.inventory_quantity + parseInt(product.quantity, 10);
      
      return await Product.update(
        { inventory_quantity: newQuantity },
        { where: { id: product.productId } }
      );
    }));

    // Kiểm tra kết quả cập nhật
    // const updateResults = updateInventoryProduct.flat();
    // const allUpdatesSuccessful = updateResults.every(result => result[0] === 1);

    // if (!allUpdatesSuccessful) {
    //   throw new Error('Failed to update all product quantities');
    // }

    

    // Tính tổng giá trị đơn hàng
    const totalOrderValue = purchaseOrderDetails.reduce((sum, detail) => sum + parseFloat(detail.totalPrice), 0);
    console.log("Total Price:",totalOrderValue)
    // Cập nhật tổng giá trị vào PurchaseOrder (nếu cần)
    await newPurchaseOrder.update({ total_price: totalOrderValue });
    console.log('All product quantities updated successfully');
    return res.json({
      data: {
        purchaseOrder: newPurchaseOrder.toJSON(),
        purchaseOrderDetails: purchaseOrderDetails.map(detail => detail.toJSON())
      },
    });
    } catch (error) {
      console.log(error)
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
  getPurchaseById
};
