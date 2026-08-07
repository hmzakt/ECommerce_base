import { z } from 'zod';
import { Pagination } from '../../../common/constants/index.js';

export const checkoutSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      fullName: z
        .string({ required_error: 'Full name is required' })
        .trim()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name cannot exceed 100 characters'),
      streetAddress: z
        .string({ required_error: 'Street address is required' })
        .trim()
        .min(3, 'Street address must be at least 3 characters')
        .max(200, 'Street address cannot exceed 200 characters'),
      apartment: z
        .string()
        .trim()
        .max(100, 'Apartment cannot exceed 100 characters')
        .optional()
        .nullable(),
      city: z
        .string({ required_error: 'City is required' })
        .trim()
        .min(2, 'City must be at least 2 characters')
        .max(100, 'City cannot exceed 100 characters'),
      state: z
        .string({ required_error: 'State/Province is required' })
        .trim()
        .min(2, 'State must be at least 2 characters')
        .max(100, 'State cannot exceed 100 characters'),
      postalCode: z
        .string({ required_error: 'Postal code is required' })
        .trim()
        .min(3, 'Postal code must be at least 3 characters')
        .max(20, 'Postal code cannot exceed 20 characters')
        .regex(/^[a-zA-Z0-9\s-]+$/, 'Postal code contains invalid characters'),
      country: z
        .string({ required_error: 'Country is required' })
        .trim()
        .min(2, 'Country must be at least 2 characters')
        .max(100, 'Country cannot exceed 100 characters'),
      phone: z
        .string({ required_error: 'Phone number is required' })
        .trim()
        .regex(/^\+?[1-9]\d{6,14}$/, 'Please enter a valid phone number (e.g. +1234567890)'),
    }),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID format'),
  }),
  body: z
    .object({
      status: z
        .enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
          invalid_type_error: 'Invalid order status',
        })
        .optional(),
      paymentStatus: z
        .enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED'], {
          invalid_type_error: 'Invalid payment status',
        })
        .optional(),
    })
    .refine((data) => data.status !== undefined || data.paymentStatus !== undefined, {
      message: 'At least one of status or paymentStatus must be provided',
    }),
});

export const orderParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID format'),
  }),
});

export const listOrdersQuerySchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int()
      .positive()
      .default(Pagination.DEFAULT_PAGE),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(Pagination.MAX_LIMIT)
      .default(Pagination.DEFAULT_LIMIT),
    status: z
      .enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
      .optional(),
    search: z.string().trim().optional(),
  }),
});
