const createError = require("http-errors");
const {PurchaseOrder ,PurchaseOrderDetail} = require("~/models");
const { generateMaPhieuNhap } = require("~/utils");


const createPurchaseOrder = async (req, res, next) => {
    try {
      const {
        supplier_id,
        note,
        dateImport,
        products

      } = req.body;
  
      console.log("note:",products)
       const codePurchaseOrder = generateMaPhieuNhap()
  
      const newPurchaseOrder = await PurchaseOrder.create({
        codePurchaseOrder,
        supplier_id,
        note,
        dateImport,
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

    // Tính tổng giá trị đơn hàng
    const totalOrderValue = purchaseOrderDetails.reduce((sum, detail) => sum + parseFloat(detail.totalPrice), 0);
    console.log("Total Price:",totalOrderValue)
    // Cập nhật tổng giá trị vào PurchaseOrder (nếu cần)
    await newPurchaseOrder.update({ total_price: totalOrderValue });

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
const getAllPurchaseOrder = async (req,res,next) =>{
    try {
        const puschaseOrder = await PurchaseOrder.findAll({
          include: [
            
            {
              association: 'supplier',
              attributes:{
                include:['supplier_name']
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

const delPurchaseOrderById = async (req,res,next) =>{
    try {
        const {id} = req.params
        await PurchaseOrder.destroy({
            where:{
                id
            }
        })
        const newPurchaseOrder = await PurchaseOrder.findAll()
        return res.json({
            data:newPurchaseOrder
        })

    } catch (error) {
        return next(createError(500))
    }
}

module.exports = {
  createPurchaseOrder,
  getAllPurchaseOrder,
  updatePurchaseOrder,
  delPurchaseOrderById,
};
