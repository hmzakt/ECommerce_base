/**
 * @typedef {Object} ProductImageInput
 * @property {string} url - The image URL
 * @property {string} [alt] - Optional image alt text
 * @property {number} [displayOrder] - Ordering of the image
 */

/**
 * @typedef {Object} ProductCreateInput
 * @property {string} name - Product name
 * @property {string} [slug] - Optional slug
 * @property {string} [shortDescription] - Optional short description
 * @property {string} [description] - Optional full description
 * @property {string} sku - Product SKU (unique)
 * @property {string} brand - Product brand
 * @property {number|string} price - Selling price
 * @property {number|string} [compareAtPrice] - List/old price
 * @property {number|string} [costPrice] - Wholesale/cost price
 * @property {string} categoryId - Category UUID
 * @property {boolean} [isActive] - Active status
 * @property {boolean} [isFeatured] - Featured status
 * @property {ProductImageInput[]} [images] - Product image array
 */

/**
 * @typedef {Object} ProductUpdateInput
 * @property {string} [name]
 * @property {string} [slug]
 * @property {string} [shortDescription]
 * @property {string} [description]
 * @property {string} [sku]
 * @property {string} [brand]
 * @property {number|string} [price]
 * @property {number|string} [compareAtPrice]
 * @property {number|string} [costPrice]
 * @property {string} [categoryId]
 * @property {boolean} [isActive]
 * @property {boolean} [isFeatured]
 * @property {ProductImageInput[]} [images]
 */

/**
 * @typedef {Object} ProductQueryFilters
 * @property {string} [category] - Category slug
 * @property {string} [brand] - Brand name
 * @property {number|string} [minPrice] - Minimum price limit
 * @property {number|string} [maxPrice] - Maximum price limit
 * @property {boolean} [featured] - Filter featured products
 * @property {boolean} [active] - Filter active products
 * @property {string} [search] - Keyword search on name, SKU, brand
 * @property {number} [page] - Pagination page index
 * @property {number} [limit] - Pagination item count limit
 * @property {string} [sortBy] - Sorting rule
 */
export {};
