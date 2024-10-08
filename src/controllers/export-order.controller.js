const createError = require("http-errors");
const {ExportOrder ,ExportOrderDetail,Product, sequelize} = require("~/models");
const { generateMaPhieu } = require("~/utils");


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
       const codeExportOrder = generateMaPhieu('PX')
  
      const newExportOrder = await ExportOrder.create({
        codeExportOrder,
        customerId,
        note,
        dateExport,
        transaction
      });

       // Tạo ExportOrderDetail cho mỗi sản phẩm
    const exportOrderDetails = await Promise.all(products.map(async (product) => {
      return await ExportOrderDetail.create({
        exportOrderId: newExportOrder.id, // Sử dụng ID của ExportOrder làm khóa ngoại
        productId: product.productId,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.totalPrice,
        transaction
      });
    }));


    

    // Tính tổng giá trị đơn hàng
    const totalOrderValue = exportOrderDetails.reduce((sum, detail) => sum + parseFloat(detail.totalPrice), 0);
    console.log("Total Price:",totalOrderValue)
    // Cập nhật tổng giá trị vào ExportOrder (nếu cần)
    await newExportOrder.update({ total_price: totalOrderValue ,transaction});
    await transaction.commit();
    console.log('All product quantities updated successfully');
    return res.json({
      data: {
        ExportOrder: newExportOrder.toJSON(),
        // ExportOrderDetails: ExportOrderDetails.map(detail => detail.toJSON())
      },
    });
    } catch (error) {
      console.log(error)
      return next(createError(500));
    }
  };

const getExportById = async (req, res, next) => {
        const { id } = req.params
        console.log("ID:", id)
        try {
            const exportOrder = await ExportOrder.findByPk(id, {
                include: [
                    {
                        association: 'exportOrderDetails',
                        include: [
                            {
                                association: 'product',
                                attributes: ['id', 'product_name', 'inventory_quantity', 'price']
                            }
                        ]
                    },
                    {
                        association: 'customer',
                        attributes: ['id', 'fullName', 'contract', 'email', 'phone']
                    },
                ]
            });
    
            if (!exportOrder) {
                return next(createError(404, "Export order not found"));
            }
    
            const processedExportOrder = exportOrder.toJSON();
            
            processedExportOrder.exportOrderDetails = processedExportOrder.exportOrderDetails.map(detail => {
                const requestedQuantity = parseInt(detail.quantity, 10);
                const availableQuantity = detail.product.inventory_quantity;
                
                return {
                    id: detail.id,
                    exportOrderId: detail.exportOrderId.toString(),
                    productId: detail.productId.toString(),
                    productName: detail.product.product_name,
                    quantity: detail.quantity.toString(),
                    // unitPrice: detail.product.price.toString(), 
                    unitPrice: detail.unitPrice, // Giả sử unitPrice giống với giá sản phẩm
                    totalPrice: (parseInt(detail.quantity) * parseFloat(detail.unitPrice)).toString(),
                    isAvailable: availableQuantity >= requestedQuantity,
                    availableQuantity: availableQuantity.toString(),
                    shortageQuantity: Math.max(0, requestedQuantity - availableQuantity).toString()
                };
            });
    
            const formattedExportOrder = {
                id: processedExportOrder.id,
                codeExportOrder: processedExportOrder.codeExportOrder,
                total_price: processedExportOrder.total_price.toString(),
                dateExport: processedExportOrder.dateExport,
                customerId: processedExportOrder.customerId.toString(),
                note: processedExportOrder.note || "",
                exportOrderDetails: processedExportOrder.exportOrderDetails,
                isFullyAvailable: processedExportOrder.exportOrderDetails.every(detail => detail.isAvailable),
                customer: {
                    id: processedExportOrder.customer.id,
                    fullName: processedExportOrder.customer.fullName,
                    contract: processedExportOrder.customer.contract,
                    email: processedExportOrder.customer.email,
                    phone: processedExportOrder.customer.phone
                },
                status: processedExportOrder.status === null ? false : Boolean(processedExportOrder.status),
                createdAt: new Date(processedExportOrder.createdAt),
                updatedAt: new Date(processedExportOrder.updatedAt)
            };
    
            return res.json({
                data: formattedExportOrder
            });
        } catch (error) {
            console.error("Error in getExportById:", error);
            return next(createError(500, "An error occurred while fetching the export order"));
        }
}
const getAllExportOrder = async (req,res,next) =>{
  try {
    const exportOrders = await ExportOrder.findAll({
      include: [
        {
          association: 'customer',
          attributes: ['fullName']
        },
        {
          association: 'exportOrderDetails',
          include: [{
            association: 'product',
            attributes: ['id', 'product_name', 'inventory_quantity']
          }]
        }
      ]
    });

    const processedExportOrders = exportOrders.map(order => {
      const processedOrder = order.toJSON();
      
      processedOrder.exportOrderDetails = processedOrder.exportOrderDetails.map(detail => {
        const requestedQuantity = parseInt(detail.quantity, 10);
        const availableQuantity = detail.product.inventory_quantity;
        
        return {
          ...detail,
          isAvailable: availableQuantity >= requestedQuantity,
          availableQuantity,
          shortageQuantity: Math.max(0, requestedQuantity - availableQuantity)
        };
      });

      processedOrder.isFullyAvailable = processedOrder.exportOrderDetails.every(detail => detail.isAvailable);
      
      return processedOrder;
    });

    return res.json({
      data: processedExportOrders
    });
  } catch (error) {
    console.error("Error in getAllExportOrder:", error);
    return next(createError(500, "An error occurred while fetching export orders"));
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
    const exportOrderDetails = await ExportOrderDetail.findAll({
      where: { ExportOrderId: id },
      transaction
    });

    // Cập nhật lại số lượng sản phẩm trong kho
    // await Promise.all(exportOrderDetails.map(async (detail) => {
    //   const product = await Product.findByPk(detail.productId, { transaction });
    //   if (!product) {
    //     throw new Error(`Product with id ${detail.productId} not found`);
    //   }
      
    //   const updatedQuantity = product.inventory_quantity - parseInt(detail.quantity, 10);
      
    //   await Product.update(
    //     { inventory_quantity: updatedQuantity },
    //     { 
    //       where: { id: detail.productId },
    //       transaction 
    //     }
    //   );
    // }));

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
