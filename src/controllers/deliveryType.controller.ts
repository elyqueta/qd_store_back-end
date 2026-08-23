import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { deliveryTypeService } from '../services/deliveryType.service';
import {
  CreateDeliveryTypeInput,
  DeliveryTypeIdParam,
  UpdateDeliveryTypeInput,
} from '../validators/deliveryType.validator';

const create = asyncHandler(
  async (req: Request<Record<string, string>, unknown, CreateDeliveryTypeInput>, res: Response) => {
    const deliveryType = await deliveryTypeService.create(req.body);

    res.status(201).json({ status: 'success', data: deliveryType });
  }
);

const findAll = asyncHandler(async (_req: Request, res: Response) => {
  const deliveryTypes = await deliveryTypeService.findAll();

  res.status(200).json({
    status: 'success',
    data: deliveryTypes,
    count: deliveryTypes.length,
  });
});

const findById = asyncHandler(async (req: Request<DeliveryTypeIdParam>, res: Response) => {
  const deliveryType = await deliveryTypeService.findById(req.params.id);

  res.status(200).json({ status: 'success', data: deliveryType });
});

const update = asyncHandler(
  async (req: Request<DeliveryTypeIdParam, unknown, UpdateDeliveryTypeInput>, res: Response) => {
    const deliveryType = await deliveryTypeService.update(req.params.id, req.body);

    res.status(200).json({ status: 'success', data: deliveryType });
  }
);

const remove = asyncHandler(async (req: Request<DeliveryTypeIdParam>, res: Response) => {
  await deliveryTypeService.deactivate(req.params.id);
  res.status(204).send();
});

export const deliveryTypeController = {
  create,
  findAll,
  findById,
  update,
  remove,
};
