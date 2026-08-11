import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  body: z.object({
    orderId: z.string({ required_error: 'Order ID is required' }).uuid('Invalid order ID format'),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string({ required_error: 'Order ID is required' }).uuid('Invalid order ID format'),
    razorpayOrderId: z
      .string({ required_error: 'razorpayOrderId is required' })
      .trim()
      .min(5, 'Invalid razorpayOrderId'),
    razorpayPaymentId: z
      .string({ required_error: 'razorpayPaymentId is required' })
      .trim()
      .min(5, 'Invalid razorpayPaymentId'),
    razorpaySignature: z
      .string({ required_error: 'razorpaySignature is required' })
      .trim()
      .min(10, 'Invalid razorpaySignature'),
  }),
});

export const paymentIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid payment ID format'),
  }),
});
