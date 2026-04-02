require('dotenv').config();

/*
  Centralised config — pulls everything from environment variables
  with sensible defaults for local development.
*/
const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  env: process.env.NODE_ENV || 'development',

  // set USE_MEMORY_DB=true to skip external MongoDB entirely
  useMemoryDB: process.env.USE_MEMORY_DB === 'true',

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/finance_db',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default_dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
};

module.exports = config;
