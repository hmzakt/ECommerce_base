/**
 * Cart Repository
 *
 * All Prisma interactions for Cart and CartItem live here.
 * No business logic — only data access.
 *
 * Performance decisions:
 *  - Single query with `include` fetches cart + items + product snapshot
 *    (avoids N+1 by letting Prisma generate a single JOIN)
 *  - Only the fields needed for the cart response are selected (no SELECT *)
 *  - `upsert` on CartItem uses the @@unique([cartId, productId]) constraint
 *    to atomically handle both "insert new item" and "set quantity"
 */

import { prisma } from '../../../prisma/client.js';

// ─── Shared select shape ────────────────────────────────────────────────────────
// Centralised here so the shape is identical whether the cart is created,
// loaded, or returned after a mutation — no accidental field drift.

const cartSelect = {
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      quantity: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true,
          isActive: true,
          images: {
            select: { url: true, alt: true },
            where: { displayOrder: 1 }, // primary image only
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' }, // stable ordering for display
  },
};

export const cartRepository = {
  /**
   * Find a cart (with items and product snapshots) by user ID.
   *
   * @param {string} userId
   * @returns {Promise<object|null>}
   */
  findByUserId: async (userId) => {
    return prisma.cart.findUnique({
      where: { userId },
      select: cartSelect,
    });
  },

  /**
   * Create an empty cart for a user.
   *
   * @param {string} userId
   * @returns {Promise<object>}
   */
  createForUser: async (userId) => {
    return prisma.cart.create({
      data: { userId },
      select: cartSelect,
    });
  },

  /**
   * Upsert a CartItem.
   *
   * "Upsert" here means:
   *   - If [cartId, productId] does not exist → insert with given quantity.
   *   - If [cartId, productId] already exists → ADD the quantity to existing.
   *
   * Uses a Prisma transaction + raw upsert to guarantee atomicity.
   * The increment behaviour (adding, not replacing) mirrors the business rule:
   * "Adding the same product twice increases quantity."
   *
   * @param {string} cartId
   * @param {string} productId
   * @param {number} quantity
   * @returns {Promise<object>} - Updated cart
   */
  upsertItem: async (cartId, productId, quantity) => {
    return prisma.$transaction(async (tx) => {
      // Try to find existing item
      const existing = await tx.cartItem.findUnique({
        where: { cartId_productId: { cartId, productId } },
        select: { id: true, quantity: true },
      });

      if (existing) {
        // Item exists → increment quantity
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
      } else {
        // New item → create
        await tx.cartItem.create({
          data: { cartId, productId, quantity },
        });
      }

      // Return refreshed cart
      return tx.cart.findUnique({
        where: { id: cartId },
        select: cartSelect,
      });
    });
  },

  /**
   * Find a single CartItem by ID.
   *
   * @param {string} itemId
   * @returns {Promise<object|null>}
   */
  findItemById: async (itemId) => {
    return prisma.cartItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        cartId: true,
        productId: true,
        quantity: true,
      },
    });
  },

  /**
   * Set the quantity of a CartItem to an exact value.
   * Use this for PATCH /cart/items/:id — replaces, does not add.
   *
   * @param {string} itemId
   * @param {string} cartId - Parent cart ID (used to return refreshed cart)
   * @param {number} quantity
   * @returns {Promise<object>} - Updated cart
   */
  setItemQuantity: async (itemId, cartId, quantity) => {
    return prisma.$transaction(async (tx) => {
      await tx.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });

      return tx.cart.findUnique({
        where: { id: cartId },
        select: cartSelect,
      });
    });
  },

  /**
   * Delete a single CartItem.
   *
   * @param {string} itemId
   * @param {string} cartId - Parent cart ID (used to return refreshed cart)
   * @returns {Promise<object>} - Updated cart
   */
  deleteItem: async (itemId, cartId) => {
    return prisma.$transaction(async (tx) => {
      await tx.cartItem.delete({ where: { id: itemId } });

      return tx.cart.findUnique({
        where: { id: cartId },
        select: cartSelect,
      });
    });
  },

  /**
   * Delete all CartItems for a cart (but keep the cart row itself).
   * Cheaper than creating a new cart — preserves cart ID continuity.
   *
   * @param {string} cartId
   * @returns {Promise<object>} - Empty cart
   */
  clearItems: async (cartId) => {
    return prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId } });

      return tx.cart.findUnique({
        where: { id: cartId },
        select: cartSelect,
      });
    });
  },
};
