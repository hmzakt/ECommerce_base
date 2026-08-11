/**
 * Cart Controller
 *
 * Thin layer: extract from req, call service, send response.
 * Zero business logic lives here.
 */

import { cartService } from '../services/cart.service.js';
import { sendSuccess } from '../../../common/utils/response.js';

export const cartController = {
  /**
   * GET /cart
   * Returns the authenticated user's cart, auto-creating it on first access.
   */
  getCart: async (req, res) => {
    const cart = await cartService.getCart(req.user.userId);
    sendSuccess(res, {
      message: 'Cart retrieved successfully',
      data: { cart },
    });
  },

  /**
   * POST /cart/items
   * Add a product to the cart. If already present, quantity increments.
   */
  addItem: async (req, res) => {
    const cart = await cartService.addItem(req.user.userId, req.body);
    sendSuccess(res, {
      message: 'Item added to cart',
      data: { cart },
      statusCode: 201,
    });
  },

  /**
   * PATCH /cart/items/:id
   * Replace the quantity of a cart item (does not add, replaces).
   */
  updateItem: async (req, res) => {
    const cart = await cartService.updateItem(
      req.user.userId,
      req.params.id,
      req.body,
    );
    sendSuccess(res, {
      message: 'Cart item updated successfully',
      data: { cart },
    });
  },

  /**
   * DELETE /cart/items/:id
   * Remove a single item from the cart.
   */
  removeItem: async (req, res) => {
    const cart = await cartService.removeItem(req.user.userId, req.params.id);
    sendSuccess(res, {
      message: 'Item removed from cart',
      data: { cart },
    });
  },

  /**
   * DELETE /cart
   * Remove all items from the cart (cart row is preserved).
   */
  clearCart: async (req, res) => {
    const cart = await cartService.clearCart(req.user.userId);
    sendSuccess(res, {
      message: 'Cart cleared successfully',
      data: { cart },
    });
  },
};
