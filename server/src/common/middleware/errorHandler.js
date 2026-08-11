/**
 * Global Error Handler Middleware
 *
 * Design decisions:
 *  - Single centralized error handler — the only place that sends error responses
 *  - Handles four distinct error categories:
 *    1. AppError (our own operational errors)
 *    2. ZodError (validation failures from request validators)
 *    3. Prisma known errors (constraint violations, record not found)
 *    4. Unknown/unhandled errors (programmer bugs — generic 500, no details leaked)
 *  - isOperational=false errors (bugs) are logged at error level with full stack
 *  - Operational errors are logged at warn level (expected business errors)
 *  - Stack traces NEVER reach the client in any error category
 *  - Must be registered LAST in the Express middleware chain (4 parameters)
 */

import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/errorCodes.js';
import { logger } from '../logger/index.js';
import { config } from '../../config/index.js';

/**
 * Transform a ZodError into our standard field-level error array
 *
 * @param {ZodError} error
 * @returns {Array<{ field: string, message: string }>}
 */
const formatZodErrors = (error) =>
  error.errors.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

/**
 * Map Prisma known error codes to AppErrors
 *
 * @param {Prisma.PrismaClientKnownRequestError} error
 * @returns {AppError}
 */
const handlePrismaKnownError = (error) => {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const fields = error.meta?.target ?? ['field'];
      return AppError.conflict(
        `A record with this ${fields.join(', ')} already exists.`,
        ErrorCodes.USER_ALREADY_EXISTS,
      );
    }
    case 'P2025':
      // Record not found (e.g., update/delete on non-existent row)
      return AppError.notFound('The requested record was not found.', ErrorCodes.NOT_FOUND);

    case 'P2003':
      // Foreign key constraint
      return AppError.badRequest(
        'Related record not found.',
        ErrorCodes.BAD_REQUEST,
      );

    default:
      return AppError.internal('A database error occurred.');
  }
};

/**
 * Global error handling middleware
 * Must have exactly 4 parameters for Express to treat it as error middleware
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  // ── 1. AppError (our operational errors) ─────────────────────────────────────
  if (err instanceof AppError) {
    const logLevel = err.isOperational ? 'warn' : 'error';

    logger[logLevel](
      {
        err: {
          message: err.message,
          code: err.code,
          statusCode: err.statusCode,
          // Only include stack in non-operational (bug) errors
          ...(config.isDevelopment && { stack: err.stack }),
        },
        req: { method: req.method, url: req.originalUrl },
      },
      `AppError: ${err.message}`,
    );

    const body = {
      success: false,
      message: err.isOperational ? err.message : 'An unexpected error occurred.',
      code: err.code,
    };

    if (err.errors && err.errors.length > 0) {
      body.errors = err.errors;
    }

    return res.status(err.statusCode).json(body);
  }

  // ── 2. ZodError (validation failures) ────────────────────────────────────────
  if (err instanceof ZodError) {
    logger.warn(
      { validationErrors: formatZodErrors(err), req: { method: req.method, url: req.originalUrl } },
      'Request validation failed',
    );

    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      code: ErrorCodes.VALIDATION_ERROR,
      errors: formatZodErrors(err),
    });
  }

  // ── 3. Prisma known errors ────────────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaKnownError(err);

    logger.warn(
      { prismaCode: err.code, meta: err.meta, req: { method: req.method, url: req.originalUrl } },
      `Prisma error [${err.code}]: ${err.message}`,
    );

    return res.status(appError.statusCode).json({
      success: false,
      message: appError.message,
      code: appError.code,
    });
  }

  // ── 4. Unknown / unhandled errors (programmer bugs) ───────────────────────────
  logger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      req: { method: req.method, url: req.originalUrl },
    },
    'Unhandled error',
  );

  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again later.',
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
  });
};
