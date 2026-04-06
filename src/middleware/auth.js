const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// checks the JWT token from Authorization header and loads the user
// has to run before any protected route
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];

    // verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token has expired. Please log in again.');
      }
      throw ApiError.unauthorized('Invalid token.');
    }

    // make sure user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Contact an admin.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
