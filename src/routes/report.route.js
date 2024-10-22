const  router  = require("express").Router();
const reportController = require('~/controllers/report.controller');

// Sử dụng validateDateRange làm middleware để kiểm tra dữ liệu đầu vào trước khi gọi getInventoryReport
router.get('/inventory', reportController.validateDateRange, reportController.getInventoryReport);

module.exports = router;