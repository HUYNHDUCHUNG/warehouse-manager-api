const  router  = require("express").Router();
const purchaseOrderController = require("~/controllers/purchase-order.controller");
const authMiddleware = require("~/middleware/auth");
const { upload } = require("~/middleware/upload-file");
router.post('/', authMiddleware,
    purchaseOrderController.checkAndUpdateSuggestionStatus, 
    purchaseOrderController.createPurchaseOrder)

router.post('/import-file',
    upload.single('file'),
    purchaseOrderController.importFilePurchaseOrder)
router.get('/',purchaseOrderController.getAllPurchaseOrder)
router.get('/:id',purchaseOrderController.getPurchaseById)
router.patch('/:id',purchaseOrderController.updatePurchaseOrder)
router.delete('/:id',purchaseOrderController.delPurchaseOrderById)
module.exports = router