const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// dashboard data is available to analysts and admins
router.use(authenticate, authorize('analyst', 'admin'));

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get overall financial summary (Analyst, Admin)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Total income, expenses, net balance, transaction count
 */
router.get('/summary', dashboardController.getSummary);

/**
 * @swagger
 * /api/dashboard/category-breakdown:
 *   get:
 *     summary: Get category-wise income/expense breakdown (Analyst, Admin)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Array of categories with income, expense, net totals
 */
router.get('/category-breakdown', dashboardController.getCategoryBreakdown);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get monthly trends for the past 12 months (Analyst, Admin)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Monthly income, expenses, and net data
 */
router.get('/trends', dashboardController.getMonthlyTrends);

/**
 * @swagger
 * /api/dashboard/recent-activity:
 *   get:
 *     summary: Get recent financial activity (Analyst, Admin)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Latest financial records
 */
router.get('/recent-activity', dashboardController.getRecentActivity);

module.exports = router;
