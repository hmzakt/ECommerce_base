/**
 * AppError — Base Application Error Class
 *
 * Design decisions:
 *  - Extends native Error to work with instanceof checks and error middleware
 *  - `isOperational` flag distinguishes expected business errors (4xx) from
 *    unexpected programmer bugs (5xx). Only operational errors expose details
 *    to clients. Non-operational errors get a generic 500 response.
 *  - `errors` array carries field-level validation details (matching Zod output)
 *  - `code` is a machine-readable string from ErrorCodes registry
 *  - Stack trace is captured explicitly for reliable source tracking in logs
 *
 * Usage:
 *   throw new AppError('Email already taken', 409, ErrorCodes.EMAIL_ALREADY_TAKEN);
 *   throw new AppError('Validation failed', 422, ErrorCodes.VALIDATION_ERROR, errors);
 */

import { ErrorCodes } from './errorCodes.js';

export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Machine-readable error code from ErrorCodes
   * @param {Array<{field?: string, message: string}>} errors - Field-level error details
   * @param {boolean} isOperational - true for expected errors, false for programmer bugs
   */
  constructor(
    message,
    statusCode = 500,
    code = ErrorCodes.INTERNAL_SERVER_ERROR,
    errors = [],
    isOperational = true,
  ) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = isOperational;

    // Capture stack trace, excluding the constructor call itself
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Static factory methods for common error types ───────────────────────────

  static badRequest(message, code = ErrorCodes.BAD_REQUEST, errors = []) {
    return new AppError(message, 400, code, errors);
  }

  static unauthorized(message = 'Authentication required', code = ErrorCodes.UNAUTHORIZED) {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'Access denied', code = ErrorCodes.FORBIDDEN) {
    return new AppError(message, 403, code);
  }

  static notFound(message = 'Resource not found', code = ErrorCodes.NOT_FOUND) {
    return new AppError(message, 404, code);
  }

  static conflict(message, code = ErrorCodes.USER_ALREADY_EXISTS) {
    return new AppError(message, 409, code);
  }

  static unprocessable(message, errors = [], code = ErrorCodes.VALIDATION_ERROR) {
    return new AppError(message, 422, code, errors);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500, ErrorCodes.INTERNAL_SERVER_ERROR, [], false);
  }
}
