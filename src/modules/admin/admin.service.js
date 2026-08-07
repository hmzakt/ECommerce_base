import { userRepository } from '../users/user.repository.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/errorCodes.js';
import { Roles } from '../../common/constants/index.js';
import { logger } from '../../common/logger/index.js';

export const adminService = {
  /**
   * Get a paginated list of users
   *
   * @param {number} page
   * @param {number} limit
   * @param {string} [search]
   * @returns {Promise<{ users: Array, total: number }>}
   */
  getUsers: async (page, limit, search) => {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      userRepository.findMany({ skip, take: limit, search }),
      userRepository.count({ search }),
    ]);

    // Omit sensitive data before returning
    const safeUsers = users.map((user) => {
      const { passwordHash, refreshTokenHash, ...safeUser } = user;
      return safeUser;
    });

    return { users: safeUsers, total };
  },

  /**
   * Get a single user by ID
   *
   * @param {string} id
   */
  getUserById: async (id) => {
    const user = await userRepository.findById(id);

    if (!user) {
      throw AppError.notFound('User not found', ErrorCodes.USER_NOT_FOUND);
    }

    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    return safeUser;
  },

  /**
   * Update a user's role
   *
   * @param {string} targetUserId - The user being updated
   * @param {string} newRole - The role to assign
   * @param {string} requestingUserRole - Role of the admin making the request
   */
  updateUserRole: async (targetUserId, newRole, requestingUserRole) => {
    // Only a SUPER_ADMIN can change roles
    if (requestingUserRole !== Roles.SUPER_ADMIN) {
      throw AppError.forbidden(
        'Only a Super Admin can change user roles.',
        ErrorCodes.INSUFFICIENT_PERMISSIONS,
      );
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw AppError.notFound('Target user not found', ErrorCodes.USER_NOT_FOUND);
    }

    // Prevent changing your own role to avoid locking out the last super admin
    // In a real app, you might just check if there is >1 super admin before allowing this.
    // We will just allow it, but we log it.

    const updatedUser = await userRepository.update(targetUserId, { role: newRole });

    logger.info(
      { targetUserId, oldRole: targetUser.role, newRole },
      'User role updated by Super Admin',
    );

    const { passwordHash, refreshTokenHash, ...safeUser } = updatedUser;
    return safeUser;
  },

  /**
   * Update a user's active status (deactivate/activate)
   *
   * @param {string} targetUserId
   * @param {boolean} isActive
   */
  updateUserStatus: async (targetUserId, isActive) => {
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw AppError.notFound('Target user not found', ErrorCodes.USER_NOT_FOUND);
    }

    const updatedUser = await userRepository.update(targetUserId, { isActive });

    // If deactivating, we should immediately clear their refresh token
    // to invalidate any active sessions they currently hold.
    if (!isActive) {
      await userRepository.clearRefreshToken(targetUserId);
    }

    logger.info(
      { targetUserId, isActive },
      `User account ${isActive ? 'activated' : 'deactivated'}`,
    );

    const { passwordHash, refreshTokenHash, ...safeUser } = updatedUser;
    return safeUser;
  },
};
