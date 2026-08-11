/**
 * Pino Logger Singleton
 *
 * Design decisions:
 *  - Single logger instance shared across the entire application
 *  - pino-pretty in development for human-readable output
 *  - Structured JSON in production for log aggregation tools (Datadog, Logtail, etc.)
 *  - Redaction paths ensure passwords, tokens, and hashes are NEVER logged,
 *    even if accidentally passed into a log call
 *  - Timestamp in ISO 8601 format for universal parseability
 */

import pino from 'pino';
import { config } from '../../config/index.js';

const redactPaths = [
  'password',
  'passwordHash',
  'password_hash',
  'newPassword',
  'currentPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'refreshTokenHash',
  'refresh_token_hash',
  'authorization',
  'cookie',
  'req.headers.authorization',
  'req.headers.cookie',
  'body.password',
  'body.newPassword',
  'body.currentPassword',
  'body.token',
];

const developmentTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  },
};

export const logger = pino({
  level: config.isDevelopment ? 'debug' : 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  ...(config.isDevelopment && { transport: developmentTransport }),
  base: {
    // Include env in every log line for multi-environment log aggregation
    env: config.env,
  },
  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
});
