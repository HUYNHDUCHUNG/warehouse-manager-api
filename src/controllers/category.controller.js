const createError = require('http-errors')
const { where } = require('sequelize')
const {Category} = require('~/models')

const createCategory = async (req,res,next) => {
    try{
        const {name} = req.body
        console.log("test",name)
        const newCategory = await Category.create({
            name
        })

        return res.json({
            data: newCategory.toJSON()
        })
    }catch(error) {
        return next(createError(500))
    }
}

const getAllCategory = async (req,res,next) =>{
    try {
        const Categories = await Category.findAll()
        return res.json({
            data:Categories
        }) 
    } catch (error) {
        return next(createError(500))
    }
}
const updateCategoryById = async (req,res,next) =>{
    try {
        const {id,name} = req.params
        const newCategory = await Category.update({
            name
        },
        {
            where: id
        }
        )
        return res.json({
            data:newCategory
        })
        
    } catch (error) {
        return next(createError(500))
    }
}

const delCategoryById = async (req,res,next) =>{
    try {
        const {id} = req.params
        await Category.destroy({
            where:{
                id
            }
        })
        const newCategories = await Category.findAll()
        return res.json({
            data:newCategories
        })
        
    } catch (error) {
        return next(createError(500))
    }
}

module.exports ={
    createCategory,
    getAllCategory,
    delCategoryById,
    updateCategoryById
}