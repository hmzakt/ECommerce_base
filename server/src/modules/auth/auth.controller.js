import { authService } from './auth.service.js';
import { config } from '../../config/index.js';
import { CookieNames } from '../../common/constants/index.js';
import { sendSuccess } from '../../common/utils/response.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/errorCodes.js';
import { verifyAccessToken } from '../../common/utils/crypto.js';
import { userRepository } from '../users/user.repository.js';
import { OAuth2Client } from 'google-auth-library';

// Lazily-created Google OAuth client — only used if GOOGLE_CLIENT_ID is set
let _googleClient = null;
function getGoogleClient() {
  if (!config.google.clientId) return null;
  if (!_googleClient) _googleClient = new OAuth2Client(config.google.clientId);
  return _googleClient;
}

/**
 * Auth Controller
 *
 * Handles HTTP request/response mapping for authentication.
 * Extracts data, calls the service layer, sets cookies, and sends JSON.
 */

export const authController = {
  /**
   * Register a new user
   */
  register: async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.register(req.body);

    // Set HTTP-only cookie for refresh token
    res.cookie(CookieNames.REFRESH_TOKEN, refreshToken, config.cookies.refreshTokenOptions);

    sendSuccess(res, {
      message: 'Registration successful',
      statusCode: 201,
      data: { user, accessToken },
    });
  },

  /**
   * Login user
   */
  login: async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    // Set HTTP-only cookie for refresh token
    res.cookie(CookieNames.REFRESH_TOKEN, refreshToken, config.cookies.refreshTokenOptions);

    sendSuccess(res, {
      message: 'Login successful',
      data: { user, accessToken },
    });
  },

  /**
   * Refresh access token
   */
  refresh: async (req, res) => {
    const rawRefreshToken = req.cookies[CookieNames.REFRESH_TOKEN];

    if (!rawRefreshToken) {
      throw AppError.unauthorized('No refresh token provided', ErrorCodes.TOKEN_MISSING);
    }

    // To refresh, we need the user ID. We can extract it from the expired access token if provided,
    // or we can decode the refresh token if it was a JWT. Since our refresh token is an opaque string,
    // we must rely on the client passing the expired access token OR we decode it from the Authorization header.
    // Standard approach: Extract userId from the expired access token.
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Access token required for refresh', ErrorCodes.TOKEN_MISSING);
    }

    const token = authHeader.split(' ')[1];
    let userId;
    
    try {
      // We pass ignoreExpiration: true because it's expected to be expired when calling refresh
      const decoded = verifyAccessToken(token, { ignoreExpiration: true });
      userId = decoded.userId;
    } catch (err) {
      throw AppError.unauthorized('Invalid access token', ErrorCodes.TOKEN_INVALID);
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(
      userId,
      rawRefreshToken,
    );

    // Set the new refresh token cookie
    res.cookie(CookieNames.REFRESH_TOKEN, newRefreshToken, config.cookies.refreshTokenOptions);

    sendSuccess(res, {
      message: 'Token refreshed successfully',
      data: { accessToken },
    });
  },

  /**
   * Logout user
   */
  logout: async (req, res) => {
    // req.user is populated by the authenticate middleware
    await authService.logout(req.user.userId);

    res.clearCookie(CookieNames.REFRESH_TOKEN, {
      ...config.cookies.refreshTokenOptions,
      maxAge: 0,
    });

    sendSuccess(res, {
      message: 'Logged out successfully',
    });
  },

  /**
   * Get current logged in user profile
   */
  me: async (req, res) => {
    // req.user is populated by authenticate middleware with userId and role
    // Fetch full profile from DB
    const user = await userRepository.findById(req.user.userId);

    if (!user) {
      throw AppError.notFound('User not found', ErrorCodes.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account has been deactivated.', ErrorCodes.ACCOUNT_DEACTIVATED);
    }

    sendSuccess(res, {
      message: 'Profile fetched successfully',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          authProvider: user.authProvider,
          createdAt: user.createdAt,
        },
      },
    });
  },

  /**
   * Request password reset
   */
  forgotPassword: async (req, res) => {
    const { email } = req.body;
    await authService.forgotPassword(email);

    sendSuccess(res, {
      message: 'If that email is registered, a password reset link has been sent.',
    });
  },

  /**
   * Reset password
   */
  resetPassword: async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      throw AppError.badRequest('Token and new password are required', ErrorCodes.VALIDATION_ERROR);
    }

    await authService.resetPassword(token, newPassword);

    sendSuccess(res, {
      message: 'Password reset successfully. You can now log in.',
    });
  },

  /**
   * Verify Email
   */
  verifyEmail: async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
      throw AppError.badRequest('Verification token is required', ErrorCodes.VALIDATION_ERROR);
    }

    await authService.verifyEmail(token);

    sendSuccess(res, {
      message: 'Email verified successfully.',
    });
  },

  /**
   * Resend Verification Email
   */
  resendVerificationEmail: async (req, res) => {
    // req.user is populated by authenticate middleware
    await authService.resendVerificationEmail(req.user.userId);

    sendSuccess(res, {
      message: 'Verification email sent successfully.',
    });
  },

  /**
   * Update authenticated user's profile
   */
  updateProfile: async (req, res) => {
    const { firstName, lastName, phone } = req.body;

    const updatedUser = await userRepository.update(req.user.userId, {
      ...(firstName && { firstName: firstName.trim() }),
      ...(lastName && { lastName: lastName.trim() }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
    });

    sendSuccess(res, {
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          isEmailVerified: updatedUser.isEmailVerified,
          createdAt: updatedUser.createdAt,
        },
      },
    });
  },

  /**
   * Google OAuth — verify Google ID token and issue app JWT pair.
   * Accepts: POST /auth/google  { credential: "<google-id-token>" }
   */
  googleAuth: async (req, res) => {
    const { credential } = req.body;

    if (!credential || typeof credential !== 'string') {
      throw AppError.badRequest('Google credential is required.', ErrorCodes.VALIDATION_ERROR);
    }

    const googleClient = getGoogleClient();
    if (!googleClient) {
      throw AppError.badRequest(
        'Google Sign-In is not configured on this server.',
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Verify the Google ID token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.google.clientId,
      });
    } catch {
      throw AppError.unauthorized('Invalid or expired Google token.', ErrorCodes.TOKEN_INVALID);
    }

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) {
      throw AppError.unauthorized('Incomplete Google profile.', ErrorCodes.TOKEN_INVALID);
    }

    const { user, accessToken, refreshToken } = await authService.googleOAuth({
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name || payload.name?.split(' ')[0] || 'User',
      lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
      emailVerified: !!payload.email_verified,
    });

    res.cookie(CookieNames.REFRESH_TOKEN, refreshToken, config.cookies.refreshTokenOptions);

    sendSuccess(res, {
      message: 'Google Sign-In successful',
      statusCode: 200,
      data: { user, accessToken },
    });
  },
};
