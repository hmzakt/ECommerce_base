import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/errorCodes.js';
import { verifyAccessToken } from '../utils/crypto.js';
import { Headers } from '../constants/index.js';

/**
 * Authentication Middleware
 *
 * Extracts the JWT from the Authorization header, verifies it,
 * and attaches the decoded payload (userId, role) to req.user.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers[Headers.AUTHORIZATION];

  if (!authHeader || !authHeader.startsWith(Headers.BEARER_PREFIX)) {
    return next(
      AppError.unauthorized(
        'Authentication required. Please provide a valid Bearer token.',
        ErrorCodes.TOKEN_MISSING,
      ),
    );
  }

  const token = authHeader.substring(Headers.BEARER_PREFIX.length);

  try {
    const decoded = verifyAccessToken(token);
    // Attach decoded user info to request
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(
        AppError.unauthorized('Access token has expired.', ErrorCodes.TOKEN_EXPIRED),
      );
    }
    
    return next(
      AppError.unauthorized('Invalid access token.', ErrorCodes.TOKEN_INVALID),
    );
  }
};

/**
 * Role-based Authorization Middleware Factory
 *
 * Checks if the authenticated user's role is included in the allowed roles.
 * MUST be used after `authenticate`.
 *
 * @param {...string} roles - Allowed roles (e.g., Roles.ADMIN, Roles.SUPER_ADMIN)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Safety check: Ensure authenticate was called first
    if (!req.user) {
      return next(
        AppError.internal('authorize middleware called before authenticate middleware'),
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          'You do not have permission to perform this action.',
          ErrorCodes.INSUFFICIENT_PERMISSIONS,
        ),
      );
    }

    next();
  };
};
