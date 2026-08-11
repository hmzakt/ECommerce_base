import { productRepository } from '../repositories/product.repository.js';
import { categoryRepository } from '../../categories/repositories/category.repository.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';

/**
 * Helper to slugify text
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Helper to generate a unique slug for a product
 */
const generateUniqueSlug = async (name) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await productRepository.findBySlug(slug);
    if (!existing) {
      return slug;
    }
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
};

export const productService = {
  /**
   * Create a new product
   * @param {import('../types/product.types.js').ProductCreateInput} data
   */
  createProduct: async (data) => {
    // 1. Verify Category exists
    const category = await categoryRepository.findById(data.categoryId);
    if (!category) {
      throw AppError.badRequest('Category not found.', ErrorCodes.BAD_REQUEST);
    }

    // 2. Verify SKU is unique
    const existingSku = await productRepository.findBySku(data.sku);
    if (existingSku) {
      throw AppError.badRequest('Product SKU already exists.', ErrorCodes.BAD_REQUEST);
    }

    // 3. Auto generate slug
    const slug = await generateUniqueSlug(data.name);

    // 4. Map images sequentially to assign ordering (first gets displayOrder 1)
    const formattedImages = data.images
      ? data.images.map((img, index) => ({
          url: img.url,
          alt: img.alt || null,
          displayOrder: index + 1,
        }))
      : [];

    return productRepository.create({
      ...data,
      slug,
      images: formattedImages,
    });
  },

  /**
   * Update an existing product
   * @param {string} id
   * @param {import('../types/product.types.js').ProductUpdateInput} data
   */
  updateProduct: async (id, data) => {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Product not found', ErrorCodes.NOT_FOUND);
    }

    const updateData = { ...data };

    // 1. Validate Category if provided
    if (data.categoryId) {
      const category = await categoryRepository.findById(data.categoryId);
      if (!category) {
        throw AppError.badRequest('Category not found.', ErrorCodes.BAD_REQUEST);
      }
    }

    // 2. Validate SKU if changed
    if (data.sku && data.sku !== existing.sku) {
      const existingSku = await productRepository.findBySku(data.sku);
      if (existingSku) {
        throw AppError.badRequest('Product SKU already exists.', ErrorCodes.BAD_REQUEST);
      }
    }

    // 3. Auto generate new slug if name is changed
    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      updateData.slug = await generateUniqueSlug(data.name);
    } else {
      delete updateData.slug;
    }

    // 4. Map images sequentially to assign ordering if provided
    if (data.images !== undefined) {
      updateData.images = data.images.map((img, index) => ({
        url: img.url,
        alt: img.alt || null,
        displayOrder: index + 1,
      }));
    }

    return productRepository.update(id, updateData);
  },

  /**
   * Delete a product
   * @param {string} id
   */
  deleteProduct: async (id) => {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Product not found', ErrorCodes.NOT_FOUND);
    }
    await productRepository.delete(id);
  },

  /**
   * Get product by ID
   * @param {string} id
   */
  getProductById: async (id) => {
    const product = await productRepository.findById(id);
    if (!product) {
      throw AppError.notFound('Product not found', ErrorCodes.NOT_FOUND);
    }
    return product;
  },

  /**
   * Get product by Slug
   * @param {string} slug
   */
  getProductBySlug: async (slug) => {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw AppError.notFound('Product not found', ErrorCodes.NOT_FOUND);
    }
    return product;
  },

  /**
   * Query products (with search, pagination, filtering, sorting)
   * @param {import('../types/product.types.js').ProductQueryFilters} filters
   */
  getProducts: async (filters) => {
    return productRepository.findManyAndCount(filters);
  },
};
