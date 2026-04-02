const FinancialRecord = require('../models/FinancialRecord');

/**
 * Dashboard service — aggregation queries for summary data.
 * These use MongoDB's aggregation pipeline for efficiency.
 */

/**
 * Get overall financial summary: total income, expenses, and net balance.
 */
const getSummary = async () => {
  const result = await FinancialRecord.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        totalExpenses: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      totalTransactions: 0,
    };
  }

  const { totalIncome, totalExpenses, totalTransactions } = result[0];

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netBalance: Math.round((totalIncome - totalExpenses) * 100) / 100,
    totalTransactions,
  };
};

/**
 * Get category-wise breakdown of income and expenses.
 */
const getCategoryBreakdown = async () => {
  const breakdown = await FinancialRecord.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.category',
        income: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0] },
        },
        expense: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0] },
        },
        transactionCount: { $sum: '$count' },
      },
    },
    { $sort: { transactionCount: -1 } },
  ]);

  return breakdown.map((item) => ({
    category: item._id,
    income: Math.round(item.income * 100) / 100,
    expense: Math.round(item.expense * 100) / 100,
    net: Math.round((item.income - item.expense) * 100) / 100,
    transactionCount: item.transactionCount,
  }));
};

/**
 * Get monthly trends for the last 12 months.
 */
const getMonthlyTrends = async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const trends = await FinancialRecord.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        income: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        expenses: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return trends.map((item) => ({
    year: item._id.year,
    month: item._id.month,
    income: Math.round(item.income * 100) / 100,
    expenses: Math.round(item.expenses * 100) / 100,
    net: Math.round((item.income - item.expenses) * 100) / 100,
    transactionCount: item.transactionCount,
  }));
};

/**
 * Get recent activity — latest N transactions.
 */
const getRecentActivity = async (limit = 10) => {
  const records = await FinancialRecord.find({ isDeleted: false })
    .populate('createdBy', 'name email')
    .sort({ date: -1, createdAt: -1 })
    .limit(limit);

  return records;
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getRecentActivity };
