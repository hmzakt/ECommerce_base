/**
 * Order & Checkout Service
 *
 * Encapsulates all business rules for Checkout and Order operations.
 */

import { orderRepository } from '../repositories/order.repository.js';
import { prisma } from '../../../prisma/client.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';
import { logger } from '../../../common/logger/index.js';
import { buildPaginationMeta } from '../../../common/utils/response.js';
import { emailService } from '../../../common/email/email.service.js';
import { outboxService, OutboxEventTypes } from '../../shipping/services/outbox.service.js';

// ─── Status Transition Rules ────────────────────────────────────────────────────

/**
 * Allowed forward transitions per status.
 * Cancellation is handled separately.
 */
const VALID_TRANSITIONS = {
  PENDING:    ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:  ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED:    ['DELIVERED'],
  DELIVERED:  [],
  CANCELLED:  [],
};

/**
 * Statuses from which a customer can cancel.
 */
const CUSTOMER_CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING'];

/**
 * Validate an order status transition. Throws if invalid.
 *
 * @param {string} fromStatus
 * @param {string} toStatus
 */
const validateTransition = (fromStatus, toStatus) => {
  const allowed = VALID_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(toStatus)) {
    throw AppError.badRequest(
      `Cannot transition order from ${fromStatus} to ${toStatus}.`,
      ErrorCodes.ORDER_INVALID_STATUS_TRANSITION,
    );
  }
};

// ─── Order Number Generator ─────────────────────────────────────────────────────

const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${randomHex}`;
};

// ─── Response Shaping ───────────────────────────────────────────────────────────

const shapeOrder = (order) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  userId: order.userId,
  status: order.status,
  paymentStatus: order.paymentStatus,
  subtotal: Number(order.subtotal).toFixed(2),
  shippingCost: Number(order.shippingCost).toFixed(2),
  tax: Number(order.tax).toFixed(2),
  total: Number(order.total).toFixed(2),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  user: order.user
    ? {
        id: order.user.id,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        email: order.user.email,
      }
    : undefined,
  shippingAddress: order.shippingAddress
    ? {
        fullName: order.shippingAddress.fullName,
        streetAddress: order.shippingAddress.streetAddress,
        apartment: order.shippingAddress.apartment,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone,
      }
    : null,
  items: order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productSku: item.productSku,
    unitPrice: Number(item.unitPrice).toFixed(2),
    quantity: item.quantity,
    lineTotal: Number(item.lineTotal).toFixed(2),
  })),
});

// ─── Service ────────────────────────────────────────────────────────────────────

export const orderService = {
  /**
   * Process checkout: Converts active user cart into an immutable order.
   * Also auto-initializes a Shipping record (PENDING) for the new order.
   * Executed atomically inside a PostgreSQL transaction.
   *
   * @param {string} userId
   * @param {object} shippingAddress - Validated shipping address payload
   */
  processCheckout: async (userId, shippingAddress) => {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Fetch cart with items and product details
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });

      // 2. Validate cart
      if (!cart || cart.items.length === 0) {
        throw AppError.badRequest(
          'Your cart is empty. Please add items before checking out.',
          ErrorCodes.CART_EMPTY,
        );
      }

      // 3. Validate products and build order items
      let calculatedSubtotal = 0;
      const orderItemsData = [];

      for (const item of cart.items) {
        const product = item.product;
        if (!product || !product.isActive) {
          throw AppError.badRequest(
            `Product "${product?.name || item.productId}" is no longer available.`,
            ErrorCodes.CART_ITEM_PRODUCT_INACTIVE,
          );
        }

        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * item.quantity;
        calculatedSubtotal += lineTotal;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        });
      }

      // 4. Server-side totals
      const shippingCost = 0.0;
      const tax = 0.0;
      const calculatedTotal = calculatedSubtotal + shippingCost + tax;

      // 5. Create order
      const createdOrder = await orderRepository.createOrderInTransaction(tx, {
        orderNumber: generateOrderNumber(),
        userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal: calculatedSubtotal,
        shippingCost,
        tax,
        total: calculatedTotal,
        items: orderItemsData,
        shippingAddress,
      });

      // 6. Auto-initialize Shipping record
      await tx.shipping.create({
        data: { orderId: createdOrder.id, status: 'PENDING' },
      });

      // 7. Clear cart items
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      logger.info(
        { userId, orderId: createdOrder.id, orderNumber: createdOrder.orderNumber },
        'Checkout processed successfully',
      );

      return createdOrder;
    });

    // 8. Send order confirmation email asynchronously (outside transaction)
    const fullOrder = await orderRepository.findOrderById(order.id);
    if (fullOrder) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user) {
        await emailService.sendOrderConfirmation(user.email, shapeOrder(fullOrder));
      }
    }

    return shapeOrder(fullOrder);
  },

  /**
   * Get orders for authenticated customer with pagination.
   */
  getCustomerOrders: async (userId, { page, limit }) => {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      orderRepository.findUserOrders(userId, { skip, take: limit }),
      orderRepository.countUserOrders(userId),
    ]);

    return {
      orders: orders.map(shapeOrder),
      meta: buildPaginationMeta({ total, page, limit }),
    };
  },

  /**
   * Get a single order by ID for customer (enforces ownership).
   */
  getCustomerOrderById: async (userId, orderId) => {
    const order = await orderRepository.findOrderById(orderId);
    if (!order || order.userId !== userId) {
      throw AppError.notFound('Order not found', ErrorCodes.ORDER_NOT_FOUND);
    }
    return shapeOrder(order);
  },

  /**
   * Customer cancels their own order.
   * Only allowed before the order is SHIPPED.
   */
  cancelCustomerOrder: async (userId, orderId) => {
    const order = await orderRepository.findOrderById(orderId);

    if (!order || order.userId !== userId) {
      throw AppError.notFound('Order not found', ErrorCodes.ORDER_NOT_FOUND);
    }

    if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
      throw AppError.badRequest(
        `Orders with status "${order.status}" cannot be cancelled. Only PENDING, CONFIRMED, and PROCESSING orders can be cancelled.`,
        ErrorCodes.ORDER_INVALID_STATUS_TRANSITION,
      );
    }

    const updatedOrder = await orderRepository.updateOrderStatus(orderId, { status: 'CANCELLED' });

    logger.info({ userId, orderId, previousStatus: order.status }, 'Customer cancelled order');

    return shapeOrder(updatedOrder);
  },

  /**
   * Get all orders (Admin) with full filter, search, and pagination support.
   */
  getAdminOrders: async ({ page, limit, status, paymentStatus, dateFrom, dateTo, customerId, search, sortBy }) => {
    const skip = (page - 1) * limit;

    const filters = {
      skip,
      take: limit,
      status,
      paymentStatus,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      customerId,
      search,
      sortBy,
    };

    const [orders, total] = await Promise.all([
      orderRepository.findAdminOrders(filters),
      orderRepository.countAdminOrders(filters),
    ]);

    return {
      orders: orders.map(shapeOrder),
      meta: buildPaginationMeta({ total, page, limit }),
    };
  },

  /**
   * Admin updates order status with transition validation.
   */
  updateOrderStatusByAdmin: async (orderId, statusData) => {
    const existingOrder = await orderRepository.findOrderById(orderId);

    if (!existingOrder) {
      throw AppError.notFound('Order not found', ErrorCodes.ORDER_NOT_FOUND);
    }

    // Enforce transition rules when a new status is provided
    if (statusData.status && statusData.status !== existingOrder.status) {
      validateTransition(existingOrder.status, statusData.status);
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const u = await tx.order.update({
        where: { id: orderId },
        data: statusData,
        include: {
          items: true,
          shippingAddress: true,
          user: true,
        },
      });

      const becameConfirmed =
        statusData.status === 'CONFIRMED' ||
        (statusData.paymentStatus === 'PAID' && existingOrder.paymentStatus !== 'PAID');

      if (becameConfirmed) {
        await outboxService.createEvent(tx, {
          eventType: OutboxEventTypes.ORDER_CONFIRMED_FOR_SHIPMENT,
          aggregateId: orderId,
          aggregateType: 'ORDER',
          payload: { orderId, trigger: 'ADMIN_CONFIRMED' },
        });
      }

      return u;
    });

    logger.info(
      { orderId, oldStatus: existingOrder.status, newStatus: statusData.status ?? existingOrder.status },
      'Order status updated by Admin',
    );

    return shapeOrder(updatedOrder);
  },
};
