const  router  = require("express").Router();
const analyticController = require("~/controllers/analytic.controller")
router.get('/incom',analyticController.getTotalIncomeCurrentMonth)
router.get('/order',analyticController.getMonthlyOrderStats)
router.get('/purchase-order',analyticController.getMonthlyPurchaseOrderStats)
router.get('/customer',analyticController.getCustomerStats)
module.exports = router