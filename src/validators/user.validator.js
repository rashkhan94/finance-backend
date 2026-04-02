const Joi = require('joi');

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  role: Joi.string().valid('viewer', 'analyst', 'admin'),
  isActive: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

module.exports = { updateUserSchema };
