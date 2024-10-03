const createError = require("http-errors");
const {ExportOrder ,ExportOrderDetail,Product, sequelize} = require("~/models");
const { generateMaPhieuNhap } = require("~/utils");


const createExportOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
    try {
      const {
        customerId,
        note,
        dateExport,
        products

      } = req.body;
  
      console.log("note:",products)
       const codeExportOrder = generateMaPhieuNhap()
  
      const newExportOrder = await ExportOrder.create({
        codeExportOrder,
        customerId,
        note,
        dateExport,
      });

       // Tạo ExportOrderDetail cho mỗi sản phẩm
    const exportOrderDetails = await Promise.all(products.map(async (product) => {
      return await ExportOrderDetail.create({
        exportOrderId: newExportOrder.id, // Sử dụng ID của ExportOrder làm khóa ngoại
        productId: product.productId,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.totalPrice
      });
    }));
    // Cập nhật số lượng tồn kho cho sản phẩm
    // const updateInventoryProduct = await Promise.all(products.map(async (product) => {
    //   const currentProduct = await Product.findByPk(product.productId);
    //   if (!currentProduct) {
    //     throw new Error(`Product with id ${product.productId} not found`);
    //   }
      
    //   const newQuantity = currentProduct.inventory_quantity + parseInt(product.quantity, 10);
      
    //   return await Product.update(
    //     { inventory_quantity: newQuantity },
    //     { where: { id: product.productId } }
    //   );
    // }));


    

    // Tính tổng giá trị đơn hàng
    const totalOrderValue = exportOrderDetails.reduce((sum, detail) => sum + parseFloat(detail.totalPrice), 0);
    console.log("Total Price:",totalOrderValue)
    // Cập nhật tổng giá trị vào ExportOrder (nếu cần)
    await newExportOrder.update({ total_price: totalOrderValue });
    await transaction.commit();
    console.log('All product quantities updated successfully');
    return res.json({
      data: {
        ExportOrder: newExportOrder.toJSON(),
        ExportOrderDetails: ExportOrderDetails.map(detail => detail.toJSON())
      },
    });
    } catch (error) {
      console.log(error)
      return next(createError(500));
    }
  };

  const getExportById = async (req,res,next) =>{
    const {id} = req.params
        console.log("ID:",id)
    try {
        const puschaseOrder = await ExportOrder.findByPk(id,{
          include: [
            {
              association: 'exportOrderDetails',
              include: [
                {
                  association: 'product'
                }
              ]
            },
            {
              association: 'customer',
              attributes:{
                include:['fullName']
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
const getAllExportOrder = async (req,res,next) =>{
    try {
        const puschaseOrder = await ExportOrder.findAll({
          include: [
            
            {
              association: 'customer',
              attributes:{
                include:['fullName']
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

const updateExportOrder = async (req,res,next) =>{
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
        const newExportOrder = await ExportOrder.update(
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
            data: newExportOrder
        })
    } catch (error) {
        return next(createError(500))
    
    }
}

const delExportOrderById = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    // Lấy thông tin chi tiết của Export order trước khi xóa
    const ExportOrderDetails = await ExportOrderDetail.findAll({
      where: { ExportOrderId: id },
      transaction
    });

    // Cập nhật lại số lượng sản phẩm trong kho
    await Promise.all(ExportOrderDetails.map(async (detail) => {
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

    // Xóa tất cả Export order details
    await ExportOrderDetail.destroy({
      where: { ExportOrderId: id },
      transaction
    });

    // Xóa Export order
    await ExportOrder.destroy({
      where: { id },
      transaction
    });

    // Commit transaction nếu mọi thứ thành công
    await transaction.commit();

    // Lấy danh sách Export orders mới
    const newExportOrders = await ExportOrder.findAll();

    return res.json({
      message: "Export order deleted successfully and inventory updated",
      data: newExportOrders
    });

  } catch (error) {
    // Rollback transaction nếu có lỗi
    await transaction.rollback();
    console.error("Error in delExportOrderById:", error);
    return next(createError(500, "An error occurred while deleting the Export order"));
  }
};

module.exports = {
  createExportOrder,
  getAllExportOrder,
  updateExportOrder,
  delExportOrderById,
  getExportById
};
