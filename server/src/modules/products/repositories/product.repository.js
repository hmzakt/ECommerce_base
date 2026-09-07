import { prisma } from '../../../prisma/client.js';
import { Prisma } from '@prisma/client';

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
   * Search, filter, and paginate products using PostgreSQL Full-Text Search + pg_trgm
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
      sortBy,
    } = filters;

    const skip = (page - 1) * limit;
    const queryTerm = typeof search === 'string' ? search.trim() : '';
    const effectiveSort = sortBy || (queryTerm.length > 0 ? 'relevance' : 'newest');

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Full-Text Search + pg_trgm Fuzzy Search (when search query provided)
    // ──────────────────────────────────────────────────────────────────────────
    if (queryTerm.length > 0) {
      const conditions = [];

      // Hybrid matching: English FTS + trigram similarity + word similarity + SKU match
      conditions.push(Prisma.sql`(
        to_tsvector('english', coalesce(p.name, '') || ' ' || coalesce(p.brand, '') || ' ' || coalesce(p.short_description, '') || ' ' || coalesce(p.description, '')) @@ websearch_to_tsquery('english', ${queryTerm})
        OR p.name % ${queryTerm}
        OR p.brand % ${queryTerm}
        OR word_similarity(${queryTerm}, p.name) > 0.25
        OR word_similarity(${queryTerm}, p.brand) > 0.25
        OR p.sku ILIKE ${'%' + queryTerm + '%'}
      )`);

      if (category) {
        conditions.push(Prisma.sql`c.slug = ${category}`);
      }

      if (brand) {
        conditions.push(Prisma.sql`LOWER(p.brand) = LOWER(${brand})`);
      }

      if (minPrice !== undefined) {
        conditions.push(Prisma.sql`p.price >= ${minPrice}`);
      }

      if (maxPrice !== undefined) {
        conditions.push(Prisma.sql`p.price <= ${maxPrice}`);
      }

      if (featured !== undefined) {
        conditions.push(Prisma.sql`p.is_featured = ${featured}`);
      }

      if (active !== undefined) {
        conditions.push(Prisma.sql`p.is_active = ${active}`);
      }

      const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

      // Default to relevance ranking when search term is active unless user explicitly chose a sort
      let orderClause = Prisma.sql`
        ORDER BY (
          ts_rank_cd(
            setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(p.brand, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(p.short_description, '') || ' ' || coalesce(p.description, '')), 'C'),
            websearch_to_tsquery('english', ${queryTerm})
          ) * 3.0 +
          similarity(p.name, ${queryTerm}) * 2.5 +
          word_similarity(${queryTerm}, p.name) * 1.5 +
          similarity(p.brand, ${queryTerm}) * 1.0
        ) DESC, p.created_at DESC
      `;

      if (effectiveSort === 'price_asc') {
        orderClause = Prisma.sql`ORDER BY p.price ASC, p.created_at DESC`;
      } else if (effectiveSort === 'price_desc') {
        orderClause = Prisma.sql`ORDER BY p.price DESC, p.created_at DESC`;
      } else if (effectiveSort === 'newest') {
        orderClause = Prisma.sql`ORDER BY p.created_at DESC`;
      } else if (effectiveSort === 'oldest') {
        orderClause = Prisma.sql`ORDER BY p.created_at ASC`;
      } else if (effectiveSort === 'name_asc') {
        orderClause = Prisma.sql`ORDER BY p.name ASC`;
      } else if (effectiveSort === 'name_desc') {
        orderClause = Prisma.sql`ORDER BY p.name DESC`;
      }

      // Execute ID selection and total count in parallel
      const [idResults, countResult] = await Promise.all([
        prisma.$queryRaw`
          SELECT p.id
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          ${whereClause}
          ${orderClause}
          LIMIT ${limit} OFFSET ${skip}
        `,
        prisma.$queryRaw`
          SELECT COUNT(*)::int AS total
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          ${whereClause}
        `,
      ]);

      const total = countResult[0]?.total ?? 0;
      const ids = idResults.map((r) => r.id);

      if (ids.length === 0) {
        return { products: [], total };
      }

      // Hydrate products with selectFields (category, images) and maintain rank order
      const rawProducts = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: selectFields,
      });

      const idMap = new Map(rawProducts.map((p) => [p.id, p]));
      const products = ids.map((id) => idMap.get(id)).filter(Boolean);

      return { products, total };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Standard Browse / Filtering (when no search query is provided)
    // ──────────────────────────────────────────────────────────────────────────
    const where = {};

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
    if (effectiveSort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (effectiveSort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (effectiveSort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (effectiveSort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (effectiveSort === 'name_asc') {
      orderBy = { name: 'asc' };
    } else if (effectiveSort === 'name_desc') {
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
