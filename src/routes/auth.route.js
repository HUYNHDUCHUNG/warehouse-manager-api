const  router  = require("express").Router();
const authController = require("~/controllers/auth.controller")
router.post('/login', authController.login);
// router.post('/add', authController.login);
// router.get('/',categoryController.getAllCategory)
// router.delete('/:id',categoryController.delCategoryById)
module.exports = router