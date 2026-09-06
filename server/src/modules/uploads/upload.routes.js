import { Router } from 'express';
import { uploadController } from './upload.controller.js';
import { upload } from './upload.middleware.js';
import { authenticate, authorize } from '../../common/middleware/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { Roles } from '../../common/constants/index.js';

const router = Router();

// Require authenticated user with admin or super admin role
router.use(authenticate);
router.use(authorize(Roles.ADMIN, Roles.SUPER_ADMIN));

// Single image upload: POST /api/v1/admin/uploads/image
router.post(
  '/image',
  upload.single('file'),
  asyncHandler(uploadController.uploadImage)
);

export const adminUploadRouter = router;
