import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../../../common/middleware/auth.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';
import { Roles } from '../../../common/constants/index.js';

const router = Router();

// All dashboard routes are Admin only
router.use(authenticate);
router.use(authorize(Roles.ADMIN, Roles.SUPER_ADMIN));

// GET /admin/dashboard
router.get('/', asyncHandler(dashboardController.getDashboardSummary));

// GET /admin/dashboard/revenue
router.get('/revenue', asyncHandler(dashboardController.getRevenueTrend));

// GET /admin/dashboard/orders
router.get('/orders', asyncHandler(dashboardController.getOrderStatusBreakdown));

export const dashboardRouter = router;
