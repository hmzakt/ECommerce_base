/**
 * Base Email Provider class to decouple email provider logic from business logic.
 * Concrete providers (e.g. NodemailerProvider, ResendProvider) must extend this class
 * and implement `sendEmail`.
 */
export class EmailProvider {
  /**
   * Send an email.
   *
   * @param {object} options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject line
   * @param {string} options.html - Email body in HTML format
   * @returns {Promise<void>}
   */
  async sendEmail(options) {
    throw new Error('sendEmail method must be implemented by concrete provider');
  }
}
