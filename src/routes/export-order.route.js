const  router  = require("express").Router();
const exportOrderController = require("~/controllers/export-order.controller");
const authMiddleware = require("~/middleware/auth");
router.post('/',authMiddleware,exportOrderController.createExportOrder)
router.get('/',exportOrderController.getAllExportOrder)
router.get('/sale',authMiddleware,exportOrderController.getAllExportOrderByUser)
router.get('/:id',exportOrderController.getExportById)
router.patch('/:id',exportOrderController.updateOrderStatus)
router.delete('/:id',exportOrderController.delExportOrderById)
module.exports = router