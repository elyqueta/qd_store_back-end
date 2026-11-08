import { Request, Response } from 'express';
import { ValidationError } from '../errors';
import { normalizeIdempotencyKey } from '../repositories/idempotency.repository';
import { asyncHandler } from '../middlewares/asyncHandler';
import { orderService } from '../services/order.service';
import { CreateOrderInput, ListOrdersQuery, OrderIdParam } from '../validators/order.validator';

function getUserId(req: Request): string {
  return req.user!.sub;
}

function getIdempotencyKey(req: Request): string | undefined {
  const value = normalizeIdempotencyKey(req.header('Idempotency-Key'));
  if (value && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new ValidationError('Idempotency-Key deve ser um UUID válido.');
  }

  return value;
}

const create = asyncHandler(
  async (req: Request<Record<string, string>, unknown, CreateOrderInput>, res: Response) => {
    const order = await orderService.create(getUserId(req), req.body, getIdempotencyKey(req));
    res.status(201).json({ status: 'success', data: order });
  }
);

const findAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query as unknown as ListOrdersQuery;
  const result = await orderService.findAllByUser(getUserId(req), { status }, { page, limit });
  res.status(200).json({
    status: 'success',
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

const findById = asyncHandler(async (req: Request<OrderIdParam>, res: Response) => {
  const order = await orderService.findOwnedById(getUserId(req), req.params.id);
  res.status(200).json({ status: 'success', data: order });
});

const cancel = asyncHandler(async (req: Request<OrderIdParam>, res: Response) => {
  const order = await orderService.cancel(getUserId(req), req.params.id);
  res.status(200).json({ status: 'success', data: order });
});

export const orderController = { create, findAll, findById, cancel };
