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

/**
 * Generate a JWT for email verification.
 */
export const generateEmailVerificationToken = (userId) => {
  return jwt.sign({ userId, type: 'email_verification' }, config.jwt.accessSecret, {
    expiresIn: '1d',
  });
};

/**
 * Verify an email verification token.
 */
export const verifyEmailVerificationToken = (token) => {
  const decoded = jwt.verify(token, config.jwt.accessSecret);
  if (decoded.type !== 'email_verification') {
    throw new Error('Invalid token type');
  }
  return decoded;
};

/**
 * Encrypt sensitive data using AES-256-GCM.
 * Formats output as `iv:authTag:encryptedHex`.
 *
 * @param {string|object} data
 * @param {string} [key]
 * @returns {string}
 */
export const encryptData = (data, key = config.cookies.secret) => {
  const plainText = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const iv = crypto.randomBytes(12);
  const derivedKey = crypto.createHash('sha256').update(key).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt sensitive data encrypted with AES-256-GCM.
 *
 * @param {string} cipherText
 * @param {string} [key]
 * @returns {string|object}
 */
export const decryptData = (cipherText, key = config.cookies.secret) => {
  if (!cipherText || !cipherText.includes(':')) {
    return null;
  }

  const [ivHex, authTagHex, encryptedHex] = cipherText.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) {
    return null;
  }

  const derivedKey = crypto.createHash('sha256').update(key).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
};

