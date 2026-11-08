import { z } from 'zod';

export const adminUserIdParamSchema = z.object({ id: z.uuid('id deve ser um UUID válido.') }).strict();

export const adminListUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().max(255).optional(),
    role: z.enum(['customer', 'admin']).optional(),
    status: z.enum(['active', 'inactive', 'banned']).optional(),
    accountType: z.enum(['personal', 'business']).optional(),
    sort: z.enum(['createdAt', 'name', 'email', 'status']).default('createdAt'),
  })
  .strict();

export const updateUserStatusSchema = z
  .object({ status: z.enum(['active', 'inactive', 'banned']) })
  .strict();

export const updateUserRoleSchema = z
  .object({ role: z.enum(['customer', 'admin']) })
  .strict();

export type AdminUserIdParam = z.infer<typeof adminUserIdParamSchema>;
export type AdminListUsersQuery = z.infer<typeof adminListUsersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
