import { prisma } from '../../../prisma/client.js';

/**
 * Category Repository
 *
 * Implements the database queries for Categories.
 * Never performs select *; retrieves only requested fields.
 */
export const categoryRepository = {
  /**
   * Find category by ID
   * @param {string} id
   * @returns {Promise<import('../types/category.types.js').CategoryResponse|null>}
   */
  findById: async (id) => {
    return prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Find category by slug
   * @param {string} slug
   * @returns {Promise<import('../types/category.types.js').CategoryResponse|null>}
   */
  findBySlug: async (slug) => {
    return prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Find category by name
   * @param {string} name
   * @returns {Promise<import('../types/category.types.js').CategoryResponse|null>}
   */
  findByName: async (name) => {
    return prisma.category.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Find all categories
   * @returns {Promise<import('../types/category.types.js').CategoryResponse[]>}
   */
  findAll: async () => {
    return prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Create new category
   * @param {import('../types/category.types.js').CategoryCreateInput} data
   * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
   */
  create: async (data) => {
    return prisma.category.create({
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Update category
   * @param {string} id
   * @param {import('../types/category.types.js').CategoryUpdateInput} data
   * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
   */
  update: async (id, data) => {
    return prisma.category.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Delete category
   * @param {string} id
   * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
   */
  delete: async (id) => {
    return prisma.category.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
