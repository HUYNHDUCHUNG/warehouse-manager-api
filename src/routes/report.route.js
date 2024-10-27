const  router  = require("express").Router();
const reportController = require('~/controllers/report.controller');

// Sử dụng validateDateRange làm middleware để kiểm tra dữ liệu đầu vào trước khi gọi getInventoryReport
router.get('/inventory', reportController.validateDateRange, reportController.getInventoryReport);
router.get('/stats',reportController.getOverallStats)
router.get('/monthly',reportController.getMonthlyRevenue)
router.get('/employees',reportController.getEmployeeStats)
module.exports = router;