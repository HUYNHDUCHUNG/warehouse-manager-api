const  router  = require("express").Router();
const authController = require("~/controllers/auth.controller");
const authMiddleware = require("~/middleware/auth");
router.post('/login', authController.login);
router.get('/me', authMiddleware,authController.getMe);
// router.post('/add', authController.login);
// router.get('/',categoryController.getAllCategory)
// router.delete('/:id',categoryController.delCategoryById)
module.exports = router