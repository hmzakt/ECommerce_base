/**
 * Root Router
 *
 * This is the single mount point for all API routes.
 * Each module mounts its own sub-router here.
 *
 * Structure:
 *   /health       → inline health check
 *   /auth/*       → auth module (Milestone 2)
 *   /users/*      → users module (Milestone 2)
 *   /admin/*      → admin module (Milestone 3)
 */

import { Router } from 'express';

const router = Router();

// ────────────────────────────────────────────────────────────────────────────────
// Health Check
// Exposed at the root level for load balancers and uptime monitors.
// Returns 200 with basic runtime info when the server is healthy.
// ────────────────────────────────────────────────────────────────────────────────

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV,
    },
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// Module Routes (mounted in subsequent milestones)
// ────────────────────────────────────────────────────────────────────────────────

// Milestone 2: Auth module
import { authRouter } from '../modules/auth/auth.routes.js';
router.use('/auth', authRouter);

// Milestone 2: Users module
// import { usersRouter } from '../modules/users/users.routes.js';
// router.use('/users', usersRouter);

// Milestone 3: Admin module
import { adminRouter } from '../modules/admin/admin.routes.js';
router.use('/admin', adminRouter);

// Product Catalog Milestone
import { categoryRouter, adminCategoryRouter } from '../modules/categories/routes/category.routes.js';
import { productRouter, adminProductRouter } from '../modules/products/routes/product.routes.js';

router.use('/categories', categoryRouter);
router.use('/admin/categories', adminCategoryRouter);
router.use('/products', productRouter);
router.use('/admin/products', adminProductRouter);

// Cart Module
import { cartRouter } from '../modules/cart/routes/cart.routes.js';
router.use('/cart', cartRouter);

// Checkout & Orders Module
import { checkoutRouter } from '../modules/orders/routes/checkout.routes.js';
import { orderRouter, adminOrderRouter } from '../modules/orders/routes/order.routes.js';
router.use('/checkout', checkoutRouter);
router.use('/orders', orderRouter);
router.use('/admin/orders', adminOrderRouter);

// Payments Module (Razorpay)
import { paymentRouter } from '../modules/payments/routes/payment.routes.js';
router.use('/payments', paymentRouter);

// Shipping Module
import { shippingRouter, adminShippingRouter } from '../modules/shipping/routes/shipping.routes.js';
router.use('/orders', shippingRouter);            // GET /orders/:id/shipping
router.use('/admin/shipping', adminShippingRouter); // PATCH /admin/shipping/:id

// Admin Dashboard Module
import { dashboardRouter } from '../modules/dashboard/routes/dashboard.routes.js';
router.use('/admin/dashboard', dashboardRouter);

export default router;

