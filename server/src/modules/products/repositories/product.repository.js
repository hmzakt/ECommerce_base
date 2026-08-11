import { prisma } from '../../../prisma/client.js';

/**
 * Selection fields to avoid SELECT *
 */
const selectFields = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  description: true,
  sku: true,
  brand: true,
  price: true,
  compareAtPrice: true,
  costPrice: true,
  categoryId: true,
  isActive: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  images: {
    select: {
      id: true,
      url: true,
      alt: true,
      displayOrder: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  },
};

export const productRepository = {
  /**
   * Find product by ID
   * @param {string} id
   */
  findById: async (id) => {
    return prisma.product.findUnique({
      where: { id },
      select: selectFields,
    });
  },

  /**
   * Find product by Slug
   * @param {string} slug
   */
  findBySlug: async (slug) => {
    return prisma.product.findUnique({
      where: { slug },
      select: selectFields,
    });
  },

  /**
   * Find product by SKU
   * @param {string} sku
   */
  findBySku: async (sku) => {
    return prisma.product.findUnique({
      where: { sku },
      select: selectFields,
    });
  },

  /**
   * Create a new product with images in a single transaction
   * @param {import('../types/product.types.js').ProductCreateInput} data
   */
  create: async (data) => {
    const { images, ...productData } = data;

    return prisma.product.create({
      data: {
        ...productData,
        images: images && images.length > 0 ? {
          create: images,
        } : undefined,
      },
      select: selectFields,
    });
  },

  /**
   * Update product and its images in a transaction
   * @param {string} id
   * @param {import('../types/product.types.js').ProductUpdateInput} data
   */
  update: async (id, data) => {
    const { images, ...productData } = data;

    return prisma.$transaction(async (tx) => {
      // If images list is provided, delete existing and write new ones
      if (images !== undefined) {
        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img) => ({
              ...img,
              productId: id,
            })),
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: productData,
        select: selectFields,
      });
    });
  },

  /**
   * Delete product (cascade deletes images)
   * @param {string} id
   */
  delete: async (id) => {
    return prisma.product.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        sku: true,
      },
    });
  },

  /**
   * Search, filter, and paginate products
   * @param {import('../types/product.types.js').ProductQueryFilters} filters
   */
  findManyAndCount: async (filters) => {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      featured,
      active,
      search,
      page = 1,
      limit = 20,
      sortBy = 'newest',
    } = filters;

    const skip = (page - 1) * limit;

    // Build Prisma query condition
    const where = {};

    // Handle postgres search (partial matches, case-insensitive)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (featured !== undefined) {
      where.isFeatured = featured;
    }

    if (active !== undefined) {
      where.isActive = active;
    }

    // Sorting mapping
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sortBy === 'name_asc') {
      orderBy = { name: 'asc' };
    } else if (sortBy === 'name_desc') {
      orderBy = { name: 'desc' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: selectFields,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  },
};
