import { orderService } from '../services/order.service.js';
import { sendSuccess } from '../../../common/utils/response.js';

export const orderController = {
  /**
   * GET /orders
   * Customer: Get paginated list of own orders
   */
  getCustomerOrders: async (req, res) => {
    const { orders, meta } = await orderService.getCustomerOrders(
      req.user.userId,
      req.query,
    );

    sendSuccess(res, {
      message: 'Orders retrieved successfully',
      data: { orders },
      meta,
    });
  },

  /**
   * GET /orders/:id
   * Customer: Get single order details (enforces ownership)
   */
  getCustomerOrderById: async (req, res) => {
    const order = await orderService.getCustomerOrderById(
      req.user.userId,
      req.params.id,
    );

    sendSuccess(res, {
      message: 'Order details retrieved successfully',
      data: { order },
    });
  },

  /**
   * GET /admin/orders
   * Admin: Get paginated list of all orders
   */
  getAdminOrders: async (req, res) => {
    const { orders, meta } = await orderService.getAdminOrders(req.query);

    sendSuccess(res, {
      message: 'Admin orders retrieved successfully',
      data: { orders },
      meta,
    });
  },

  /**
   * PATCH /admin/orders/:id/status
   * Admin: Update order status or payment status
   */
  updateOrderStatus: async (req, res) => {
    const order = await orderService.updateOrderStatusByAdmin(
      req.params.id,
      req.body,
    );

    sendSuccess(res, {
      message: 'Order status updated successfully',
      data: { order },
    });
  },
};
