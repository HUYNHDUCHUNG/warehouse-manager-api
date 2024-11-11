const  router  = require("express").Router();
const stockRecommendationController = require("~/controllers/stock-recommendation.controller");
const authMiddleware = require("~/middleware/auth");
router.get('/inventory',stockRecommendationController.getInventoryRecommendations)
router.get('/unprocessed-orders/:productId',stockRecommendationController.getUnprocessedExportOrderDetails)
router.post('/import-suggestions',authMiddleware,stockRecommendationController.createImportSuggestion)
// router.get('/',stockRecommendationController.markExportOrderAsProcessed)
module.exports = router
