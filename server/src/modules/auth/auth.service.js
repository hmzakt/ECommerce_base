import { userRepository } from '../users/user.repository.js';
import {
  hashData,
  verifyHash,
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
} from '../../common/utils/crypto.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/errorCodes.js';
import { logger } from '../../common/logger/index.js';
import { sendEmailVerification, sendPasswordReset } from '../../common/utils/emailService.js';
import { config } from '../../config/index.js';

/**
 * Authentication Service
 *
 * Contains all business logic for authentication.
 * Does not know about HTTP concepts (req, res, cookies).
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a sanitized user object safe to return to the client.
 */
function sanitizeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    authProvider: user.authProvider,
  };
}

/**
 * Generate a full token pair and persist the refresh token hash.
 */
async function issueTokenPair(user) {
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = await hashData(refreshToken);
  await userRepository.updateRefreshToken(user.id, refreshTokenHash);
  return { accessToken, refreshToken };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Register a new user with email + password.
   * Sends a verification email after account creation.
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
      authProvider: 'LOCAL',
    });

    // 4. Issue tokens
    const { accessToken, refreshToken } = await issueTokenPair(user);

    // 5. Send verification email (non-blocking — don't fail registration if mail fails)
    const emailToken = generateEmailVerificationToken(user.id);
    const verifyUrl = `${config.clientUrl}/verify-email?token=${emailToken}`;

    sendEmailVerification({ to: email, firstName, verificationUrl: verifyUrl }).catch((err) => {
      logger.error({ err, userId: user.id }, 'Failed to send verification email after registration');
    });

    logger.info({ userId: user.id }, 'New user registered successfully');

    return { user: sanitizeUser(user), accessToken, refreshToken };
  },

  /**
   * Resend verification email to an already-registered (but unverified) user.
   */
  resendVerificationEmail: async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    if (user.isEmailVerified) throw AppError.badRequest('Email is already verified');

    const emailToken = generateEmailVerificationToken(user.id);
    const verifyUrl = `${config.clientUrl}/verify-email?token=${emailToken}`;

    await sendEmailVerification({
      to: user.email,
      firstName: user.firstName,
      verificationUrl: verifyUrl,
    });

    logger.info({ userId: user.id }, 'Verification email resent');
  },

  /**
   * Verify email using the JWT token sent in the verification link.
   */
  verifyEmail: async (token) => {
    try {
      const decoded = verifyEmailVerificationToken(token);
      await userRepository.verifyEmail(decoded.userId);
      logger.info({ userId: decoded.userId }, 'Email verified successfully');
    } catch {
      throw AppError.badRequest(
        'Invalid or expired verification token.',
        ErrorCodes.VALIDATION_ERROR,
      );
    }
  },

  /**
   * Login with email + password.
   */
  login: async ({ email, password }) => {
    const invalidCredentialsError = AppError.unauthorized(
      'Invalid email or password',
      ErrorCodes.INVALID_CREDENTIALS,
    );

    const user = await userRepository.findByEmail(email);
    if (!user) throw invalidCredentialsError;

    if (!user.isActive) {
      throw AppError.forbidden('Account has been deactivated.', ErrorCodes.ACCOUNT_DEACTIVATED);
    }

    // OAuth-only accounts have no password
    if (!user.passwordHash) {
      throw AppError.badRequest(
        'This account was created with Google Sign-In. Please use Google to log in.',
        ErrorCodes.INVALID_CREDENTIALS,
      );
    }

    const isValidPassword = await verifyHash(user.passwordHash, password);
    if (!isValidPassword) {
      logger.warn({ userId: user.id, email }, 'Failed login attempt: invalid password');
      throw invalidCredentialsError;
    }

    const { accessToken, refreshToken } = await issueTokenPair(user);

    logger.info({ userId: user.id }, 'User logged in successfully');

    return { user: sanitizeUser(user), accessToken, refreshToken };
  },

  /**
   * Google OAuth — find or create a user from a verified Google profile.
   * Accepts the decoded Google ID token payload (verified by the controller).
   *
   * @param {{ googleId: string, email: string, firstName: string, lastName: string, emailVerified: boolean }} profile
   */
  googleOAuth: async ({ googleId, email, firstName, lastName, emailVerified }) => {
    // 1. Try to find existing account by googleId
    let user = await userRepository.findByGoogleId(googleId);

    if (!user) {
      // 2. Try to find account by email (user may have registered with password first)
      const existingByEmail = await userRepository.findByEmail(email);

      if (existingByEmail) {
        // Link Google to the existing account
        user = await userRepository.update(existingByEmail.id, {
          googleId,
          authProvider: existingByEmail.authProvider === 'LOCAL' ? 'LOCAL_GOOGLE' : 'GOOGLE',
          isEmailVerified: existingByEmail.isEmailVerified || emailVerified,
        });
        logger.info({ userId: user.id }, 'Google account linked to existing user');
      } else {
        // 3. Create brand-new user via Google
        user = await userRepository.create({
          firstName,
          lastName,
          email,
          passwordHash: null,
          googleId,
          authProvider: 'GOOGLE',
          isEmailVerified: emailVerified,
        });
        logger.info({ userId: user.id }, 'New user created via Google OAuth');
      }
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account has been deactivated.', ErrorCodes.ACCOUNT_DEACTIVATED);
    }

    const { accessToken, refreshToken } = await issueTokenPair(user);

    return { user: sanitizeUser(user), accessToken, refreshToken };
  },

  /**
   * Refresh access token (Refresh Token Rotation).
   */
  refresh: async (userId, rawRefreshToken) => {
    const user = await userRepository.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw AppError.unauthorized('Invalid refresh token.', ErrorCodes.REFRESH_TOKEN_INVALID);
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account has been deactivated.', ErrorCodes.ACCOUNT_DEACTIVATED);
    }

    const isValidToken = await verifyHash(user.refreshTokenHash, rawRefreshToken);
    if (!isValidToken) {
      logger.error(
        { userId },
        'SECURITY ALERT: Invalid refresh token presented. Revoking all tokens.',
      );
      await userRepository.clearRefreshToken(userId);
      throw AppError.unauthorized('Invalid refresh token.', ErrorCodes.REFRESH_TOKEN_INVALID);
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = await hashData(newRefreshToken);
    await userRepository.updateRefreshToken(user.id, newRefreshTokenHash);

    return { accessToken, refreshToken: newRefreshToken };
  },

  /**
   * Logout — clears refresh token in DB.
   */
  logout: async (userId) => {
    await userRepository.clearRefreshToken(userId);
    logger.info({ userId }, 'User logged out successfully');
  },

  /**
   * Request a password reset email.
   */
  forgotPassword: async (email) => {
    const user = await userRepository.findByEmail(email);
    if (!user) return; // Prevent email enumeration

    // OAuth-only accounts have no password to reset
    if (user.authProvider === 'GOOGLE') return;

    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await userRepository.update(user.id, { passwordResetToken, passwordResetExpires });

    const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;

    await sendPasswordReset({ to: email, firstName: user.firstName, resetUrl });
  },

  /**
   * Reset password using a valid token.
   */
  resetPassword: async (token, newPassword) => {
    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await userRepository.findByPasswordResetToken(hashedToken);
    if (!user) {
      throw AppError.badRequest('Token is invalid or has expired.', ErrorCodes.VALIDATION_ERROR);
    }

    const newPasswordHash = await hashData(newPassword);
    await userRepository.updatePassword(user.id, newPasswordHash);

    logger.info({ userId: user.id }, 'Password reset successfully');
  },
};
