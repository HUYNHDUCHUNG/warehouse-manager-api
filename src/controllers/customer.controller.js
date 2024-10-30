const createError = require("http-errors");
const {Customer} = require("~/models");

const createCustomer = async (req, res, next) => {
    try {
      const {
        fullName,
        contract,
        email,
        phone,
        type,
      } = req.body;
      // console.log("name:",email)
  
      const newCustomer = await Customer.create({
        fullName,
        contract,
        email,
        phone,
        type,

      })
  
      return res.json({
        data: newCustomer.toJSON(),
      });
    } catch (error) {
      console.log("erro:",error)
      return next(createError(500));
    }
  };
const getAllCustomer = async (req,res,next) =>{
    try {
        const customers = await Customer.findAll()
        console.log(customers)
        return res.json({
            data:customers
        })
    } catch (error) {
     
        return next(createError(500))
    }
}

const updateCustomer = async (req,res,next) =>{
    try {
        const {id} = req.params
        console.log("ID:",id)
        const {
            fullName,
            contract,
            email,
            phone,
            type,
          } = req.body;
        const newCustomer = await Customer.update(
            {
                fullName,
                contract,
                email,
                phone,
                type,

            },
            {
              where:{id}   
            }
        )
        return res.json({
            data: newCustomer
        })
    } catch (error) {
        return next(createError(500))
    
    }
}

const delCustomerById = async (req,res,next) =>{
    try {
        const {id} = req.params
        await Customer.destroy({
            where:{
                id
            }
        })
        const newCustomers = await Customer.findAll()
        return res.json({
            data:newCustomers
        })

    } catch (error) {
        return next(createError(500))
    }
}

module.exports = {
  createCustomer,
  getAllCustomer,
  updateCustomer,
  delCustomerById,
};
