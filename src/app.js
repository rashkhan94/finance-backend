const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const routes = require('./routes');
const swaggerSpec = require('./config/swagger');
const { errorHandler } = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

// ── Security headers ─────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));

// ── Request logging ──────────────────────────────────────
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// ── Body parsers ─────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ────────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── API documentation ────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none } .swagger-ui .info hgroup.main .version-stamp, .swagger-ui .info hgroup.main .version, .swagger-ui .info .title span { display: none !important; }',
  customSiteTitle: 'Finance API Docs',
}));

// ── API routes ───────────────────────────────────────────
app.use('/api', routes);

// ── Root endpoint ────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Finance Dashboard API',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/api/health',
  });
});

// ── 404 handler for unknown routes ───────────────────────
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

// ── Global error handler ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
