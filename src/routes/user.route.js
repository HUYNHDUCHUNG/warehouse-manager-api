const  router  = require("express").Router();
const userController = require("~/controllers/user.controller")
router.post('/',userController.createUser)
router.get('/',userController.getUsers)
router.get('/:id',userController.getUserById)
router.patch('/:id',userController.updateUser)
router.delete('/:id',userController.deleteUser)
module.exports = router