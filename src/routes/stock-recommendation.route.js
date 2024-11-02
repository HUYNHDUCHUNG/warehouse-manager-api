const  router  = require("express").Router();
const stockRecommendationController = require("~/controllers/stock-recommendation.controller")
router.get('/inventory',stockRecommendationController.getInventoryRecommendations)
router.get('/unprocessed-orders/:id',stockRecommendationController.getUnprocessedExportOrderDetails)
router.get('/',stockRecommendationController.markExportOrderAsProcessed)
module.exports = router
