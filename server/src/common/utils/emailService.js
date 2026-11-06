/**
 * Email Service
 *
 * Sends transactional emails via Nodemailer (SMTP).
 * Falls back to console logging if SMTP credentials are not configured.
 *
 * Design decisions:
 *  - Singleton transporter — created once, reused across requests
 *  - Graceful fallback: missing SMTP config → logs to console (safe for dev)
 *  - All email content is centralized here (single source of truth)
 *  - HTML templates use inline styles for maximum email client compatibility
 */

import nodemailer from 'nodemailer';
import { logger } from '../logger/index.js';

// ─── Transporter Singleton ────────────────────────────────────────────────────

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    logger.warn('SMTP credentials not configured — emails will be logged to console only.');
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: parseInt(SMTP_PORT || '587', 10) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return _transporter;
}

const FROM_ADDRESS = process.env.EMAIL_FROM || '"Maison Atelier" <no-reply@maisonatelier.com>';
const APP_NAME = 'Maison Atelier';

// ─── Core Send Helper ─────────────────────────────────────────────────────────

async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransporter();

  if (!transporter) {
    // Development fallback — log to console so devs can test without SMTP
    logger.info(
      { to, subject, text: text || html.replace(/<[^>]+>/g, '') },
      'MOCK EMAIL (SMTP not configured)',
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });
    logger.info({ to, subject }, 'Email sent successfully');
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
    // Don't throw — email failures should not crash the request
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function wrapInLayout(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e8e0;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #e8e8e0;text-align:center;">
              <span style="font-size:22px;font-weight:300;letter-spacing:4px;color:#1a1a1a;text-transform:uppercase;">${APP_NAME}</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e8e8e0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
                This is an automated email, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send an email verification link to a new user.
 *
 * @param {object} opts
 * @param {string} opts.to - Recipient email address
 * @param {string} opts.firstName - Recipient's first name
 * @param {string} opts.verificationUrl - Full URL the user should visit
 */
export async function sendEmailVerification({ to, firstName, verificationUrl }) {
  const subject = `Verify your ${APP_NAME} email address`;

  const bodyHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:400;color:#1a1a1a;">Welcome, ${firstName}!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">
      Thank you for creating your ${APP_NAME} account. Please verify your email
      address to activate your account and start shopping.
    </p>
    <div style="text-align:center;margin:0 0 32px;">
      <a href="${verificationUrl}"
         style="display:inline-block;padding:14px 36px;background:#1a1a1a;color:#fff;
                text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
        Verify Email Address
      </a>
    </div>
    <p style="margin:0 0 8px;font-size:12px;color:#999;line-height:1.6;">
      Or copy and paste this URL into your browser:
    </p>
    <p style="margin:0;font-size:12px;color:#555;word-break:break-all;">
      ${verificationUrl}
    </p>
    <p style="margin:24px 0 0;font-size:12px;color:#999;">
      This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
    </p>
  `;

  await sendEmail({ to, subject, html: wrapInLayout(subject, bodyHtml) });
}

/**
 * Send a password reset email.
 *
 * @param {object} opts
 * @param {string} opts.to - Recipient email address
 * @param {string} opts.firstName - Recipient's first name
 * @param {string} opts.resetUrl - Full URL the user should visit
 */
export async function sendPasswordReset({ to, firstName, resetUrl }) {
  const subject = `Reset your ${APP_NAME} password`;

  const bodyHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:400;color:#1a1a1a;">Password Reset Request</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">
      Hi ${firstName}, we received a request to reset your password.
      Click the button below to choose a new password.
    </p>
    <div style="text-align:center;margin:0 0 32px;">
      <a href="${resetUrl}"
         style="display:inline-block;padding:14px 36px;background:#1a1a1a;color:#fff;
                text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
        Reset Password
      </a>
    </div>
    <p style="margin:0 0 8px;font-size:12px;color:#999;line-height:1.6;">
      Or copy and paste this URL into your browser:
    </p>
    <p style="margin:0;font-size:12px;color:#555;word-break:break-all;">
      ${resetUrl}
    </p>
    <p style="margin:24px 0 0;font-size:12px;color:#999;">
      This link expires in 15 minutes. If you did not request a password reset, please ignore this email.
    </p>
  `;

  await sendEmail({ to, subject, html: wrapInLayout(subject, bodyHtml) });
}

