const  router  = require("express").Router();
const purchaseOrderController = require("~/controllers/purchase-order.controller")
router.post('/',purchaseOrderController.createPurchaseOrder)
router.get('/',purchaseOrderController.getAllPurchaseOrder)
router.patch('/:id',purchaseOrderController.updatePurchaseOrder)
router.delete('/:id',purchaseOrderController.delPurchaseOrderById)
module.exports = router