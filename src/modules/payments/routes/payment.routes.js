import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../../../common/middleware/auth.js';
import { validate } from '../../../common/middleware/validate.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
  paymentIdParamSchema,
} from '../validators/payment.validator.js';

const router = Router();

// ── Public Webhook Endpoint (Signature verified internally) ───────────────────
router.post(
  '/webhook',
  asyncHandler(paymentController.handleWebhook),
);

// ── Customer Protected Routes (Requires JWT) ──────────────────────────────────
router.post(
  '/create-order',
  authenticate,
  validate(createPaymentOrderSchema),
  asyncHandler(paymentController.createOrder),
);

router.post(
  '/verify',
  authenticate,
  validate(verifyPaymentSchema),
  asyncHandler(paymentController.verifyPayment),
);

router.get(
  '/:id',
  authenticate,
  validate(paymentIdParamSchema),
  asyncHandler(paymentController.getPaymentById),
);

export const paymentRouter = router;
