const  router  = require("express").Router();
const exportOrderController = require("~/controllers/export-order.controller")
router.post('/',exportOrderController.createExportOrder)
router.get('/',exportOrderController.getAllExportOrder)
router.get('/:id',exportOrderController.getExportById)
router.patch('/:id',exportOrderController.updateExportOrder)
router.delete('/:id',exportOrderController.delExportOrderById)
module.exports = router