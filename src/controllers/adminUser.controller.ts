import type { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { adminUserService } from '../services/adminUser.service';
import type {
  AdminListUsersQuery,
  AdminUserIdParam,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
} from '../validators/adminUser.validator';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminUserService.list(req.query as unknown as AdminListUsersQuery);
  res.status(200).json({
    status: 'success',
    data: result.data,
    pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  });
});

const findById = asyncHandler(async (req: Request<AdminUserIdParam>, res: Response) => {
  const user = await adminUserService.findById(req.params.id);
  res.status(200).json({ status: 'success', data: user });
});

const updateStatus = asyncHandler(
  async (req: Request<AdminUserIdParam, unknown, UpdateUserStatusInput>, res: Response) => {
    const user = await adminUserService.updateStatus(req.user!.sub, req.params.id, req.body);
    res.status(200).json({ status: 'success', data: user });
  }
);

const updateRole = asyncHandler(
  async (req: Request<AdminUserIdParam, unknown, UpdateUserRoleInput>, res: Response) => {
    const user = await adminUserService.updateRole(req.user!.sub, req.params.id, req.body);
    res.status(200).json({ status: 'success', data: user });
  }
);

export const adminUserController = { list, findById, updateStatus, updateRole };
