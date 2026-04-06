const ApiError = require('../utils/ApiError');

// only lets certain roles through — use after authenticate()
// e.g. authorize('admin', 'analyst')
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
