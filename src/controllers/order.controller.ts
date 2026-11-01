import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { orderService } from '../services/order.service';
import { CreateOrderInput, ListOrdersQuery, OrderIdParam } from '../validators/order.validator';

function getUserId(req: Request): string {
  return req.user!.sub;
}

const create = asyncHandler(
  async (req: Request<Record<string, string>, unknown, CreateOrderInput>, res: Response) => {
    const order = await orderService.create(getUserId(req), req.body);
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
