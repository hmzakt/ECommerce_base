import { z } from 'zod';

/**
 * Shared UUID param schema for cart item routes
 */
const cartItemIdParam = z.object({
  params: z.object({
    id: z.string({ required_error: 'Cart item ID is required' }).uuid('Invalid cart item ID'),
  }),
});

/**
 * POST /cart/items
 */
export const addItemSchema = z.object({
  body: z.object({
    productId: z
      .string({ required_error: 'Product ID is required' })
      .uuid('Invalid product ID'),
    quantity: z
      .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
      .max(999, 'Quantity cannot exceed 999'),
  }),
});

/**
 * PATCH /cart/items/:id
 */
export const updateItemSchema = cartItemIdParam.extend({
  body: z.object({
    quantity: z
      .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
      .max(999, 'Quantity cannot exceed 999'),
  }),
});

/**
 * DELETE /cart/items/:id
 */
export const cartItemParamSchema = cartItemIdParam;
