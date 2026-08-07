import { categoryService } from '../services/category.service.js';
import { sendSuccess } from '../../../common/utils/response.js';

export const categoryController = {
  /**
   * Create a new category (Admin only)
   */
  createCategory: async (req, res) => {
    const category = await categoryService.createCategory(req.body);
    sendSuccess(res, {
      message: 'Category created successfully',
      data: { category },
      statusCode: 201,
    });
  },

  /**
   * Get all categories (Public)
   */
  getCategories: async (req, res) => {
    const categories = await categoryService.getCategories();
    sendSuccess(res, {
      message: 'Categories retrieved successfully',
      data: { categories },
    });
  },

  /**
   * Get category by slug (Public)
   */
  getCategoryBySlug: async (req, res) => {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);
    sendSuccess(res, {
      message: 'Category retrieved successfully',
      data: { category },
    });
  },

  /**
   * Update category (Admin only)
   */
  updateCategory: async (req, res) => {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.body);
    sendSuccess(res, {
      message: 'Category updated successfully',
      data: { category },
    });
  },

  /**
   * Delete category (Admin only)
   */
  deleteCategory: async (req, res) => {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    sendSuccess(res, {
      message: 'Category deleted successfully',
    });
  },
};
