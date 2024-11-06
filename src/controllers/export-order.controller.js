const createError = require("http-errors");
const { where } = require("sequelize");
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

      const userId = req.user.id
  
      console.log("note:",products)
       const codeExportOrder = generateMaPhieu('PX')
  
      const newExportOrder = await ExportOrder.create({
        codeExportOrder,
        customerId,
        note,
        dateExport,
        status: false,
        userId,
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
                    {
                      association: 'user',
                      attributes: {
                        exclude:['password']
                      }
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
        },
        {
          association: 'user',
          attributes: {
            exclude:['password']
          }
        },
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

const getAllExportOrderByUser = async (req,res,next) =>{
  try {
    const userId = req.user.id
    const exportOrders = await ExportOrder.findAll({
      where: {
          userId
      },
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
          },
          {
              association: 'user',
              attributes: {
                  exclude: ['password']
              }
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

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;  // ID đơn hàng từ URL
  try {
    // Tìm đơn hàng theo orderId
    const order = await ExportOrder.findOne({
      where: { id },
      include: [
        {
          model: ExportOrderDetail,
          as: 'exportOrderDetails'
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Kiểm tra xem đơn hàng đã được xác nhận chưa (tránh xác nhận nhiều lần)
    if (order.status == 1) {
      return res.status(400).json({ message: 'Order is already confirmed' });
    }

    // Bắt đầu transaction
    const transaction = await sequelize.transaction();

    try {
      // Trừ số lượng sản phẩm tồn kho dựa trên chi tiết đơn hàng
      for (let detail of order.exportOrderDetails) {
        const product = await Product.findOne({ where: { id: detail.productId } });

        if (!product) {
          throw new Error(`Product with ID ${detail.productId} not found`);
        }

        const updatedQuantity = product.inventory_quantity - parseInt(detail.quantity);

        if (updatedQuantity < 0) {
          throw new Error(`Not enough inventory for product ${product.product_name}`);
        }

        // Cập nhật số lượng tồn kho
        await product.update({ inventory_quantity: updatedQuantity }, { transaction });
      }

      // Cập nhật trạng thái đơn hàng thành đã xác nhận (status = true)
      await order.update({ status: 1 }, { transaction });

      // Commit transaction
      await transaction.commit();

      return res.json({ message: 'Order confirmed and inventory updated' });

    } catch (error) {
      // Rollback transaction nếu có lỗi
      await transaction.rollback();
      console.error('Error confirming order:', error);
      return res.status(500).json({ message: error.message });
    }

  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

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
  updateOrderStatus,
  delExportOrderById,
  getExportById,
  getAllExportOrderByUser
};
