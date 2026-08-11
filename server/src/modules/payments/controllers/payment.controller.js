import { paymentService } from '../services/payment.service.js';
import { sendSuccess } from '../../../common/utils/response.js';

export const paymentController = {
  /**
   * POST /payments/create-order
   * Create Razorpay order for an existing internal Order.
   */
  createOrder: async (req, res) => {
    const result = await paymentService.createRazorpayOrder(
      req.user.userId,
      req.body.orderId,
    );

    sendSuccess(res, {
      message: 'Razorpay order created successfully',
      data: result,
      statusCode: 201,
    });
  },

  /**
   * POST /payments/verify
   * Verify HMAC-SHA256 signature and mark Order PAID.
   */
  verifyPayment: async (req, res) => {
    const payment = await paymentService.verifyPayment(
      req.user.userId,
      req.body,
    );

    sendSuccess(res, {
      message: 'Payment verified and order confirmed',
      data: { payment },
    });
  },

  /**
   * POST /payments/webhook
   * Handle asynchronous payment events from Razorpay.
   */
  handleWebhook: async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    // Support raw body if captured by express middleware or Fallback to JSON payload
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const eventBody = req.body;

    const result = await paymentService.processWebhook(
      rawBody,
      signature,
      eventBody,
    );

    // Always respond 200 to Razorpay webhooks to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed',
      data: result,
    });
  },

  /**
   * GET /payments/:id
   * Fetch payment details.
   */
  getPaymentById: async (req, res) => {
    const payment = await paymentService.getPaymentById(
      req.user.userId,
      req.params.id,
      req.user.role,
    );

    sendSuccess(res, {
      message: 'Payment details retrieved',
      data: { payment },
    });
  },
};
