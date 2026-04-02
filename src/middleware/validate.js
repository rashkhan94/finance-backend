const ApiError = require('../utils/ApiError');

/**
 * Generic validation middleware factory.
 * Takes a Joi schema and validates req.body (or req.query / req.params)
 * against it before passing control to the route handler.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // collect all errors, not just the first
      stripUnknown: true, // remove fields not defined in schema
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return next(ApiError.badRequest('Validation failed', errorDetails));
    }

    // replace the original data with the validated (and stripped) version
    req[source] = value;
    next();
  };
};

module.exports = { validate };
