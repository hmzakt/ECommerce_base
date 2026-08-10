import { dashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../../../common/utils/response.js';

export const dashboardController = {
  /**
   * GET /admin/dashboard
   */
  getDashboardSummary: async (req, res) => {
    const data = await dashboardService.getDashboardSummary();
    sendSuccess(res, {
      message: 'Dashboard summary retrieved successfully',
      data,
    });
  },

  /**
   * GET /admin/dashboard/revenue
   */
  getRevenueTrend: async (req, res) => {
    const data = await dashboardService.getRevenueTrend();
    sendSuccess(res, {
      message: 'Revenue trend retrieved successfully',
      data,
    });
  },

  /**
   * GET /admin/dashboard/orders
   */
  getOrderStatusBreakdown: async (req, res) => {
    const data = await dashboardService.getOrderStatusBreakdown();
    sendSuccess(res, {
      message: 'Order status breakdown retrieved successfully',
      data,
    });
  },
};
