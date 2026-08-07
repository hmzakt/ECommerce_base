/**
 * Request Logger Middleware (Pino HTTP)
 *
 * Design decisions:
 *  - Uses pino-http to automatically log every request/response pair
 *  - Attaches `req.log` so controllers/services can log with request context
 *  - Redacts Authorization header and cookie header values
 *  - Customizes log level: 4xx → warn, 5xx → error, others → info
 *  - Serializes req/res to include only useful fields (no noise)
 *  - Skips health check endpoint logs to reduce noise in production
 */

import pinoHttp from 'pino-http';
import { logger } from '../logger/index.js';

export const requestLogger = pinoHttp({
  logger,

  // Assign log levels based on response status
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  // What to log about the request
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} → ${res.statusCode}`,

  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} → ${res.statusCode} — ${err.message}`,

  // Redact sensitive headers
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },

  // Skip health check to reduce log noise
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },

  // Serialize only what's useful
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
      userAgent: req.headers?.['user-agent'],
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
