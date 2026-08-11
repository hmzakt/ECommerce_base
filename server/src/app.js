/**
 * Express Application Factory
 *
 * This module exports a factory function (not a running server).
 * Separating the app from the server allows:
 *  1. Integration tests to import the app without binding a port
 *  2. Clean startup/shutdown logic in server.js
 *  3. Easier future extension (e.g., multiple transport protocols)
 *
 * Middleware order is intentional:
 *  1. Security headers first (Helmet) — before any response is sent
 *  2. CORS — must come before route handlers to handle preflight OPTIONS
 *  3. Compression — compress response bodies
 *  4. Rate limiting — before parsing body (reject early)
 *  5. Cookie parser — needed by auth middleware in subsequent milestones
 *  6. Body parsers — parse after rate limit check
 *  7. Request logger — log the incoming request with parsed context
 *  8. Routes — business logic
 *  9. 404 handler — catch unmatched routes
 *  10. Error handler — must be last, must have 4 parameters
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

import { config } from './config/index.js';
import { requestLogger } from './common/middleware/requestLogger.js';
import { notFound } from './common/middleware/notFound.js';
import { errorHandler } from './common/middleware/errorHandler.js';
import { ErrorCodes } from './common/errors/errorCodes.js';
import router from './routes/index.js';

export const createApp = () => {
  const app = express();

  // ── 1. Security Headers (Helmet) ─────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction,   // Enable CSP only in production
      crossOriginEmbedderPolicy: config.isProduction,
    }),
  );

  // ── 2. CORS ───────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        if (config.cors.origins.includes(origin)) {
          return callback(null, true);
        }

        callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
      },
      credentials: true,           // Required for HTTP-only cookie cross-origin
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );

  // ── 3. Compression ────────────────────────────────────────────────────────────
  app.use(compression());

  // ── 4. Rate Limiting ──────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: 'draft-7',   // RateLimit headers per IETF draft
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests. Please try again later.',
      code: ErrorCodes.TOO_MANY_REQUESTS,
    },
    // Stricter limits for auth endpoints (applied in auth router in Milestone 2)
    skip: (req) => req.url === '/health',
  });

  app.use(limiter);

  // ── 5. Cookie Parser ──────────────────────────────────────────────────────────
  app.use(cookieParser(config.cookies.secret));

  // ── 6. Body Parsers ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));       // Limit body size to prevent abuse
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ── 7. Request Logger ─────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── 8. Trust proxy (required when behind nginx/load balancer) ─────────────────
  // Only trust the first proxy to prevent IP spoofing
  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  // ── 9. Routes ─────────────────────────────────────────────────────────────────
  app.use('/api/v1', router);

  // ── 10. 404 Handler ───────────────────────────────────────────────────────────
  app.use(notFound);

  // ── 11. Global Error Handler (MUST be last, MUST have 4 params) ───────────────
  app.use(errorHandler);

  return app;
};
