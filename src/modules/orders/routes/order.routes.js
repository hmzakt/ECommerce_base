import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authenticate, authorize } from '../../../common/middleware/auth.js';
import { validate } from '../../../common/middleware/validate.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';
import { Roles } from '../../../common/constants/index.js';
import {
  orderParamSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from '../validators/order.validator.js';

const customerRouter = Router();
const adminRouter = Router();

// ────────────────────────────────────────────────────────────────────────────────
// Customer Routes (Protected by authenticate)
// ────────────────────────────────────────────────────────────────────────────────
customerRouter.use(authenticate);

// GET /orders
customerRouter.get(
  '/',
  validate(listOrdersQuerySchema),
  asyncHandler(orderController.getCustomerOrders),
);

// GET /orders/:id
customerRouter.get(
  '/:id',
  validate(orderParamSchema),
  asyncHandler(orderController.getCustomerOrderById),
);

// ────────────────────────────────────────────────────────────────────────────────
// Admin Routes (Protected by authenticate + authorize(ADMIN, SUPER_ADMIN))
// ────────────────────────────────────────────────────────────────────────────────
adminRouter.use(authenticate);
adminRouter.use(authorize(Roles.ADMIN, Roles.SUPER_ADMIN));

// GET /admin/orders
adminRouter.get(
  '/',
  validate(listOrdersQuerySchema),
  asyncHandler(orderController.getAdminOrders),
);

// PATCH /admin/orders/:id/status
adminRouter.patch(
  '/:id/status',
  validate(updateOrderStatusSchema),
  asyncHandler(orderController.updateOrderStatus),
);

export { customerRouter as orderRouter, adminRouter as adminOrderRouter };
