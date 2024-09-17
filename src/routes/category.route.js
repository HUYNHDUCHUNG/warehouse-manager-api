const  router  = require("express").Router();
const categoryController = require("~/controllers/category.controller")
router.post('/',categoryController.createCategory)
router.get('/',categoryController.getAllCategory)
router.delete('/:id',categoryController.delCategoryById)
module.exports = router