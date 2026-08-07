import { Router } from 'express';
import { checkoutController } from '../controllers/checkout.controller.js';
import { authenticate } from '../../../common/middleware/auth.js';
import { validate } from '../../../common/middleware/validate.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';
import { checkoutSchema } from '../validators/order.validator.js';

const router = Router();

// POST /checkout (Customer, authenticated)
router.post(
  '/',
  authenticate,
  validate(checkoutSchema),
  asyncHandler(checkoutController.processCheckout),
);

export const checkoutRouter = router;
