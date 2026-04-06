const ApiError = require('../utils/ApiError');

// runs Joi validation on the incoming request data
// pass the joi schema and which part of req to check (body/query/params)
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
