/**
 * Cart Service
 *
 * Contains ALL business logic for the cart. No Prisma here — only
 * cartRepository calls, validation, and computed response shaping.
 *
 * Business rules enforced here:
 *  1. One active cart per user (auto-created on first access).
 *  2. Adding same product → INCREMENTS quantity (not replace).
 *  3. Quantity must be ≥ 1 (schema-level + service-level guard).
 *  4. Product must exist and be active before adding.
 *  5. CartItem ownership verified on every update/delete.
 *  6. All cart responses include subtotal, estimatedTotal, totalItems.
 */

import { cartRepository } from '../repositories/cart.repository.js';
import { prisma } from '../../../prisma/client.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';
import { logger } from '../../../common/logger/index.js';

// ─── Response shaping helper ────────────────────────────────────────────────────

/**
 * Attach computed fields (lineTotal, subtotal, totalItems, estimatedTotal)
 * to the raw cart row returned by the repository.
 *
 * Decimal precision: Prisma returns Decimal objects for price columns.
 * We convert to Number here for arithmetic, then format to 2 decimal places.
 *
 * @param {object} cart - Raw cart from repository
 * @returns {object}
 */
const shapeCart = (cart) => {
  const items = cart.items.map((item) => {
    const unitPrice = Number(item.product.price);
    const lineTotal = (unitPrice * item.quantity).toFixed(2);
    return {
      id: item.id,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.sku,
        price: unitPrice.toFixed(2),
        image: item.product.images[0]?.url ?? null,
        imageAlt: item.product.images[0]?.alt ?? null,
      },
      lineTotal,
    };
  });

  const subtotal = items
    .reduce((sum, item) => sum + parseFloat(item.lineTotal), 0)
    .toFixed(2);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: cart.id,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items,
    subtotal,
    totalItems,
    estimatedTotal: subtotal, // hook point for future: add tax/shipping
  };
};

// ─── Product validation helper ──────────────────────────────────────────────────

/**
 * Fetch and validate a product before adding to cart.
 * Throws specific errors the controller can surface to the client.
 *
 * @param {string} productId
 * @returns {Promise<object>} - Validated product
 */
const validateProduct = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, isActive: true },
  });

  if (!product) {
    throw AppError.notFound('Product not found.', ErrorCodes.NOT_FOUND);
  }

  if (!product.isActive) {
    throw AppError.badRequest(
      'This product is currently unavailable.',
      ErrorCodes.CART_ITEM_PRODUCT_INACTIVE,
    );
  }

  return product;
};

// ─── Cart or create helper ──────────────────────────────────────────────────────

/**
 * Get the user's cart, creating one if it doesn't exist.
 * This makes GET /cart idempotent — no separate "create cart" endpoint needed.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getOrCreateCart = async (userId) => {
  const existing = await cartRepository.findByUserId(userId);
  if (existing) return existing;

  logger.info({ userId }, 'Creating new cart for user');
  return cartRepository.createForUser(userId);
};

// ─── Service exports ────────────────────────────────────────────────────────────

export const cartService = {
  /**
   * Get (or auto-create) the user's cart with all computed fields.
   *
   * @param {string} userId
   * @returns {Promise<object>}
   */
  getCart: async (userId) => {
    const cart = await getOrCreateCart(userId);
    return shapeCart(cart);
  },

  /**
   * Add a product to the cart.
   * If the product is already in the cart, its quantity is INCREMENTED.
   *
   * @param {string} userId
   * @param {{ productId: string, quantity: number }} payload
   * @returns {Promise<object>} - Updated shaped cart
   */
  addItem: async (userId, { productId, quantity }) => {
    // 1. Validate product
    await validateProduct(productId);

    // 2. Get or create cart
    const cart = await getOrCreateCart(userId);

    // 3. Upsert item (add to existing or create new)
    const updatedCart = await cartRepository.upsertItem(cart.id, productId, quantity);

    logger.info({ userId, productId, quantity }, 'Item added to cart');
    return shapeCart(updatedCart);
  },

  /**
   * Update the quantity of an existing cart item.
   * Replaces (does not add) — this is the PATCH behaviour.
   *
   * @param {string} userId
   * @param {string} cartItemId
   * @param {{ quantity: number }} payload
   * @returns {Promise<object>} - Updated shaped cart
   */
  updateItem: async (userId, cartItemId, { quantity }) => {
    // 1. Load item
    const item = await cartRepository.findItemById(cartItemId);
    if (!item) {
      throw AppError.notFound('Cart item not found.', ErrorCodes.CART_ITEM_NOT_FOUND);
    }

    // 2. Verify this item belongs to the caller's cart
    const cart = await cartRepository.findByUserId(userId);
    if (!cart || cart.id !== item.cartId) {
      throw AppError.forbidden(
        'You do not have permission to modify this cart item.',
        ErrorCodes.CART_ITEM_OWNERSHIP_VIOLATION,
      );
    }

    // 3. Set (replace) quantity
    const updatedCart = await cartRepository.setItemQuantity(cartItemId, cart.id, quantity);

    logger.info({ userId, cartItemId, quantity }, 'Cart item quantity updated');
    return shapeCart(updatedCart);
  },

  /**
   * Remove a single item from the cart.
   *
   * @param {string} userId
   * @param {string} cartItemId
   * @returns {Promise<object>} - Updated shaped cart
   */
  removeItem: async (userId, cartItemId) => {
    // 1. Load item
    const item = await cartRepository.findItemById(cartItemId);
    if (!item) {
      throw AppError.notFound('Cart item not found.', ErrorCodes.CART_ITEM_NOT_FOUND);
    }

    // 2. Verify ownership
    const cart = await cartRepository.findByUserId(userId);
    if (!cart || cart.id !== item.cartId) {
      throw AppError.forbidden(
        'You do not have permission to remove this cart item.',
        ErrorCodes.CART_ITEM_OWNERSHIP_VIOLATION,
      );
    }

    // 3. Delete item
    const updatedCart = await cartRepository.deleteItem(cartItemId, cart.id);

    logger.info({ userId, cartItemId }, 'Cart item removed');
    return shapeCart(updatedCart);
  },

  /**
   * Remove all items from the cart.
   * The cart row itself is preserved — avoids re-creating it.
   *
   * @param {string} userId
   * @returns {Promise<object>} - Empty shaped cart
   */
  clearCart: async (userId) => {
    const cart = await getOrCreateCart(userId);
    const clearedCart = await cartRepository.clearItems(cart.id);

    logger.info({ userId, cartId: cart.id }, 'Cart cleared');
    return shapeCart(clearedCart);
  },
};
