const ApiError = require('../utils/ApiError');

/**
 * Role-based access control middleware.
 * Usage: authorize('admin', 'analyst')  — allows only those roles through.
 *
 * Must be used AFTER the authenticate middleware so req.user is available.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required before authorization.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to perform this action. Required: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
