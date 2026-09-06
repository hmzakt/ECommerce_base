import { productService } from '../services/product.service.js';
import { sendSuccess, buildPaginationMeta } from '../../../common/utils/response.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';

export const productController = {
  /**
   * Create a new product (Admin only)
   */
  createProduct: async (req, res) => {
    const product = await productService.createProduct(req.body);
    sendSuccess(res, {
      message: 'Product created successfully',
      data: { product },
      statusCode: 201,
    });
  },

  /**
   * Update a product (Admin only)
   */
  updateProduct: async (req, res) => {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    sendSuccess(res, {
      message: 'Product updated successfully',
      data: { product },
    });
  },

  /**
   * Delete a product (Admin only)
   */
  deleteProduct: async (req, res) => {
    const { id } = req.params;
    await productService.deleteProduct(id);
    sendSuccess(res, {
      message: 'Product deleted successfully',
    });
  },

  /**
   * Get product by ID (Public/Internal)
   */
  getProductById: async (req, res) => {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    sendSuccess(res, {
      message: 'Product retrieved successfully',
      data: { product },
    });
  },

  /**
   * Get product by slug (Public)
   */
  getProductBySlug: async (req, res) => {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug);

    if (!product.isActive) {
      throw AppError.notFound('Product not found', ErrorCodes.NOT_FOUND);
    }

    sendSuccess(res, {
      message: 'Product retrieved successfully',
      data: { product },
    });
  },

  /**
   * Get products list for Customers (Public)
   * Enforces isActive: true
   */
  getProducts: async (req, res) => {
    const filters = {
      ...req.query,
      active: true, // Customers can only see active products
    };

    const { products, total } = await productService.getProducts(filters);
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;

    sendSuccess(res, {
      message: 'Products retrieved successfully',
      data: { products },
      meta: buildPaginationMeta({ total, page, limit }),
    });
  },

  /**
   * Get products list for Admins (Admin only)
   * Shows all products
   */
  getAdminProducts: async (req, res) => {
    const { products, total } = await productService.getProducts(req.query);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;

    sendSuccess(res, {
      message: 'Products retrieved successfully',
      data: { products },
      meta: buildPaginationMeta({ total, page, limit }),
    });
  },
};
