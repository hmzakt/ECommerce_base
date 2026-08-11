/**
 * @interface ICategoryRepository
 * @description Repository interface defining raw database query operations for Categories.
 */

/**
 * @function ICategoryRepository#findById
 * @param {string} id
 * @returns {Promise<import('../types/category.types.js').CategoryResponse|null>}
 */

/**
 * @function ICategoryRepository#findBySlug
 * @param {string} slug
 * @returns {Promise<import('../types/category.types.js').CategoryResponse|null>}
 */

/**
 * @function ICategoryRepository#findByName
 * @param {string} name
 * @returns {Promise<import('../types/category.types.js').CategoryResponse|null>}
 */

/**
 * @function ICategoryRepository#findAll
 * @returns {Promise<import('../types/category.types.js').CategoryResponse[]>}
 */

/**
 * @function ICategoryRepository#create
 * @param {import('../types/category.types.js').CategoryCreateInput} data
 * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
 */

/**
 * @function ICategoryRepository#update
 * @param {string} id
 * @param {import('../types/category.types.js').CategoryUpdateInput} data
 * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
 */

/**
 * @function ICategoryRepository#delete
 * @param {string} id
 * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
 */


/**
 * @interface ICategoryService
 * @description Service interface defining business logic orchestrations for Categories.
 */

/**
 * @function ICategoryService#createCategory
 * @param {import('../types/category.types.js').CategoryCreateInput} data
 * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
 */

/**
 * @function ICategoryService#getCategories
 * @returns {Promise<import('../types/category.types.js').CategoryResponse[]>}
 */

/**
 * @function ICategoryService#getCategoryBySlug
 * @param {string} slug
 * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
 */

/**
 * @function ICategoryService#updateCategory
 * @param {string} id
 * @param {import('../types/category.types.js').CategoryUpdateInput} data
 * @returns {Promise<import('../types/category.types.js').CategoryResponse>}
 */

/**
 * @function ICategoryService#deleteCategory
 * @param {string} id
 * @returns {Promise<void>}
 */

export {};
