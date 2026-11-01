import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { paymentMethodService } from '../services/paymentMethod.service';
import {
  CreatePaymentMethodInput,
  PaymentMethodIdParam,
  UpdatePaymentMethodInput,
} from '../validators/paymentMethod.validator';

const create = asyncHandler(
  async (
    req: Request<Record<string, string>, unknown, CreatePaymentMethodInput>,
    res: Response
  ) => {
    const paymentMethod = await paymentMethodService.create(req.body);

    res.status(201).json({ status: 'success', data: paymentMethod });
  }
);

const findAll = asyncHandler(async (_req: Request, res: Response) => {
  const paymentMethods = await paymentMethodService.findAll();

  res.status(200).json({
    status: 'success',
    data: paymentMethods,
    count: paymentMethods.length,
  });
});

const findById = asyncHandler(async (req: Request<PaymentMethodIdParam>, res: Response) => {
  const paymentMethod = await paymentMethodService.findById(req.params.id);

  res.status(200).json({ status: 'success', data: paymentMethod });
});

const update = asyncHandler(
  async (req: Request<PaymentMethodIdParam, unknown, UpdatePaymentMethodInput>, res: Response) => {
    const paymentMethod = await paymentMethodService.update(req.params.id, req.body);

    res.status(200).json({ status: 'success', data: paymentMethod });
  }
);

const remove = asyncHandler(async (req: Request<PaymentMethodIdParam>, res: Response) => {
  await paymentMethodService.deactivate(req.params.id);
  res.status(204).send();
});

export const paymentMethodController = {
  create,
  findAll,
  findById,
  update,
  remove,
};
