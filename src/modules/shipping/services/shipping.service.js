import { shippingRepository } from '../repositories/shipping.repository.js';
import { orderRepository } from '../../orders/repositories/order.repository.js';
import { emailService } from '../../../common/email/email.service.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';
import { logger } from '../../../common/logger/index.js';

export const shippingService = {
  /**
   * Get shipping details for a specific order.
   * Enforces customer ownership.
   *
   * @param {string} userId
   * @param {string} orderId
   * @param {string} userRole
   */
  getShippingByOrderId: async (userId, orderId, userRole) => {
    // 1. Fetch order to verify ownership
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found', ErrorCodes.ORDER_NOT_FOUND);
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && order.userId !== userId) {
      throw AppError.forbidden('You do not have permission to track this order.');
    }

    // 2. Fetch shipping details
    const shipping = await shippingRepository.findByOrderId(orderId);
    if (!shipping) {
      throw AppError.notFound('Shipping record not found for this order.', ErrorCodes.NOT_FOUND);
    }

    return shipping;
  },

  /**
   * Update shipping details (Admin only).
   * Triggers an asynchronous email status update to the customer if status is updated.
   *
   * @param {string} id - Shipping ID
   * @param {object} updateData
   */
  updateShippingByAdmin: async (id, updateData) => {
    const existing = await shippingRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Shipping record not found', ErrorCodes.NOT_FOUND);
    }

    // Update estimatedDelivery and actualDelivery safely
    const formattedData = { ...updateData };
    if (updateData.estimatedDelivery) formattedData.estimatedDelivery = new Date(updateData.estimatedDelivery);
    if (updateData.actualDelivery) formattedData.actualDelivery = new Date(updateData.actualDelivery);

    const updated = await shippingRepository.update(id, formattedData);

    logger.info(
      { shippingId: id, oldStatus: existing.status, newStatus: updated.status },
      'Shipping details updated by Admin'
    );

    // If status has changed, notify customer asynchronously
    if (existing.status !== updated.status) {
      const email = updated.order.user.email;
      const orderNumber = updated.order.orderNumber;
      await emailService.sendShippingUpdate(email, updated, orderNumber);
    }

    return updated;
  },
};
