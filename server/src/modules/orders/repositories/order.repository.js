/**
 * Order Repository
 *
 * Implements database queries for Order, OrderItem, and ShippingAddress.
 * Supports transactional execution via passing an optional tx (transaction client).
 */

import { prisma } from '../../../prisma/client.js';

// Shared select shape to ensure full order detail response consistency
const orderSelect = {
  id: true,
  orderNumber: true,
  userId: true,
  status: true,
  paymentStatus: true,
  subtotal: true,
  shippingCost: true,
  tax: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  shippingAddress: {
    select: {
      id: true,
      fullName: true,
      streetAddress: true,
      apartment: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      phone: true,
    },
  },
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      productSku: true,
      unitPrice: true,
      quantity: true,
      lineTotal: true,
    },
    orderBy: { createdAt: 'asc' },
  },
};

export const orderRepository = {
  /**
   * Create an Order with items and shipping address inside a transaction.
   *
   * @param {object} tx - Prisma transaction client
   * @param {object} data
   * @returns {Promise<object>} Created order
   */
  createOrderInTransaction: async (tx, data) => {
    const { items, shippingAddress, ...orderData } = data;

    return tx.order.create({
      data: {
        ...orderData,
        shippingAddress: {
          create: shippingAddress,
        },
        items: {
          create: items,
        },
      },
      select: orderSelect,
    });
  },

  /**
   * Find orders for a specific user with pagination.
   *
   * @param {string} userId
   * @param {{ skip: number, take: number }} pagination
   * @returns {Promise<object[]>}
   */
  findUserOrders: async (userId, { skip, take }) => {
    return prisma.order.findMany({
      where: { userId },
      select: orderSelect,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Count total orders for a user.
   *
   * @param {string} userId
   * @returns {Promise<number>}
   */
  countUserOrders: async (userId) => {
    return prisma.order.count({
      where: { userId },
    });
  },

  /**
   * Find an order by ID.
   *
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  findOrderById: async (id) => {
    return prisma.order.findUnique({
      where: { id },
      select: orderSelect,
    });
  },

  /**
   * Find all orders for Admin with pagination, status filter, date range, payment status, and keyword search.
   *
   * @param {{ skip: number, take: number, status?: string, paymentStatus?: string, dateFrom?: Date, dateTo?: Date, customerId?: string, search?: string, sortBy?: string }} filters
   * @returns {Promise<object[]>}
   */
  findAdminOrders: async ({ skip, take, status, paymentStatus, dateFrom, dateTo, customerId, search, sortBy = 'newest' }) => {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (customerId) {
      where.userId = customerId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orderBy = sortBy === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    return prisma.order.findMany({
      where,
      select: {
        ...orderSelect,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      skip,
      take,
      orderBy,
    });
  },

  /**
   * Count total orders for Admin matching filters.
   *
   * @param {{ status?: string, paymentStatus?: string, dateFrom?: Date, dateTo?: Date, customerId?: string, search?: string }} filters
   * @returns {Promise<number>}
   */
  countAdminOrders: async ({ status, paymentStatus, dateFrom, dateTo, customerId, search }) => {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (customerId) {
      where.userId = customerId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return prisma.order.count({ where });
  },

  /**
   * Update order status and/or payment status.
   *
   * @param {string} id
   * @param {{ status?: string, paymentStatus?: string }} data
   * @returns {Promise<object>}
   */
  updateOrderStatus: async (id, data) => {
    return prisma.order.update({
      where: { id },
      data,
      select: orderSelect,
    });
  },
};
