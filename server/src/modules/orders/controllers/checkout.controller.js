import { orderService } from '../services/order.service.js';
import { sendSuccess } from '../../../common/utils/response.js';

export const checkoutController = {
  /**
   * POST /checkout
   * Process checkout: converts active cart to order.
   */
  processCheckout: async (req, res) => {
    const order = await orderService.processCheckout(
      req.user.userId,
      req.body.shippingAddress,
    );

    sendSuccess(res, {
      message: 'Checkout completed successfully',
      data: { order },
      statusCode: 201,
    });
  },
};
