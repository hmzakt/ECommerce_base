import { adminService } from './admin.service.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/response.js';

export const adminController = {
  /**
   * List users with pagination and search
   */
  getUsers: async (req, res) => {
    const { page, limit, search } = req.query;

    const { users, total } = await adminService.getUsers(page, limit, search);

    sendSuccess(res, {
      message: 'Users fetched successfully',
      data: { users },
      meta: buildPaginationMeta({ total, page, limit }),
    });
  },

  /**
   * Get single user details
   */
  getUserById: async (req, res) => {
    const { id } = req.params;
    const user = await adminService.getUserById(id);

    sendSuccess(res, {
      message: 'User fetched successfully',
      data: { user },
    });
  },

  /**
   * Update a user's role
   */
  updateUserRole: async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const requestingUserRole = req.user.role; // Attached by authenticate middleware

    const user = await adminService.updateUserRole(id, role, requestingUserRole);

    sendSuccess(res, {
      message: 'User role updated successfully',
      data: { user },
    });
  },

  /**
   * Toggle user active status
   */
  updateUserStatus: async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await adminService.updateUserStatus(id, isActive);

    sendSuccess(res, {
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user },
    });
  },
};
