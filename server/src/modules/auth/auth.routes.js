import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../common/middleware/validate.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema.js';
import { authenticate } from '../../common/middleware/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import rateLimit from 'express-rate-limit';
import { ErrorCodes } from '../../common/errors/errorCodes.js';

const router = Router();

// Stricter rate limiting for auth endpoints (e.g. max 10 attempts per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code: ErrorCodes.TOO_MANY_REQUESTS,
  },
});

// ────────────────────────────────────────────────────────────────────────────────
// Public Routes
// ────────────────────────────────────────────────────────────────────────────────

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login)
);

router.post(
  '/refresh',
  asyncHandler(authController.refresh)
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);

router.post(
  '/verify-email',
  authLimiter,
  asyncHandler(authController.verifyEmail)
);

// Google OAuth — public, rate-limited
router.post(
  '/google',
  authLimiter,
  asyncHandler(authController.googleAuth)
);

// ────────────────────────────────────────────────────────────────────────────────
// Protected Routes
// ────────────────────────────────────────────────────────────────────────────────

router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout)
);

router.post(
  '/resend-verification',
  authLimiter,
  authenticate,
  asyncHandler(authController.resendVerificationEmail)
);

router.get(
  '/me',
  authenticate,
  asyncHandler(authController.me)
);

router.patch(
  '/me',
  authenticate,
  asyncHandler(authController.updateProfile)
);

export const authRouter = router;
