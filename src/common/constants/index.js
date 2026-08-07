/**
 * Application-Wide Constants
 *
 * Centralizing constants prevents magic strings scattered across the codebase.
 * All values are frozen to prevent accidental mutation at runtime.
 */

// ────────────────────────────────────────────────────────────────────────────────
// User Roles — mirrors the Prisma Role enum
// ────────────────────────────────────────────────────────────────────────────────

export const Roles = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
});

// ────────────────────────────────────────────────────────────────────────────────
// Cookie Names
// ────────────────────────────────────────────────────────────────────────────────

export const CookieNames = Object.freeze({
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
});

// ────────────────────────────────────────────────────────────────────────────────
// Pagination Defaults
// ────────────────────────────────────────────────────────────────────────────────

export const Pagination = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

// ────────────────────────────────────────────────────────────────────────────────
// Password Reset
// ────────────────────────────────────────────────────────────────────────────────

export const PasswordReset = Object.freeze({
  TOKEN_EXPIRES_IN_MINUTES: 15,
  TOKEN_BYTES: 32, // Byte length for crypto.randomBytes
});

// ────────────────────────────────────────────────────────────────────────────────
// HTTP Headers
// ────────────────────────────────────────────────────────────────────────────────

export const Headers = Object.freeze({
  AUTHORIZATION: 'authorization',
  BEARER_PREFIX: 'Bearer ',
});

// ────────────────────────────────────────────────────────────────────────────────
// Sort Orders
// ────────────────────────────────────────────────────────────────────────────────

export const SortOrder = Object.freeze({
  ASC: 'asc',
  DESC: 'desc',
});
