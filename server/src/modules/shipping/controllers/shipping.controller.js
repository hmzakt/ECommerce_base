import { shippingService } from '../services/shipping.service.js';
import { sendSuccess } from '../../../common/utils/response.js';

export const shippingController = {
  /**
   * GET /orders/:id/shipping
   * Retrieve shipping details for a specific order.
   */
  getShippingDetails: async (req, res) => {
    const shipping = await shippingService.getShippingByOrderId(
      req.user.userId,
      req.params.id,
      req.user.role,
    );

    sendSuccess(res, {
      message: 'Shipping details retrieved successfully',
      data: { shipping },
    });
  },

  /**
   * PATCH /admin/shipping/:id
   * Admin: Update shipping status and logistics info.
   */
  updateShipping: async (req, res) => {
    const shipping = await shippingService.updateShippingByAdmin(
      req.params.id,
      req.body,
    );

    sendSuccess(res, {
      message: 'Shipping details updated successfully',
      data: { shipping },
    });
  },
};
