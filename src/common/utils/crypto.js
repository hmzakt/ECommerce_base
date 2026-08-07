import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../config/index.js';

/**
 * Hash a password or refresh token using Argon2id.
 * Argon2id provides resistance against both GPU and side-channel attacks.
 *
 * @param {string} plainText
 * @returns {Promise<string>}
 */
export const hashData = async (plainText) => {
  return argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
};

/**
 * Verify a plain text string against an Argon2 hash.
 *
 * @param {string} hash
 * @param {string} plainText
 * @returns {Promise<boolean>}
 */
export const verifyHash = async (hash, plainText) => {
  try {
    return await argon2.verify(hash, plainText);
  } catch (error) {
    // If the hash format is invalid or verification fails abruptly
    return false;
  }
};

/**
 * Generate a JWT access token.
 *
 * @param {object} payload - Typically { userId, role }
 * @returns {string}
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

/**
 * Generate a secure random refresh token.
 * We do not use JWTs for refresh tokens to easily support revocation
 * and to prevent bloated database storage (storing short hash instead of large JWT).
 *
 * @returns {string} - Hex string (128 characters)
 */
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Verify a JWT access token.
 *
 * @param {string} token
 * @param {jwt.VerifyOptions} [options]
 * @returns {object} - Decoded payload
 * @throws {Error} - If token is invalid or expired
 */
export const verifyAccessToken = (token, options = {}) => {
  return jwt.verify(token, config.jwt.accessSecret, options);
};
