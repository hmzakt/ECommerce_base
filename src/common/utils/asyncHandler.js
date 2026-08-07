/**
 * Async Handler Wrapper
 *
 * Why this exists:
 *   Express does not natively catch errors thrown from async route handlers.
 *   Without this wrapper, an unhandled promise rejection in a controller
 *   would either hang the request or crash the process.
 *
 *   This HOF wraps any async function and forwards any rejection to Express's
 *   next(err) — which routes it to the global error handler middleware.
 *
 * Usage:
 *   router.get('/path', asyncHandler(controller.method));
 *
 *   The controller method can then throw AppError or any error freely,
 *   without try/catch boilerplate in every handler.
 */

/**
 * Wraps an async Express route handler to forward errors to next()
 *
 * @param {(req: Request, res: Response, next: NextFunction) => Promise<void>} fn
 * @returns {(req: Request, res: Response, next: NextFunction) => void}
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
