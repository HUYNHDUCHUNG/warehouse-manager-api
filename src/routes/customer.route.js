const  router  = require("express").Router();
const customerController = require("~/controllers/customer.controller")
router.post('/',customerController.createCustomer)
router.get('/',customerController.getAllCustomer)
router.patch('/:id',customerController.updateCustomer)
router.delete('/:id',customerController.delCustomerById)
module.exports = router