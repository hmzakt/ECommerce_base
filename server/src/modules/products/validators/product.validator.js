import { z } from 'zod';
import { Pagination } from '../../../common/constants/index.js';

const imageSchema = z.object({
  url: z
    .string({ required_error: 'Image URL is required' })
    .trim()
    .url('Image must be a valid URL')
    .max(2048, 'Image URL is too long'),
  alt: z.string().trim().max(255, 'Alt text is too long').optional().nullable(),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Product name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name cannot exceed 255 characters'),
    shortDescription: z
      .string()
      .trim()
      .max(500, 'Short description cannot exceed 500 characters')
      .optional()
      .nullable(),
    description: z
      .string()
      .trim()
      .max(10000, 'Description cannot exceed 10000 characters')
      .optional()
      .nullable(),
    sku: z
      .string({ required_error: 'SKU is required' })
      .trim()
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU cannot exceed 50 characters'),
    brand: z
      .string({ required_error: 'Brand is required' })
      .trim()
      .min(1, 'Brand is required')
      .max(100, 'Brand cannot exceed 100 characters'),
    price: z
      .union([z.number(), z.string()])
      .transform((val) => Number(val))
      .refine((val) => !isNaN(val) && val >= 0, {
        message: 'Price must be a non-negative number',
      }),
    compareAtPrice: z
      .union([z.number(), z.string()])
      .transform((val) => (val === '' ? undefined : Number(val)))
      .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
        message: 'Compare-at price must be a non-negative number',
      })
      .optional()
      .nullable(),
    costPrice: z
      .union([z.number(), z.string()])
      .transform((val) => (val === '' ? undefined : Number(val)))
      .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
        message: 'Cost price must be a non-negative number',
      })
      .optional()
      .nullable(),
    categoryId: z.string({ required_error: 'Category ID is required' }).uuid('Invalid Category ID format'),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    images: z.array(imageSchema).optional(),
  }).refine(
    (data) => {
      if (data.compareAtPrice !== undefined && data.compareAtPrice !== null) {
        return data.compareAtPrice >= data.price;
      }
      return true;
    },
    {
      message: 'Compare-at price must be greater than or equal to the selling price',
      path: ['compareAtPrice'],
    }
  ),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Product ID format'),
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name cannot exceed 255 characters')
      .optional(),
    shortDescription: z
      .string()
      .trim()
      .max(500, 'Short description cannot exceed 500 characters')
      .optional()
      .nullable(),
    description: z
      .string()
      .trim()
      .max(10000, 'Description cannot exceed 10000 characters')
      .optional()
      .nullable(),
    sku: z
      .string()
      .trim()
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU cannot exceed 50 characters')
      .optional(),
    brand: z
      .string()
      .trim()
      .min(1, 'Brand must be at least 1 character')
      .max(100, 'Brand cannot exceed 100 characters')
      .optional(),
    price: z
      .union([z.number(), z.string()])
      .transform((val) => (val === undefined ? undefined : Number(val)))
      .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
        message: 'Price must be a non-negative number',
      })
      .optional(),
    compareAtPrice: z
      .union([z.number(), z.string()])
      .transform((val) => (val === '' || val === null ? null : val === undefined ? undefined : Number(val)))
      .refine((val) => val === undefined || val === null || (!isNaN(val) && val >= 0), {
        message: 'Compare-at price must be a non-negative number',
      })
      .optional()
      .nullable(),
    costPrice: z
      .union([z.number(), z.string()])
      .transform((val) => (val === '' || val === null ? null : val === undefined ? undefined : Number(val)))
      .refine((val) => val === undefined || val === null || (!isNaN(val) && val >= 0), {
        message: 'Cost price must be a non-negative number',
      })
      .optional()
      .nullable(),
    categoryId: z.string().uuid('Invalid Category ID format').optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    images: z.array(imageSchema).optional(),
  }),
});

export const queryProductsSchema = z.object({
  query: z.object({
    category: z.string().trim().optional(),
    brand: z.string().trim().optional(),
    minPrice: z.coerce
      .number()
      .min(0, 'Minimum price must be a non-negative number')
      .optional(),
    maxPrice: z.coerce
      .number()
      .min(0, 'Maximum price must be a non-negative number')
      .optional(),
    featured: z
      .string()
      .toLowerCase()
      .transform((val) => val === 'true')
      .optional(),
    active: z
      .string()
      .toLowerCase()
      .transform((val) => val === 'true')
      .optional(),
    search: z.string().trim().optional(),
    page: z.coerce
      .number()
      .int()
      .positive()
      .default(Pagination.DEFAULT_PAGE),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(Pagination.MAX_LIMIT)
      .default(Pagination.DEFAULT_LIMIT),
    sortBy: z
      .enum(['price_asc', 'price_desc', 'newest', 'oldest', 'name_asc', 'name_desc'])
      .default('newest'),
  }),
});

export const getProductByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Product ID format'),
  }),
});

export const getProductBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug is required'),
  }),
});
