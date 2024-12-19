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
const updateCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params
        const { name } = req.body
        
        // Update category
        const [updatedCount] = await Category.update(
            { name },
            { 
                where: { id: id }  // Sửa lại cú pháp where
            }
        )

        if (updatedCount === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy danh mục'
            })
        }

        // Fetch updated category to return
        const updatedCategory = await Category.findByPk(id)
        
        return res.json({data:updatedCategory})

    } catch (error) {
        console.error('Update error:', error)
        return next(error)
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