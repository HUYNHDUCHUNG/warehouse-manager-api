const  router  = require("express").Router();
const dashboardController = require("~/controllers/dashboard.controller")
router.get('/incom',dashboardController.getTotalIncomeCurrentMonth)
router.get('/order',dashboardController.getMonthlyOrderStats)
router.get('/purchase-order',dashboardController.getMonthlyPurchaseOrderStats)
module.exports = router