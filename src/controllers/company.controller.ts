import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { companyService } from '../services/company.service';
import {
  CompanyIdParam,
  CreateCompanyInput,
  UpdateCompanyInput,
} from '../validators/company.validator';

const create = asyncHandler(
  async (req: Request<Record<string, string>, unknown, CreateCompanyInput>, res: Response) => {
    const company = await companyService.create(req.body);

    res.status(201).json({
      status: 'success',
      data: company,
    });
  }
);

const findAll = asyncHandler(async (_req: Request, res: Response) => {
  const companies = await companyService.findAll();

  res.status(200).json({
    status: 'success',
    data: companies,
    count: companies.length,
  });
});

const findById = asyncHandler(async (req: Request<CompanyIdParam>, res: Response) => {
  const company = await companyService.findById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: company,
  });
});

const update = asyncHandler(
  async (req: Request<CompanyIdParam, unknown, UpdateCompanyInput>, res: Response) => {
    const company = await companyService.update(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      data: company,
    });
  }
);

/**
 * DELETE aqui é semanticamente um soft delete (ver
 * company.service.ts -> deactivate). Mantemos o verbo HTTP DELETE e
 * o status 204 porque, do ponto de vista do CLIENTE da API, o efeito
 * observável é o mesmo de uma remoção: a empresa deixa de estar
 * disponível para novas operações. O "como" (soft vs hard delete) é
 * um detalhe de implementação que não precisa vazar para o contrato
 * HTTP.
 */
const remove = asyncHandler(async (req: Request<CompanyIdParam>, res: Response) => {
  await companyService.deactivate(req.params.id);

  res.status(204).send();
});

export const companyController = {
  create,
  findAll,
  findById,
  update,
  remove,
};
