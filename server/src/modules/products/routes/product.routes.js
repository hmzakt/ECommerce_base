import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { authenticate, authorize } from '../../../common/middleware/auth.js';
import { validate } from '../../../common/middleware/validate.js';
import { asyncHandler } from '../../../common/utils/asyncHandler.js';
import { Roles } from '../../../common/constants/index.js';
import {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema,
  getProductByIdSchema,
  getProductBySlugSchema,
} from '../validators/product.validator.js';

const customerRouter = Router();
const adminRouter = Router();

// UUID validation regex (v4 format)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ────────────────────────────────────────────────────────────────────────────────
// Customer Routes (Public)
// ────────────────────────────────────────────────────────────────────────────────

// List products
customerRouter.get(
  '/',
  validate(queryProductsSchema),
  asyncHandler(productController.getProducts)
);

// Get product by ID (UUID check, fallback to slug if not UUID)
customerRouter.get(
  '/:id',
  (req, res, next) => {
    if (uuidRegex.test(req.params.id)) {
      return next();
    }
    return next('route'); // skip to next route matching /:slug
  },
  validate(getProductByIdSchema),
  asyncHandler(productController.getProductById)
);

// Get product by slug
customerRouter.get(
  '/:slug',
  validate(getProductBySlugSchema),
  asyncHandler(productController.getProductBySlug)
);

// ────────────────────────────────────────────────────────────────────────────────
// Admin Routes (Mutation only allowed for ADMIN and SUPER_ADMIN)
// ────────────────────────────────────────────────────────────────────────────────

adminRouter.use(authenticate);
adminRouter.use(authorize(Roles.ADMIN, Roles.SUPER_ADMIN));

// List all products including inactive
adminRouter.get(
  '/',
  validate(queryProductsSchema),
  asyncHandler(productController.getAdminProducts)
);

// Create product
adminRouter.post(
  '/',
  validate(createProductSchema),
  asyncHandler(productController.createProduct)
);

// Update product
adminRouter.patch(
  '/:id',
  validate(updateProductSchema),
  asyncHandler(productController.updateProduct)
);

// Delete product
adminRouter.delete(
  '/:id',
  validate(getProductByIdSchema),
  asyncHandler(productController.deleteProduct)
);

export { customerRouter as productRouter, adminRouter as adminProductRouter };
