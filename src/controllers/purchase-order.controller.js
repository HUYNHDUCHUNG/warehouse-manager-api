const createError = require("http-errors");
const {PurchaseOrder} = require("~/models");

const createPurchaseOrder = async (req, res, next) => {
    try {
      const {
        product_id,
        quantity,
        unit_price,
        total_price,
        supplier_id,
        note,


      } = req.body;
  
      console.log("note:",note)
  
      const newPurchaseOrder = await PurchaseOrder.create({
        product_id,
        quantity,
        unit_price,
        total_price,
        supplier_id,
        note,
      });

  
      return res.json({
        data: newPurchaseOrder.toJSON(),
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
              association: 'product',
              attributes: ['product_name']
            },
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
