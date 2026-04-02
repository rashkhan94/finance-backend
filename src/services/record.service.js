const FinancialRecord = require('../models/FinancialRecord');
const ApiError = require('../utils/ApiError');

/**
 * Create a new financial record.
 */
const createRecord = async (data, userId) => {
  const record = await FinancialRecord.create({
    ...data,
    createdBy: userId,
  });
  return record;
};

/**
 * Get records with filtering, sorting, and pagination.
 */
const getRecords = async (query) => {
  const {
    page = 1,
    limit = 20,
    type,
    category,
    startDate,
    endDate,
    sortBy = 'date',
    sortOrder = 'desc',
    search,
  } = query;

  // build filter object dynamically
  const filter = {};

  if (type) filter.type = type;
  if (category) filter.category = category;

  // date range filter
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  // text search on description field
  if (search) {
    filter.description = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [records, total] = await Promise.all([
    FinancialRecord.find(filter)
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    FinancialRecord.countDocuments(filter),
  ]);

  return {
    records,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      limit,
    },
  };
};

/**
 * Get a single record by its ID.
 */
const getRecordById = async (recordId) => {
  const record = await FinancialRecord.findById(recordId).populate('createdBy', 'name email');
  if (!record) {
    throw ApiError.notFound('Financial record not found.');
  }
  return record;
};

/**
 * Update a financial record.
 */
const updateRecord = async (recordId, updates) => {
  const record = await FinancialRecord.findById(recordId);
  if (!record) {
    throw ApiError.notFound('Financial record not found.');
  }

  Object.keys(updates).forEach((key) => {
    record[key] = updates[key];
  });

  await record.save();
  return record;
};

/**
 * Soft-delete a financial record.
 */
const deleteRecord = async (recordId) => {
  const record = await FinancialRecord.findById(recordId);
  if (!record) {
    throw ApiError.notFound('Financial record not found.');
  }

  record.isDeleted = true;
  await record.save();

  return { message: 'Record deleted successfully.' };
};

module.exports = { createRecord, getRecords, getRecordById, updateRecord, deleteRecord };
