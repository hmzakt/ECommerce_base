/**
 * Payment Repository
 *
 * All Prisma database operations for Payment model live here.
 * Supports transactional operations by accepting an optional tx parameter.
 */

import { prisma } from '../../../prisma/client.js';

const paymentSelect = {
  id: true,
  orderId: true,
  razorpayOrderId: true,
  razorpayPaymentId: true,
  razorpaySignature: true,
  amount: true,
  currency: true,
  status: true,
  method: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      userId: true,
    },
  },
};

export const paymentRepository = {
  /**
   * Create or update a draft Payment record associated with an Order.
   *
   * @param {object} [tx] - Optional Prisma transaction
   * @param {object} data
   * @returns {Promise<object>}
   */
  createOrUpdatePayment: async (data, tx = prisma) => {
    const { orderId, razorpayOrderId, amount, currency = 'INR', status = 'PENDING' } = data;

    return tx.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        razorpayOrderId,
        amount,
        currency,
        status,
      },
      update: {
        razorpayOrderId,
        amount,
        currency,
        status,
      },
      select: paymentSelect,
    });
  },

  /**
   * Find payment by internal Order ID.
   *
   * @param {string} orderId
   * @returns {Promise<object|null>}
   */
  findByOrderId: async (orderId) => {
    return prisma.payment.findUnique({
      where: { orderId },
      select: paymentSelect,
    });
  },

  /**
   * Find payment by Razorpay Order ID.
   *
   * @param {string} razorpayOrderId
   * @returns {Promise<object|null>}
   */
  findByRazorpayOrderId: async (razorpayOrderId) => {
    return prisma.payment.findUnique({
      where: { razorpayOrderId },
      select: paymentSelect,
    });
  },

  /**
   * Find payment by internal Payment ID.
   *
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  findById: async (id) => {
    return prisma.payment.findUnique({
      where: { id },
      select: paymentSelect,
    });
  },

  /**
   * Update payment record to PAID / SUCCESS status inside a transaction.
   *
   * @param {object} tx
   * @param {string} paymentId
   * @param {object} updateData
   * @returns {Promise<object>}
   */
  markPaymentSuccess: async (tx, paymentId, updateData) => {
    const { razorpayPaymentId, razorpaySignature, method, rawWebhookPayload } = updateData;

    return tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        razorpayPaymentId,
        razorpaySignature: razorpaySignature || null,
        method: method || null,
        rawWebhookPayload: rawWebhookPayload || undefined,
      },
      select: paymentSelect,
    });
  },

  /**
   * Update payment record to FAILED status inside a transaction.
   *
   * @param {object} tx
   * @param {string} paymentId
   * @param {object} updateData
   * @returns {Promise<object>}
   */
  markPaymentFailed: async (tx, paymentId, updateData) => {
    const { razorpayPaymentId, rawWebhookPayload } = updateData;

    return tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        razorpayPaymentId: razorpayPaymentId || null,
        rawWebhookPayload: rawWebhookPayload || undefined,
      },
      select: paymentSelect,
    });
  },
};
