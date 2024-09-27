const  router  = require("express").Router();
const productController = require("~/controllers/product.controller")
router.post('/',productController.createProduct)
router.get('/',productController.getAllProduct)
router.get('/:id',productController.getProductById)
router.patch('/:id',productController.updateProduct)
router.delete('/:id',productController.delProductById)
module.exports = router