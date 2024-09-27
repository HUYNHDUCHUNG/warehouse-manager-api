const createError = require("http-errors");
const { where } = require("sequelize");
const { Product } = require("~/models");

const createProduct = async (req, res, next) => {
    try {
      const {
        product_name,
        category_id,
        description,
        price,
        unit_calc,
        inventory_quantity,
        warehouse_latest,
        quantity_warehouse_latest,
      } = req.body;
  
  
      const newProduct = await Product.create({
        product_name,
        category_id,
        description,
        price,
        unit_calc,
        inventory_quantity,
        warehouse_latest,
        quantity_warehouse_latest,
      });
  
      return res.json({
        data: newProduct.toJSON(),
      });
    } catch (error) {
      return next(createError(500));
    }
  };
const getAllProduct = async (req,res,next) =>{
    try {
        const products = await Product.findAll({
          include: [
            {
              association: 'category',
              attributes:{
                include:['name']
              }
            }
          ]
        })
        return res.json({
            data:products
        })
    } catch (error) {
        return next(createError(500))
    }
}

const getProductById = async (req,res,next) =>{
    try {
        const {id} = req.params
        console.log("ID:",id)
       
        const product = await Product.findByPk(id)
        return res.json({
            data: product
        })
    } catch (error) {
        return next(createError(500))
    
    }
}
const updateProduct = async (req,res,next) =>{
    try {
        const {id} = req.params
        console.log("ID:",id)
        const {
            product_name,
            category_id,
            description,
            price,
            unit_calc,
            inventory_quantity,
            warehouse_latest,
            quantity_warehouse_latest,
          } = req.body;
          console.log("Name:",product_name) 
        const newProduct = await Product.update(
            {
                product_name,
                category_id,
                description,
                price,
                unit_calc,
                inventory_quantity,
                warehouse_latest,
                quantity_warehouse_latest,  
            },
            {
              where:{id}   
            }
        )
        return res.json({
            data: newProduct
        })
    } catch (error) {
        return next(createError(500))
    
    }
}

const delProductById = async (req,res,next) =>{
    try {
        const {id} = req.params
        await Product.destroy({
            where:{
                id
            }
        })
        const newProducts = await Product.findAll()
        return res.json({
            data:newProducts
        })

    } catch (error) {
        return next(createError(500))
    }
}

module.exports = {
  createProduct,
  getAllProduct,
  getProductById,
  updateProduct,
  delProductById,
};
