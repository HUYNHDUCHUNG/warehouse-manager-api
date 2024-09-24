const createError = require("http-errors");
const Supplier = require("~/models/supplier");

const createSupplier = async (req, res, next) => {
    try {
      const {
        supplier_name,
        contract,
        email,
        phone,
      } = req.body;
  
  
      const newSupplier = await Supplier.create({
        supplier_name,
        contract,
        email,
        phone,
      });
  
      return res.json({
        data: newSupplier.toJSON(),
      });
    } catch (error) {
      return next(createError(500));
    }
  };
const getAllSupplier = async (req,res,next) =>{
    try {
        const suppliers = await Supplier.findAll()
        return res.json({
            data:suppliers
        })
    } catch (error) {
        return next(createError(500))
    }
}

const updateSupplier = async (req,res,next) =>{
    try {
        const {id} = req.params
        console.log("ID:",id)
        const {
            supplier_name,
            contract,
            email,
            phone,
          } = req.body;
        const newSupplier = await Supplier.update(
            {
                supplier_name,
                contract,
                email,
                phone,
            },
            {
              where:{id}   
            }
        )
        return res.json({
            data: newSupplier
        })
    } catch (error) {
        return next(createError(500))
    
    }
}

const delSupplierById = async (req,res,next) =>{
    try {
        const {id} = req.params
        await Supplier.destroy({
            where:{
                id
            }
        })
        const newSuppliers = await Supplier.findAll()
        return res.json({
            data:newSuppliers
        })

    } catch (error) {
        return next(createError(500))
    }
}

module.exports = {
  createSupplier,
  getAllSupplier,
  updateSupplier,
  delSupplierById,
};
