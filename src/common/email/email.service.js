import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { emailEmitter } from './email.emitter.js';
import { logger } from '../logger/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.join(__dirname, 'templates');

/**
 * Loads template HTML file and replaces {{key}} placeholders with context values.
 *
 * @param {string} templateName - File name of template
 * @param {object} context - Map of keys to replace
 * @returns {Promise<string>}
 */
const loadTemplate = async (templateName, context) => {
  const filePath = path.join(TEMPLATE_DIR, `${templateName}.html`);
  let htmlContent = await fs.readFile(filePath, 'utf-8');

  Object.entries(context).forEach(([key, value]) => {
    htmlContent = htmlContent.replaceAll(`{{${key}}}`, String(value ?? ''));
  });

  return htmlContent;
};

export const emailService = {
  /**
   * Send Welcome email for registration
   *
   * @param {string} to
   * @param {object} user
   */
  sendWelcome: async (to, { firstName }) => {
    try {
      const html = await loadTemplate('registration', { firstName });
      emailEmitter.emit('send', {
        to,
        subject: 'Welcome to E-Commerce Platform!',
        html,
      });
    } catch (error) {
      logger.error({ error, to }, 'Failed to queue welcome email');
    }
  },

  /**
   * Send Order Confirmation email
   *
   * @param {string} to
   * @param {object} order
   */
  sendOrderConfirmation: async (to, order) => {
    try {
      const itemsTable = order.items
        .map(
          (item) => `
        <tr>
          <td>${item.productName} (x${item.quantity})</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">INR ${Number(item.unitPrice).toFixed(2)}</td>
        </tr>
      `
        )
        .join('');

      const html = await loadTemplate('order-confirmation', {
        orderNumber: order.orderNumber,
        createdAt: new Date(order.createdAt).toLocaleDateString(),
        shippingAddress: `${order.shippingAddress.fullName}, ${order.shippingAddress.streetAddress}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`,
        itemsTable,
        total: Number(order.total).toFixed(2),
      });

      emailEmitter.emit('send', {
        to,
        subject: `Order Placed Successfully - ${order.orderNumber}`,
        html,
      });
    } catch (error) {
      logger.error({ error, to, orderNumber: order.orderNumber }, 'Failed to queue order confirmation email');
    }
  },

  /**
   * Send Payment Success email
   *
   * @param {string} to
   * @param {object} payment
   */
  sendPaymentSuccess: async (to, payment) => {
    try {
      const html = await loadTemplate('payment-success', {
        orderNumber: payment.order.orderNumber,
        amount: Number(payment.amount).toFixed(2),
        paymentId: payment.razorpayPaymentId || payment.id,
      });

      emailEmitter.emit('send', {
        to,
        subject: `Payment Confirmed - ${payment.order.orderNumber}`,
        html,
      });
    } catch (error) {
      logger.error({ error, to, paymentId: payment.id }, 'Failed to queue payment success email');
    }
  },

  /**
   * Send Shipping Update email
   *
   * @param {string} to
   * @param {object} shipping
   * @param {string} orderNumber
   */
  sendShippingUpdate: async (to, shipping, orderNumber) => {
    try {
      const html = await loadTemplate('shipping-update', {
        status: shipping.status,
        orderNumber,
        provider: shipping.shippingProvider || 'N/A',
        trackingNumber: shipping.trackingNumber || 'N/A',
        estimatedDelivery: shipping.estimatedDelivery
          ? new Date(shipping.estimatedDelivery).toLocaleDateString()
          : 'N/A',
      });

      emailEmitter.emit('send', {
        to,
        subject: `Shipping status updated to ${shipping.status} - ${orderNumber}`,
        html,
      });
    } catch (error) {
      logger.error({ error, to, shippingId: shipping.id }, 'Failed to queue shipping update email');
    }
  },
};
