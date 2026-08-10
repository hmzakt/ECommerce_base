import { z } from 'zod';

export const getShippingSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Order ID is required' }).uuid('Invalid Order ID format'),
  }),
});

export const updateShippingSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Shipping ID is required' }).uuid('Invalid Shipping ID format'),
  }),
  body: z.object({
    trackingNumber: z.string().trim().max(100).optional().nullable(),
    shippingProvider: z.string().trim().max(100).optional().nullable(),
    estimatedDelivery: z.string().datetime({ message: 'estimatedDelivery must be a valid ISO date string' }).optional().nullable(),
    actualDelivery: z.string().datetime({ message: 'actualDelivery must be a valid ISO date string' }).optional().nullable(),
    status: z.enum([
      'PENDING',
      'PACKED',
      'SHIPPED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'FAILED',
      'RETURNED',
    ]).optional(),
  }),
});
