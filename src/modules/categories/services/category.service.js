import { categoryRepository } from '../repositories/category.repository.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';

/**
 * Helper to slugify a string
 * @param {string} text
 * @returns {string}
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
};

/**
 * Helper to generate a unique slug in the database
 * @param {string} name
 * @returns {Promise<string>}
 */
const generateUniqueSlug = async (name) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await categoryRepository.findBySlug(slug);
    if (!existing) {
      return slug;
    }
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
};

export const categoryService = {
  /**
   * Create a new category
   * @param {import('../types/category.types.js').CategoryCreateInput} data
   * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
   */
  createCategory: async (data) => {
    // Check if category name is already taken
    const existingByName = await categoryRepository.findByName(data.name);
    if (existingByName) {
      throw AppError.badRequest(
        'Category with this name already exists.',
        ErrorCodes.BAD_REQUEST
      );
    }

    // Auto generate unique slug from name
    const slug = await generateUniqueSlug(data.name);

    return categoryRepository.create({
      ...data,
      slug,
    });
  },

  /**
   * Get all categories
   * @returns {Promise<import('../types/category.types.js').CategoryResponse[]>}
   */
  getCategories: async () => {
    return categoryRepository.findAll();
  },

  /**
   * Get category by slug
   * @param {string} slug
   * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
   */
  getCategoryBySlug: async (slug) => {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) {
      throw AppError.notFound('Category not found', ErrorCodes.NOT_FOUND);
    }
    return category;
  },

  /**
   * Update category
   * @param {string} id
   * @param {import('../types/category.types.js').CategoryUpdateInput} data
   * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
   */
  updateCategory: async (id, data) => {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Category not found', ErrorCodes.NOT_FOUND);
    }

    const updateData = { ...data };

    // If updating name, check for duplicate and generate new slug
    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicateName = await categoryRepository.findByName(data.name);
      if (duplicateName) {
        throw AppError.badRequest(
          'Category with this name already exists.',
          ErrorCodes.BAD_REQUEST
        );
      }
      updateData.slug = await generateUniqueSlug(data.name);
    } else {
      // Avoid overriding slug if name hasn't changed, ignore client provided slugs
      delete updateData.slug;
    }

    return categoryRepository.update(id, updateData);
  },

  /**
   * Delete category
   * @param {string} id
   * @returns {Promise<void>}
   */
  deleteCategory: async (id) => {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Category not found', ErrorCodes.NOT_FOUND);
    }

    // Try deleting. If there are dependent products, Prisma will throw foreign key constraint error.
    // That is caught by global error handler or we can check here.
    try {
      await categoryRepository.delete(id);
    } catch (error) {
      // Prisma code for restrict constraint violation: P2003
      if (error.code === 'P2003') {
        throw AppError.badRequest(
          'Cannot delete category with associated products.',
          ErrorCodes.BAD_REQUEST
        );
      }
      throw error;
    }
  },
};
