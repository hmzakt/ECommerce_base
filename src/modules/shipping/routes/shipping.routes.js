import { Router } from 'express';
import { shippingController } from '../controllers/shipping.controller.js';
import { authenticate, authorize } from '../../../common/middleware/auth.js';
import { validate } from '../../../common/middleware/validate.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';
import { Roles } from '../../../common/constants/index.js';
import { getShippingSchema, updateShippingSchema } from '../validators/shipping.validator.js';

const shippingRouter = Router();
const adminShippingRouter = Router();

// ── GET /orders/:id/shipping (Customer, protected by JWT) ─────────────────────
shippingRouter.get(
  '/:id/shipping',
  authenticate,
  validate(getShippingSchema),
  asyncHandler(shippingController.getShippingDetails)
);

// ── PATCH /admin/shipping/:id (Admin only) ────────────────────────────────────
adminShippingRouter.patch(
  '/:id',
  authenticate,
  authorize(Roles.ADMIN, Roles.SUPER_ADMIN),
  validate(updateShippingSchema),
  asyncHandler(shippingController.updateShipping)
);

export { shippingRouter, adminShippingRouter };
