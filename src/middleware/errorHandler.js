const ApiError = require('../utils/ApiError');

// catches all errors from the routes and sends a nice JSON response
// express knows this is an error handler because of the 4 params
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // Mongoose duplicate key (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = ApiError.conflict(`A record with that ${field} already exists.`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = ApiError.badRequest('Validation failed', messages);
  }

  // JWT errors (fallback, most are caught in auth middleware)
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token has expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  // log unexpected errors for debugging
  if (statusCode === 500) {
    console.error('INTERNAL ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
