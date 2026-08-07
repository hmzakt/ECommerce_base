/**
 * @typedef {Object} CategoryCreateInput
 * @property {string} name - The category name
 * @property {string} [slug] - Optional pre-defined slug
 * @property {string} [description] - Optional category description
 * @property {string} [image] - Optional category image URL
 * @property {boolean} [isActive] - Optional category active status
 */

/**
 * @typedef {Object} CategoryUpdateInput
 * @property {string} [name] - The category name
 * @property {string} [slug] - Optional pre-defined slug
 * @property {string} [description] - Optional category description
 * @property {string} [image] - Optional category image URL
 * @property {boolean} [isActive] - Optional category active status
 */

/**
 * @typedef {Object} CategoryResponse
 * @property {string} id - UUID
 * @property {string} name
 * @property {string} slug
 * @property {string|null} description
 * @property {string|null} image
 * @property {boolean} isActive
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */
export {};
