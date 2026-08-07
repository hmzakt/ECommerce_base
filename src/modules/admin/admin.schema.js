import { z } from 'zod';
import { Roles, Pagination } from '../../common/constants/index.js';

export const listUsersSchema = z.object({
  query: z.object({
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
    search: z.string().trim().optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    role: z.enum([Roles.CUSTOMER, Roles.ADMIN, Roles.SUPER_ADMIN], {
      required_error: 'Role is required',
      invalid_type_error: 'Invalid role',
    }),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    isActive: z.boolean({
      required_error: 'isActive status is required',
      invalid_type_error: 'isActive must be a boolean',
    }),
  }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});
