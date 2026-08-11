import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authenticate, authorize } from '../../../common/middleware/auth.js';
import { validate } from '../../../common/middleware/validate.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';
import { Roles } from '../../../common/constants/index.js';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoryBySlugSchema,
  getCategoryByIdSchema,
} from '../validators/category.validator.js';

// Customer Router (Public)
const customerRouter = Router();

customerRouter.get(
  '/',
  asyncHandler(categoryController.getCategories)
);

customerRouter.get(
  '/:slug',
  validate(getCategoryBySlugSchema),
  asyncHandler(categoryController.getCategoryBySlug)
);

// Admin Router (Protected)
const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(authorize(Roles.ADMIN, Roles.SUPER_ADMIN));

adminRouter.post(
  '/',
  validate(createCategorySchema),
  asyncHandler(categoryController.createCategory)
);

adminRouter.patch(
  '/:id',
  validate(updateCategorySchema),
  asyncHandler(categoryController.updateCategory)
);

adminRouter.delete(
  '/:id',
  validate(getCategoryByIdSchema),
  asyncHandler(categoryController.deleteCategory)
);

export { customerRouter as categoryRouter, adminRouter as adminCategoryRouter };
