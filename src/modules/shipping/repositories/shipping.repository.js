import { prisma } from '../../../prisma/client.js';

export const shippingRepository = {
  /**
   * Find shipping details by ID
   *
   * @param {string} id
   */
  findById: async (id) => {
    return prisma.shipping.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            orderNumber: true,
            userId: true,
          },
        },
      },
    });
  },

  /**
   * Find shipping details by order ID
   *
   * @param {string} orderId
   */
  findByOrderId: async (orderId) => {
    return prisma.shipping.findUnique({
      where: { orderId },
    });
  },

  /**
   * Initialize a shipping record for an order in a transaction.
   *
   * @param {object} tx
   * @param {string} orderId
   */
  createInTransaction: async (tx, orderId) => {
    return tx.shipping.create({
      data: {
        orderId,
        status: 'PENDING',
      },
    });
  },

  /**
   * Update shipping record details.
   *
   * @param {string} id
   * @param {object} data
   */
  update: async (id, data) => {
    return prisma.shipping.update({
      where: { id },
      data,
      include: {
        order: {
          select: {
            orderNumber: true,
            userId: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });
  },
};
