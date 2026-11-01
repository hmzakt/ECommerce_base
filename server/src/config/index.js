/**
 * Configuration Layer
 *
 * Design decisions:
 *  - Single import of dotenv here; nowhere else in the codebase calls dotenv.config()
 *  - Zod validates the shape and types of every env variable at startup
 *  - If any required variable is missing, the process exits immediately with a
 *    clear error — fail-fast over silent misconfiguration
 *  - The exported `config` object is deeply frozen: no accidental mutation at runtime
 *  - No raw process.env access outside this file (enforced by convention)
 */

import 'dotenv/config';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';

// ────────────────────────────────────────────────────────────────────────────────
// Schema definition
// ────────────────────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Cookies
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters'),

  // CORS — comma-separated list of allowed origins
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().default('rzp_test_placeholder_key_id'),
  RAZORPAY_KEY_SECRET: z.string().default('rzp_test_placeholder_key_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('rzp_test_placeholder_webhook_secret'),
});

// ────────────────────────────────────────────────────────────────────────────────
// Validation — crash early with a clear message if misconfigured
// ────────────────────────────────────────────────────────────────────────────────

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error(' Invalid environment configuration:\n');
  parseResult.error.errors.forEach((err) => {
    console.error(`  ${err.path.join('.')}: ${err.message}`);
  });
  console.error('\nPlease fix the above issues in your .env file.');
  process.exit(1);
}

const env = parseResult.data;

// ────────────────────────────────────────────────────────────────────────────────
// Exported config object — single source of truth for all configuration
// ────────────────────────────────────────────────────────────────────────────────

export const config = Object.freeze({
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  server: Object.freeze({
    port: env.PORT,
  }),

  database: Object.freeze({
    url: env.DATABASE_URL,
  }),

  jwt: Object.freeze({
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  }),

  cookies: Object.freeze({
    secret: env.COOKIE_SECRET,
    // Cookie options applied consistently everywhere
    accessTokenOptions: Object.freeze({
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes in ms
    }),
    refreshTokenOptions: Object.freeze({
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      path: '/api/v1/auth/refresh',
    }),
  }),

  cors: Object.freeze({
    origins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
  }),

  rateLimit: Object.freeze({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  }),

  razorpay: Object.freeze({
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
    webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
  }),
});

cloudinary.config({
  secure: true
});
