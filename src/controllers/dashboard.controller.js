const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/ApiResponse');

const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary();
    return ApiResponse.ok(res, 'Dashboard summary retrieved.', { summary });
  } catch (error) {
    next(error);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = await dashboardService.getCategoryBreakdown();
    return ApiResponse.ok(res, 'Category breakdown retrieved.', { breakdown });
  } catch (error) {
    next(error);
  }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const trends = await dashboardService.getMonthlyTrends();
    return ApiResponse.ok(res, 'Monthly trends retrieved.', { trends });
  } catch (error) {
    next(error);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const records = await dashboardService.getRecentActivity(limit);
    return ApiResponse.ok(res, 'Recent activity retrieved.', { records });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getRecentActivity };
