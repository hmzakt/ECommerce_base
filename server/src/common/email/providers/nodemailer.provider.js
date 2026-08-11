import nodemailer from 'nodemailer';
import { EmailProvider } from './email.provider.js';
import { logger } from '../../logger/index.js';
import { config } from '../../../config/index.js';

export class NodemailerProvider extends EmailProvider {
  constructor() {
    super();
    this.transporter = null;

    // Use SMTP options if SMTP host is configured, otherwise fallback to mock transport
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (hasSmtpConfig) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      logger.info('Nodemailer SMTP Transporter initialized successfully');
    } else {
      // Mock transport for development/tests to prevent crashing
      logger.warn('SMTP credentials not found in env. Email notifications will be mocked to console.');
    }
  }

  /**
   * Send email using Nodemailer
   *
   * @param {object} options
   */
  async sendEmail({ to, subject, html }) {
    const from = process.env.EMAIL_FROM || 'noreply@ecommerce.local';

    if (this.transporter) {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      logger.info({ messageId: info.messageId, to, subject }, 'Email sent successfully via Nodemailer');
    } else {
      // Mock delivery logging
      logger.info(
        {
          mockEmail: true,
          from,
          to,
          subject,
          bodySnippet: html.substring(0, 100) + '...',
        },
        '📨 [MOCKED EMAIL SENT]'
      );
    }
  }
}
