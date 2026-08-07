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

/**
 * Generate a unique, human-readable order number.
 * Format: ORD-YYYYMMDD-XXXX (e.g. ORD-20260808-A7B9)
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${randomHex}`;
};

/**
 * Format Prisma Decimal / number fields into clean string representations for API response.
 */
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

export const orderService = {
  /**
   * Process checkout: Converts active user cart into an immutable order.
   * Executed atomically inside a PostgreSQL transaction.
   *
   * @param {string} userId
   * @param {object} shippingAddress - Validated shipping address payload
   * @returns {Promise<object>} Shaped order
   */
  processCheckout: async (userId, shippingAddress) => {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch user's active cart with cart items and current product details
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 2. Validate cart exists and is not empty
      if (!cart || cart.items.length === 0) {
        throw AppError.badRequest(
          'Your cart is empty. Please add items before checking out.',
          ErrorCodes.CART_EMPTY,
        );
      }

      // 3. Validate every product in cart is active and available
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

        // Immutable snapshot of product details at time of purchase
        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        });
      }

      // 4. Server-side total calculation (never trust client totals)
      const shippingCost = 0.0;
      const tax = 0.0;
      const calculatedTotal = calculatedSubtotal + shippingCost + tax;

      // 5. Generate unique order number
      const orderNumber = generateOrderNumber();

      // 6. Create order with nested order items and shipping address
      const createdOrder = await orderRepository.createOrderInTransaction(tx, {
        orderNumber,
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

      // 7. Clear items from the user's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      logger.info(
        { userId, orderId: createdOrder.id, orderNumber, total: calculatedTotal },
        'Checkout processed successfully',
      );

      return shapeOrder(createdOrder);
    });
  },

  /**
   * Get orders for authenticated customer with pagination.
   *
   * @param {string} userId
   * @param {{ page: number, limit: number }} options
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
   * Get single order by ID for customer (enforces ownership).
   *
   * @param {string} userId
   * @param {string} orderId
   */
  getCustomerOrderById: async (userId, orderId) => {
    const order = await orderRepository.findOrderById(orderId);

    if (!order || order.userId !== userId) {
      throw AppError.notFound('Order not found', ErrorCodes.ORDER_NOT_FOUND);
    }

    return shapeOrder(order);
  },

  /**
   * Get orders for Admin with pagination, status filtering, and keyword search.
   *
   * @param {{ page: number, limit: number, status?: string, search?: string }} options
   */
  getAdminOrders: async ({ page, limit, status, search }) => {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      orderRepository.findAdminOrders({ skip, take: limit, status, search }),
      orderRepository.countAdminOrders({ status, search }),
    ]);

    return {
      orders: orders.map(shapeOrder),
      meta: buildPaginationMeta({ total, page, limit }),
    };
  },

  /**
   * Update order status and/or payment status (Admin only).
   *
   * @param {string} orderId
   * @param {{ status?: string, paymentStatus?: string }} statusData
   */
  updateOrderStatusByAdmin: async (orderId, statusData) => {
    const existingOrder = await orderRepository.findOrderById(orderId);

    if (!existingOrder) {
      throw AppError.notFound('Order not found', ErrorCodes.ORDER_NOT_FOUND);
    }

    // Prevent changing status of CANCELLED orders
    if (existingOrder.status === 'CANCELLED' && statusData.status && statusData.status !== 'CANCELLED') {
      throw AppError.badRequest(
        'Cannot modify the status of a cancelled order.',
        ErrorCodes.ORDER_INVALID_STATUS_TRANSITION,
      );
    }

    const updatedOrder = await orderRepository.updateOrderStatus(orderId, statusData);

    logger.info(
      { orderId, oldStatus: existingOrder.status, newStatus: statusData.status || existingOrder.status },
      'Order status updated by Admin',
    );

    return shapeOrder(updatedOrder);
  },
};
