import { shippingRepository } from '../repositories/shipping.repository.js';
import { shipmentRepository } from '../repositories/shipment.repository.js';
import { orderRepository } from '../../orders/repositories/order.repository.js';
import { emailService } from '../../../common/email/email.service.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';
import { logger } from '../../../common/logger/index.js';

export const shippingService = {
  /**
   * Get shipping and real-time tracking details for a specific order.
   * Enforces customer ownership and returns rich shipment events when available.
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

    // 2. Look for rich logistics Shipment first
    const shipment = await shipmentRepository.findActiveByOrderId(orderId);

    // 3. Fallback to legacy shipping record
    const legacyShipping = await shippingRepository.findByOrderId(orderId);

    if (!shipment && !legacyShipping) {
      throw AppError.notFound('Shipping record not found for this order.', ErrorCodes.NOT_FOUND);
    }

    return {
      id: shipment?.id || legacyShipping?.id,
      orderId,
      status: shipment?.status || legacyShipping?.status,
      shippingProvider: shipment?.courierName || shipment?.shippingProvider || legacyShipping?.shippingProvider,
      courierName: shipment?.courierName || legacyShipping?.shippingProvider,
      trackingNumber: shipment?.awbCode || legacyShipping?.trackingNumber,
      awbCode: shipment?.awbCode || legacyShipping?.trackingNumber,
      trackingUrl: shipment?.trackingUrl || (shipment?.awbCode ? `https://shiprocket.co/tracking/${shipment.awbCode}` : null),
      estimatedDelivery: shipment?.estimatedDelivery || legacyShipping?.estimatedDelivery,
      actualDelivery: shipment?.actualDelivery || legacyShipping?.actualDelivery,
      labelUrl: shipment?.labelUrl || null,
      events: shipment?.events || [],
      destination: order.shippingAddress,
      createdAt: shipment?.createdAt || legacyShipping?.createdAt,
      updatedAt: shipment?.updatedAt || legacyShipping?.updatedAt,
    };
  },

  /**
   * Update shipping details (Admin only legacy endpoint).
   *
   * @param {string} id - Shipping ID
   * @param {object} updateData
   */
  updateShippingByAdmin: async (id, updateData) => {
    const existing = await shippingRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Shipping record not found', ErrorCodes.NOT_FOUND);
    }

    const formattedData = { ...updateData };
    if (updateData.estimatedDelivery) formattedData.estimatedDelivery = new Date(updateData.estimatedDelivery);
    if (updateData.actualDelivery) formattedData.actualDelivery = new Date(updateData.actualDelivery);

    const updated = await shippingRepository.update(id, formattedData);

    logger.info(
      { shippingId: id, oldStatus: existing.status, newStatus: updated.status },
      'Shipping details updated by Admin'
    );

    if (existing.status !== updated.status && updated.order?.user?.email) {
      const email = updated.order.user.email;
      const orderNumber = updated.order.orderNumber;
      await emailService.sendShippingUpdate(email, updated, orderNumber);
    }

    return updated;
  },
};
