import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate, authorize } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { Roles } from '../../common/constants/index.js';
import {
  listUsersSchema,
  getUserByIdSchema,
  updateRoleSchema,
  updateStatusSchema,
} from './admin.schema.js';

const router = Router();

// ────────────────────────────────────────────────────────────────────────────────
// Middleware Stack
// ────────────────────────────────────────────────────────────────────────────────
// All routes in this module require authentication and at least ADMIN privileges
router.use(authenticate);
router.use(authorize(Roles.ADMIN, Roles.SUPER_ADMIN));

// ────────────────────────────────────────────────────────────────────────────────
// Endpoints
// ────────────────────────────────────────────────────────────────────────────────

// Get paginated list of users
router.get(
  '/users',
  validate(listUsersSchema),
  asyncHandler(adminController.getUsers)
);

// Get single user by ID
router.get(
  '/users/:id',
  validate(getUserByIdSchema),
  asyncHandler(adminController.getUserById)
);

// Update user's role (Controller/Service restricts this to SUPER_ADMIN)
router.patch(
  '/users/:id/role',
  validate(updateRoleSchema),
  asyncHandler(adminController.updateUserRole)
);

// Activate/Deactivate user
router.patch(
  '/users/:id/status',
  validate(updateStatusSchema),
  asyncHandler(adminController.updateUserStatus)
);

export const adminRouter = router;
