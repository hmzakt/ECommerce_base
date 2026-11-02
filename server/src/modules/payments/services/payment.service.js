/**
 * Razorpay Payment Service
 *
 * Implements server-driven payment creation, HMAC-SHA256 signature verification,
 * webhook processing with signature validation and idempotency guarantees.
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../../../config/index.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { orderRepository } from '../../orders/repositories/order.repository.js';
import { prisma } from '../../../prisma/client.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';
import { logger } from '../../../common/logger/index.js';
import { outboxService, OutboxEventTypes } from '../../shipping/services/outbox.service.js';

// Initialize Razorpay SDK instance
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

/**
 * Shape Payment object for API responses.
 */
const shapePayment = (payment) => ({
  id: payment.id,
  orderId: payment.orderId,
  razorpayOrderId: payment.razorpayOrderId,
  razorpayPaymentId: payment.razorpayPaymentId,
  amount: Number(payment.amount).toFixed(2),
  currency: payment.currency,
  status: payment.status,
  method: payment.method,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
  order: payment.order
    ? {
        id: payment.order.id,
        orderNumber: payment.order.orderNumber,
        status: payment.order.status,
        paymentStatus: payment.order.paymentStatus,
        total: Number(payment.order.total).toFixed(2),
      }
    : undefined,
});

export const paymentService = {
  /**
   * Create a Razorpay Order based on an existing internal Order.
   * Total amount is calculated strictly from the database Order (never trusted from client).
   *
   * @param {string} userId
   * @param {string} orderId
   * @returns {Promise<object>}
   */
  createRazorpayOrder: async (userId, orderId) => {
    // 1. Fetch order from DB
    const order = await orderRepository.findOrderById(orderId);

    if (!order || order.userId !== userId) {
      throw AppError.notFound('Order not found', ErrorCodes.ORDER_NOT_FOUND);
    }

    // 2. Reject if order is already paid
    if (order.paymentStatus === 'PAID') {
      throw AppError.badRequest(
        'This order has already been paid for.',
        ErrorCodes.ORDER_ALREADY_PAID,
      );
    }

    // 3. Convert total to integer paise (1 INR = 100 paise)
    const totalAmount = Number(order.total);
    const amountInPaise = Math.round(totalAmount * 100);

    // 4. Create Razorpay order via SDK
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          orderId: order.id,
          userId,
        },
      });
    } catch (err) {
      logger.error({ err, orderId, userId }, 'Razorpay SDK order creation failed');
      throw AppError.internal('Failed to initiate payment with Razorpay provider.');
    }

    // 5. Store / update draft Payment record in DB
    const payment = await paymentRepository.createOrUpdatePayment({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
      status: 'PENDING',
    });

    logger.info(
      { userId, orderId, razorpayOrderId: razorpayOrder.id, amountInPaise },
      'Razorpay order created successfully',
    );

    return {
      paymentId: payment.id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: config.razorpay.keyId,
      orderNumber: order.orderNumber,
    };
  },

  /**
   * Verify Razorpay Payment Signature and update Payment & Order status atomically.
   *
   * @param {string} userId
   * @param {{ orderId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string }} payload
   */
  verifyPayment: async (userId, { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    // 1. Find payment by razorpayOrderId
    const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);

    if (!payment || payment.orderId !== orderId) {
      throw AppError.notFound('Payment record not found', ErrorCodes.PAYMENT_NOT_FOUND);
    }

    if (payment.order.userId !== userId) {
      throw AppError.forbidden('You do not have permission to verify this payment.');
    }

    // 2. Idempotency check: If already paid, return existing record cleanly
    if (payment.status === 'PAID' && payment.order.paymentStatus === 'PAID') {
      logger.info({ orderId, razorpayOrderId }, 'Payment verification called for already PAID order (idempotent)');
      return shapePayment(payment);
    }

    // 3. Verify HMAC-SHA256 signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      logger.warn(
        { userId, orderId, razorpayOrderId, razorpayPaymentId },
        'Razorpay payment signature mismatch during verification',
      );
      throw AppError.badRequest(
        'Payment signature verification failed.',
        ErrorCodes.INVALID_PAYMENT_SIGNATURE,
      );
    }

    // 4. Atomically update Payment & Order status in a transaction
    const updatedPayment = await prisma.$transaction(async (tx) => {
      const p = await paymentRepository.markPaymentSuccess(tx, payment.id, {
        razorpayPaymentId,
        razorpaySignature,
      });

      await orderRepository.updateOrderStatus(orderId, {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      });

      await outboxService.createEvent(tx, {
        eventType: OutboxEventTypes.ORDER_CONFIRMED_FOR_SHIPMENT,
        aggregateId: orderId,
        aggregateType: 'ORDER',
        payload: { orderId, paymentId: p.id, trigger: 'PAYMENT_VERIFIED' },
      });

      return p;
    });

    logger.info(
      { userId, orderId, razorpayOrderId, razorpayPaymentId },
      'Payment verified and Order marked PAID successfully',
    );

    return shapePayment(updatedPayment);
  },

  /**
   * Process incoming Razorpay Webhooks cleanly and idempotently.
   *
   * @param {Buffer|string} rawBody - Exact raw HTTP request body
   * @param {string} signatureHeader - x-razorpay-signature header
   * @param {object} eventBody - Parsed JSON body
   */
  processWebhook: async (rawBody, signatureHeader, eventBody) => {
    // 1. Verify webhook signature
    if (!signatureHeader) {
      throw AppError.badRequest('Missing x-razorpay-signature header', ErrorCodes.INVALID_PAYMENT_SIGNATURE);
    }

    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signatureHeader) {
      logger.error('Razorpay webhook signature verification failed');
      throw AppError.badRequest('Invalid webhook signature', ErrorCodes.INVALID_PAYMENT_SIGNATURE);
    }

    const event = eventBody.event;
    const payload = eventBody.payload;

    logger.info({ event }, 'Processing Razorpay webhook event');

    // 2. Handle payment.captured or order.paid events
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id || payload.order?.entity?.id;
      const razorpayPaymentId = paymentEntity?.id;
      const method = paymentEntity?.method;

      if (!razorpayOrderId) {
        logger.warn({ event }, 'Webhook payload missing razorpay order_id');
        return { status: 'ignored' };
      }

      const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
      if (!payment) {
        logger.warn({ razorpayOrderId }, 'Webhook received for unknown Razorpay order ID');
        return { status: 'payment_not_found' };
      }

      // Idempotency check
      if (payment.status === 'PAID') {
        logger.info({ razorpayOrderId }, 'Webhook ignored: Payment already marked PAID');
        return { status: 'already_processed' };
      }

      await prisma.$transaction(async (tx) => {
        await paymentRepository.markPaymentSuccess(tx, payment.id, {
          razorpayPaymentId,
          method,
          rawWebhookPayload: eventBody,
        });

        await orderRepository.updateOrderStatus(payment.orderId, {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        });

        await outboxService.createEvent(tx, {
          eventType: OutboxEventTypes.ORDER_CONFIRMED_FOR_SHIPMENT,
          aggregateId: payment.orderId,
          aggregateType: 'ORDER',
          payload: { orderId: payment.orderId, trigger: 'WEBHOOK_PAYMENT_CAPTURED' },
        });
      });

      logger.info({ razorpayOrderId, razorpayPaymentId }, 'Webhook successfully marked order PAID');
      return { status: 'success' };
    }

    // 3. Handle payment.failed event
    if (event === 'payment.failed') {
      const paymentEntity = payload.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
        if (payment && payment.status !== 'PAID') {
          await prisma.$transaction(async (tx) => {
            await paymentRepository.markPaymentFailed(tx, payment.id, {
              razorpayPaymentId,
              rawWebhookPayload: eventBody,
            });

            await orderRepository.updateOrderStatus(payment.orderId, {
              paymentStatus: 'FAILED',
            });
          });

          logger.info({ razorpayOrderId }, 'Webhook marked payment as FAILED');
        }
      }

      return { status: 'failed_recorded' };
    }

    return { status: 'unhandled_event_ignored' };
  },

  /**
   * Get payment details by internal Payment ID.
   * Enforces customer ownership unless requested by Admin.
   *
   * @param {string} userId
   * @param {string} paymentId
   * @param {string} userRole
   */
  getPaymentById: async (userId, paymentId, userRole) => {
    const payment = await paymentRepository.findById(paymentId);

    if (!payment) {
      throw AppError.notFound('Payment record not found', ErrorCodes.PAYMENT_NOT_FOUND);
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && payment.order.userId !== userId) {
      throw AppError.forbidden('You do not have permission to view this payment details.');
    }

    return shapePayment(payment);
  },
};
