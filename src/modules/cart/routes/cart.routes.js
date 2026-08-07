/**
 * Cart Routes
 *
 * All endpoints require authentication — carts are user-private.
 * No admin-only variants: cart management is a customer concern only.
 *
 * Route table:
 *   GET    /cart             → getCart   (auto-creates if none)
 *   POST   /cart/items       → addItem
 *   PATCH  /cart/items/:id   → updateItem
 *   DELETE /cart/items/:id   → removeItem
 *   DELETE /cart             → clearCart
 */

import { Router } from 'express';
import { cartController } from '../controllers/cart.controller.js';
import { authenticate } from '../../../common/middleware/auth.js';
import { validate } from '../../../common/middleware/validate.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';
import {
  addItemSchema,
  updateItemSchema,
  cartItemParamSchema,
} from '../validators/cart.validator.js';

const router = Router();

// Every cart route requires a valid JWT
router.use(authenticate);

// ── Cart ─────────────────────────────────────────────────────────────────────
router.get(
  '/',
  asyncHandler(cartController.getCart),
);

router.delete(
  '/',
  asyncHandler(cartController.clearCart),
);

// ── Cart Items ────────────────────────────────────────────────────────────────
router.post(
  '/items',
  validate(addItemSchema),
  asyncHandler(cartController.addItem),
);

router.patch(
  '/items/:id',
  validate(updateItemSchema),
  asyncHandler(cartController.updateItem),
);

router.delete(
  '/items/:id',
  validate(cartItemParamSchema),
  asyncHandler(cartController.removeItem),
);

export const cartRouter = router;
