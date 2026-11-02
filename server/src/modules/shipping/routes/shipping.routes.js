import { Router } from 'express';
import { shippingController } from '../controllers/shipping.controller.js';
import { adminShippingController } from '../controllers/adminShipping.controller.js';
import { authenticate, authorize } from '../../../common/middleware/auth.js';
import { validate } from '../../../common/middleware/validate.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';
import { Roles } from '../../../common/constants/index.js';
import { getShippingSchema, updateShippingSchema } from '../validators/shipping.validator.js';
import {
  listShipmentsSchema,
  createShipmentSchema,
  shipmentIdParamSchema,
  orderIdParamSchema,
  cancelShipmentSchema,
  updateSettingsSchema,
  updateProviderSchema,
} from '../validators/adminShipping.validator.js';

const shippingRouter = Router();
const adminShippingRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Customer Routes: Mounted at /api/v1/orders
// ─────────────────────────────────────────────────────────────────────────────

// GET /orders/:id/shipping (Customer, protected by JWT)
shippingRouter.get(
  '/:id/shipping',
  authenticate,
  validate(getShippingSchema),
  asyncHandler(shippingController.getShippingDetails)
);

// ─────────────────────────────────────────────────────────────────────────────
// Admin Routes: Mounted at /api/v1/admin/shipping
// Protected by authenticate + authorize(ADMIN, SUPER_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────

adminShippingRouter.use(authenticate, authorize(Roles.ADMIN, Roles.SUPER_ADMIN));

// 1. Shipment Listing & Detail
adminShippingRouter.get(
  '/shipments',
  validate(listShipmentsSchema),
  asyncHandler(adminShippingController.getShipments)
);

adminShippingRouter.get(
  '/shipments/:id',
  validate(shipmentIdParamSchema),
  asyncHandler(adminShippingController.getShipmentById)
);

// 2. Order Courier Quotes & Manual Shipment Creation
adminShippingRouter.get(
  '/orders/:orderId/courier-options',
  validate(orderIdParamSchema),
  asyncHandler(adminShippingController.getCourierOptions)
);

adminShippingRouter.post(
  '/orders/:orderId/create-shipment',
  validate(createShipmentSchema),
  asyncHandler(adminShippingController.createShipment)
);

// 3. Operational Logistics (AWB, Pickup, Label, Sync Tracking, Cancel)
adminShippingRouter.post(
  '/shipments/:id/assign-awb',
  validate(shipmentIdParamSchema),
  asyncHandler(adminShippingController.assignAwb)
);

adminShippingRouter.post(
  '/shipments/:id/request-pickup',
  validate(shipmentIdParamSchema),
  asyncHandler(adminShippingController.requestPickup)
);

adminShippingRouter.get(
  '/shipments/:id/label',
  validate(shipmentIdParamSchema),
  asyncHandler(adminShippingController.getShippingLabel)
);

adminShippingRouter.post(
  '/shipments/:id/cancel',
  validate(cancelShipmentSchema),
  asyncHandler(adminShippingController.cancelShipment)
);

adminShippingRouter.post(
  '/shipments/:id/sync-tracking',
  validate(shipmentIdParamSchema),
  asyncHandler(adminShippingController.syncTracking)
);

// 4. Logistics Settings Configuration
adminShippingRouter.get(
  '/settings',
  asyncHandler(adminShippingController.getSettings)
);

adminShippingRouter.put(
  '/settings',
  validate(updateSettingsSchema),
  asyncHandler(adminShippingController.updateSettings)
);

// 5. Providers Management
adminShippingRouter.get(
  '/providers',
  asyncHandler(adminShippingController.getProviders)
);

adminShippingRouter.patch(
  '/providers/:id',
  validate(updateProviderSchema),
  asyncHandler(adminShippingController.updateProvider)
);

// 6. Legacy Admin Endpoint: PATCH /admin/shipping/:id
adminShippingRouter.patch(
  '/:id',
  validate(updateShippingSchema),
  asyncHandler(shippingController.updateShipping)
);

export { shippingRouter, adminShippingRouter };
