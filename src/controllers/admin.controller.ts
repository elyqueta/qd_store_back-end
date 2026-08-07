import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { adminService } from '../services/admin.service';

const listCompanies = asyncHandler(async (_req: Request, res: Response) => {
  const companies = await adminService.listCompaniesWithUsers();

  res.status(200).json({
    status: 'success',
    data: companies,
    count: companies.length,
  });
});

export const adminController = {
  listCompanies,
};