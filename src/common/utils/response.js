/**
 * API Response Helpers
 *
 * Why this exists:
 *  - Enforces a consistent response envelope across ALL endpoints
 *  - Prevents individual controllers from choosing their own shapes
 *  - A single change here updates the response format everywhere
 *
 * Response contracts:
 *
 *   Success:
 *   {
 *     "success": true,
 *     "message": "...",
 *     "data": { ... },          // optional
 *     "meta": { ... }           // optional (pagination, etc.)
 *   }
 *
 *   Failure:
 *   {
 *     "success": false,
 *     "message": "...",
 *     "code": "ERROR_CODE",     // machine-readable
 *     "errors": [...]           // field-level validation errors
 *   }
 */

/**
 * Send a successful JSON response
 *
 * @param {import('express').Response} res
 * @param {object} options
 * @param {string} options.message
 * @param {unknown} [options.data]
 * @param {unknown} [options.meta]
 * @param {number} [options.statusCode]
 */
export const sendSuccess = (res, { message, data, meta, statusCode = 200 }) => {
  const body = {
    success: true,
    message,
  };

  if (data !== undefined) body.data = data;
  if (meta !== undefined) body.meta = meta;

  return res.status(statusCode).json(body);
};

/**
 * Send a failure JSON response
 *
 * @param {import('express').Response} res
 * @param {object} options
 * @param {string} options.message
 * @param {string} [options.code]
 * @param {Array} [options.errors]
 * @param {number} [options.statusCode]
 */
export const sendError = (res, { message, code, errors = [], statusCode = 500 }) => {
  const body = {
    success: false,
    message,
  };

  if (code) body.code = code;
  if (errors.length > 0) body.errors = errors;

  return res.status(statusCode).json(body);
};

/**
 * Build a paginated meta object for list endpoints
 *
 * @param {object} options
 * @param {number} options.total - Total number of records
 * @param {number} options.page - Current page (1-indexed)
 * @param {number} options.limit - Records per page
 * @returns {{ total: number, page: number, limit: number, totalPages: number, hasNext: boolean, hasPrev: boolean }}
 */
export const buildPaginationMeta = ({ total, page, limit }) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});
