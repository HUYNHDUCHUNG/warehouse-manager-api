const  router  = require("express").Router();
const purchaseOrderController = require("~/controllers/purchase-order.controller")
router.post('/',purchaseOrderController.createPurchaseOrder)
router.get('/',purchaseOrderController.getAllPurchaseOrder)
router.get('/:id',purchaseOrderController.getPurchaseById)
router.patch('/:id',purchaseOrderController.updatePurchaseOrder)
router.delete('/:id',purchaseOrderController.delPurchaseOrderById)
module.exports = router