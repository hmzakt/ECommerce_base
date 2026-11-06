import { prisma } from '../../prisma/client.js';

/**
 * User Repository
 *
 * Isolates Prisma database calls from the business logic layer.
 * All functions here should return standard Prisma models or null.
 * No HTTP concepts (req, res, status codes) exist here.
 */

export const userRepository = {
  /**
   * Find a user by their email address.
   *
   * @param {string} email
   * @returns {Promise<import('@prisma/client').User | null>}
   */
  findByEmail: async (email) => {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Find a user by their ID.
   *
   * @param {string} id
   * @returns {Promise<import('@prisma/client').User | null>}
   */
  findById: async (id) => {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  /**
   * Find many users with pagination and optional search
   *
   * @param {object} options
   * @param {number} options.skip
   * @param {number} options.take
   * @param {string} [options.search]
   * @returns {Promise<import('@prisma/client').User[]>}
   */
  findMany: async ({ skip, take, search }) => {
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Count users (useful for pagination metadata)
   *
   * @param {object} options
   * @param {string} [options.search]
   * @returns {Promise<number>}
   */
  count: async ({ search }) => {
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return prisma.user.count({ where });
  },

  /**
   * Create a new user.
   *
   * @param {object} data
   * @returns {Promise<import('@prisma/client').User>}
   */
  create: async (data) => {
    return prisma.user.create({
      data,
    });
  },

  /**
   * Update an existing user
   *
   * @param {string} id
   * @param {object} data
   * @returns {Promise<import('@prisma/client').User>}
   */
  update: async (id, data) => {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  /**
   * Update the refresh token hash for a user.
   *
   * @param {string} id
   * @param {string} refreshTokenHash
   * @returns {Promise<void>}
   */
  updateRefreshToken: async (id, refreshTokenHash) => {
    await prisma.user.update({
      where: { id },
      data: { refreshTokenHash },
    });
  },

  /**
   * Clear the refresh token for a user.
   *
   * @param {string} id
   * @returns {Promise<void>}
   */
  clearRefreshToken: async (id) => {
    await prisma.user.update({
      where: { id },
      data: { refreshTokenHash: null },
    });
  },
  /**
   * Find a user by password reset token
   *
   * @param {string} token
   * @returns {Promise<import('@prisma/client').User | null>}
   */
  findByPasswordResetToken: async (token) => {
    return prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });
  },

  /**
   * Update a user's password and clear reset token
   *
   * @param {string} id
   * @param {string} newPasswordHash
   * @returns {Promise<void>}
   */
  updatePassword: async (id, newPasswordHash) => {
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  },

  /**
   * Mark email as verified
   *
   * @param {string} id
   * @returns {Promise<void>}
   */
  verifyEmail: async (id) => {
    await prisma.user.update({
      where: { id },
      data: { isEmailVerified: true },
    });
  },

  /**
   * Find a user by their Google OAuth ID.
   *
   * @param {string} googleId
   * @returns {Promise<import('@prisma/client').User | null>}
   */
  findByGoogleId: async (googleId) => {
    return prisma.user.findUnique({
      where: { googleId },
    });
  },
};
