import { userRepository } from '../users/user.repository.js';
import {
  hashData,
  verifyHash,
  generateAccessToken,
  generateRefreshToken,
} from '../../common/utils/crypto.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/errorCodes.js';
import { logger } from '../../common/logger/index.js';

/**
 * Authentication Service
 *
 * Contains all business logic for authentication.
 * Does not know about HTTP concepts (req, res, cookies).
 */

export const authService = {
  /**
   * Register a new user.
   */
  register: async ({ firstName, lastName, email, password, phone }) => {
    // 1. Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw AppError.conflict('Email is already registered.', ErrorCodes.EMAIL_ALREADY_TAKEN);
    }

    // 2. Hash password
    const passwordHash = await hashData(password);

    // 3. Create user
    const user = await userRepository.create({
      firstName,
      lastName,
      email,
      passwordHash,
      phone,
    });

    // 4. Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken();

    // 5. Store hashed refresh token in DB
    const refreshTokenHash = await hashData(refreshToken);
    await userRepository.updateRefreshToken(user.id, refreshTokenHash);

    logger.info({ userId: user.id }, 'New user registered successfully');

    // 6. Return user details (without sensitive fields) and tokens
    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Login an existing user.
   */
  login: async ({ email, password }) => {
    // Generic error to prevent email enumeration
    const invalidCredentialsError = AppError.unauthorized(
      'Invalid email or password',
      ErrorCodes.INVALID_CREDENTIALS,
    );

    // 1. Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw invalidCredentialsError;
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account has been deactivated.', ErrorCodes.ACCOUNT_DEACTIVATED);
    }

    // 2. Verify password
    const isValidPassword = await verifyHash(user.passwordHash, password);
    if (!isValidPassword) {
      // Log failed attempts for security monitoring
      logger.warn({ userId: user.id, email }, 'Failed login attempt: invalid password');
      throw invalidCredentialsError;
    }

    // 3. Generate new tokens
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken();

    // 4. Update refresh token hash in DB (invalidates any previous session)
    const refreshTokenHash = await hashData(refreshToken);
    await userRepository.updateRefreshToken(user.id, refreshTokenHash);

    logger.info({ userId: user.id }, 'User logged in successfully');

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Refresh access token using a valid refresh token.
   * Implements Refresh Token Rotation.
   */
  refresh: async (userId, rawRefreshToken) => {
    // 1. Find user
    const user = await userRepository.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw AppError.unauthorized('Invalid refresh token.', ErrorCodes.REFRESH_TOKEN_INVALID);
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account has been deactivated.', ErrorCodes.ACCOUNT_DEACTIVATED);
    }

    // 2. Verify the raw token matches the stored hash
    const isValidToken = await verifyHash(user.refreshTokenHash, rawRefreshToken);
    if (!isValidToken) {
      // Possible token theft / replay attack!
      logger.error(
        { userId },
        'SECURITY ALERT: Invalid refresh token presented for active session. Revoking all tokens.',
      );
      await userRepository.clearRefreshToken(userId);
      throw AppError.unauthorized('Invalid refresh token.', ErrorCodes.REFRESH_TOKEN_INVALID);
    }

    // 3. Generate fresh token pair (Rotation)
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken();

    // 4. Save new hash
    const newRefreshTokenHash = await hashData(newRefreshToken);
    await userRepository.updateRefreshToken(user.id, newRefreshTokenHash);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  /**
   * Logout user by clearing their refresh token in the DB.
   */
  logout: async (userId) => {
    await userRepository.clearRefreshToken(userId);
    logger.info({ userId }, 'User logged out successfully');
  },
};
