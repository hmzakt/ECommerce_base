/**
 * @interface IProductRepository
 * @description Repository interface defining raw database query operations for Products.
 */

/**
 * @function IProductRepository#findById
 * @param {string} id
 * @returns {Promise<object|null>}
 */

/**
 * @function IProductRepository#findBySlug
 * @param {string} slug
 * @returns {Promise<object|null>}
 */

/**
 * @function IProductRepository#findBySku
 * @param {string} sku
 * @returns {Promise<object|null>}
 */

/**
 * @function IProductRepository#create
 * @param {import('../types/product.types.js').ProductCreateInput} data
 * @returns {Promise<object>}
 */

/**
 * @function IProductRepository#update
 * @param {string} id
 * @param {import('../types/product.types.js').ProductUpdateInput} data
 * @returns {Promise<object>}
 */

/**
 * @function IProductRepository#delete
 * @param {string} id
 * @returns {Promise<object>}
 */

/**
 * @function IProductRepository#findManyAndCount
 * @param {import('../types/product.types.js').ProductQueryFilters} filters
 * @returns {Promise<{ products: object[], total: number }>}
 */


/**
 * @interface IProductService
 * @description Service interface defining business logic orchestrations for Products.
 */

/**
 * @function IProductService#createProduct
 * @param {import('../types/product.types.js').ProductCreateInput} data
 * @returns {Promise<object>}
 */

/**
 * @function IProductService#updateProduct
 * @param {string} id
 * @param {import('../types/product.types.js').ProductUpdateInput} data
 * @returns {Promise<object>}
 */

/**
 * @function IProductService#deleteProduct
 * @param {string} id
 * @returns {Promise<void>}
 */

/**
 * @function IProductService#getProductById
 * @param {string} id
 * @returns {Promise<object>}
 */

/**
 * @function IProductService#getProductBySlug
 * @param {string} slug
 * @returns {Promise<object>}
 */

/**
 * @function IProductService#getProducts
 * @param {import('../types/product.types.js').ProductQueryFilters} filters
 * @returns {Promise<{ products: object[], total: number }>}
 */

export {};
