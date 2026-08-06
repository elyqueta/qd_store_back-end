import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { userCompanyService } from '../services/userCompany.service';
import {
  CompanyIdParamOnly,
  CreateUserCompanyInput,
  UpdateUserCompanyInput,
  UserCompanyParam,
} from '../validators/userCompany.validator';

const associate = asyncHandler(
  async (req: Request<CompanyIdParamOnly, unknown, CreateUserCompanyInput>, res: Response) => {
    const association = await userCompanyService.associate(req.params.companyId, req.body);

    res.status(201).json({
      status: 'success',
      data: association,
    });
  }
);

const findAll = asyncHandler(async (req: Request<CompanyIdParamOnly>, res: Response) => {
  const associations = await userCompanyService.listByCompany(req.params.companyId);

  res.status(200).json({
    status: 'success',
    data: associations,
    count: associations.length,
  });
});

const update = asyncHandler(
  async (req: Request<UserCompanyParam, unknown, UpdateUserCompanyInput>, res: Response) => {
    const association = await userCompanyService.updateRole(
      req.params.companyId,
      req.params.userId,
      req.body
    );

    res.status(200).json({
      status: 'success',
      data: association,
    });
  }
);

const remove = asyncHandler(async (req: Request<UserCompanyParam>, res: Response) => {
  await userCompanyService.remove(req.params.companyId, req.params.userId);

  res.status(204).send();
});

export const userCompanyController = {
  associate,
  findAll,
  update,
  remove,
};
