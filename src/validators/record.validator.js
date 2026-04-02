const Joi = require('joi');

const VALID_CATEGORIES = [
  'salary', 'freelance', 'investments', 'rent', 'utilities',
  'groceries', 'transport', 'entertainment', 'healthcare',
  'education', 'shopping', 'travel', 'insurance', 'taxes', 'other',
];

const createRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required',
  }),
  type: Joi.string().valid('income', 'expense').required().messages({
    'any.only': 'Type must be either income or expense',
    'any.required': 'Type is required',
  }),
  category: Joi.string().valid(...VALID_CATEGORIES).required().messages({
    'any.only': `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    'any.required': 'Category is required',
  }),
  date: Joi.date().iso().max('now').default(Date.now).messages({
    'date.max': 'Date cannot be in the future',
  }),
  description: Joi.string().trim().max(300).allow('').default(''),
});

const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string().valid(...VALID_CATEGORIES),
  date: Joi.date().iso().max('now'),
  description: Joi.string().trim().max(300).allow(''),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// query params validation for listing / filtering records
const queryRecordsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string().valid(...VALID_CATEGORIES),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  sortBy: Joi.string().valid('date', 'amount', 'createdAt').default('date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().trim().max(100),
});

module.exports = { createRecordSchema, updateRecordSchema, queryRecordsSchema };
