const express = require('express');
const router = express.Router();
const { SalesKPI, User } = require('~/models');
const salesKPIController = require('~/controllers/kpi-user.controller')
const authMiddleware = require('~/middleware/auth');

router.get('/my-kpi', authMiddleware,salesKPIController.getMySalesKPI);
router.get('/report-kpi', salesKPIController.generateAllSaleKPIReport);

// router.put('/kpi', async (req, res) => {
//   const { userId, month, year, ...updates } = req.body;
//   const kpi = await SalesKPI.findOne({ where: { userId, month, year } });
//   if (kpi) {
//     await kpi.update(updates);
//     res.json(kpi);
//   } else {
//     res.status(404).json({ error: 'KPI record not found' });
//   }
// });

// router.post('/kpi', async (req, res) => {
//   const { userId, month, year } = req.body;
//   const kpi = await calculateMonthlyKPI(userId, month, year, { SalesKPI, User });
//   res.status(201).json(kpi);
// });

module.exports = router;