import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { serviceService } from '../services/service.service';
import {
  CreateServiceInput,
  ServiceIdParam,
  UpdateServiceInput,
} from '../validators/service.validator';

const list = asyncHandler(async (req: Request, res: Response) => {
  const services = await serviceService.list(req.query);
  res.status(200).json({ status: 'success', data: services, count: services.length });
});
const listAdmin = asyncHandler(async (req: Request, res: Response) => {
  const services = await serviceService.listAdmin(req.query);
  res.status(200).json({ status: 'success', data: services, count: services.length });
});

const create = asyncHandler(
  async (req: Request<Record<string, string>, unknown, CreateServiceInput>, res: Response) => {
    const service = await serviceService.create(req.body, req.file);
    res.status(201).json({ status: 'success', data: service });
  }
);

const update = asyncHandler(
  async (req: Request<ServiceIdParam, unknown, UpdateServiceInput>, res: Response) => {
    const service = await serviceService.update(req.params.id, req.body, req.file);
    res.status(200).json({ status: 'success', data: service });
  }
);
const remove = asyncHandler(async (req: Request<ServiceIdParam>, res: Response) => {
  await serviceService.remove(req.params.id);
  res.status(204).send();
});

export const serviceController = { list, listAdmin, create, update, remove };
