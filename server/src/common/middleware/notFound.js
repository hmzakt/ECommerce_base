/**
 * 404 Not Found Handler
 *
 * Placed after all routes. If a request reaches this middleware,
 * no route matched — generate a clean 404 AppError and pass it
 * to the global error handler via next().
 */

import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/errorCodes.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
export const notFound = (req, _res, next) => {
  next(
    AppError.notFound(
      `Route not found: ${req.method} ${req.originalUrl}`,
      ErrorCodes.NOT_FOUND,
    ),
  );
};
