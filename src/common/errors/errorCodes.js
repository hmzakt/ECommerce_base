/**
 * Centralized Error Code Registry
 *
 * Why this exists:
 *  - String error codes (like HTTP status codes alone) are insufficient for
 *    clients to handle errors programmatically
 *  - A machine-readable `code` field lets frontends and API consumers act
 *    on specific error types without parsing human-readable messages
 *  - Centralizing codes prevents duplication and inconsistency
 */

export const ErrorCodes = Object.freeze({
  // ── Generic ────────────────────────────────────────────────────────────────
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',

  // ── Authentication ──────────────────────────────────────────────────────────
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_MISSING: 'TOKEN_MISSING',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',

  // ── Authorization ───────────────────────────────────────────────────────────
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // ── User ────────────────────────────────────────────────────────────────────
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_TAKEN: 'EMAIL_ALREADY_TAKEN',
  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',

  // ── Password Reset ──────────────────────────────────────────────────────────
  RESET_TOKEN_INVALID: 'RESET_TOKEN_INVALID',
  RESET_TOKEN_EXPIRED: 'RESET_TOKEN_EXPIRED',

  // ── Rate Limiting ───────────────────────────────────────────────────────────
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // ── Cart ────────────────────────────────────────────────────────────────────
  CART_NOT_FOUND: 'CART_NOT_FOUND',
  CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
  CART_ITEM_PRODUCT_INACTIVE: 'CART_ITEM_PRODUCT_INACTIVE',
  CART_ITEM_OWNERSHIP_VIOLATION: 'CART_ITEM_OWNERSHIP_VIOLATION',

  // ── Order & Checkout ─────────────────────────────────────────────────────────
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  CART_EMPTY: 'CART_EMPTY',
  ORDER_INVALID_STATUS_TRANSITION: 'ORDER_INVALID_STATUS_TRANSITION',
});
