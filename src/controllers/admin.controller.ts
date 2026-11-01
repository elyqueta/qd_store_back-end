import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { adminService } from '../services/admin.service';
import {
  AdminListOrdersQuery,
  OrderIdParam,
  UpdateOrderStatusInput,
} from '../validators/order.validator';
import {
  PaymentIdParam,
  OrderPaymentIdParam,
  AdminConfirmPaymentInput,
  AdminRejectPaymentInput,
} from '../validators/payment.validator';

const listCompanies = asyncHandler(async (_req: Request, res: Response) => {
  const companies = await adminService.listCompaniesWithUsers();

  res.status(200).json({
    status: 'success',
    data: companies,
    count: companies.length,
  });
});

const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status, userId } = req.query as unknown as AdminListOrdersQuery;
  const result = await adminService.listOrders({ status, userId }, { page, limit });
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

const findOrderById = asyncHandler(async (req: Request<OrderIdParam>, res: Response) => {
  const order = await adminService.findOrderById(req.params.id);
  res.status(200).json({ status: 'success', data: order });
});

const updateOrderStatus = asyncHandler(
  async (req: Request<OrderIdParam, unknown, UpdateOrderStatusInput>, res: Response) => {
    const order = await adminService.updateOrderStatus(req.user!.sub, req.params.id, req.body);
    res.status(200).json({ status: 'success', data: order });
  }
);

const listOrderPayments = asyncHandler(async (req: Request<OrderPaymentIdParam>, res: Response) => {
  const payments = await adminService.listOrderPayments(req.params.orderId);
  res.status(200).json({ status: 'success', data: payments, count: payments.length });
});

const confirmPayment = asyncHandler(
  async (req: Request<PaymentIdParam, unknown, AdminConfirmPaymentInput>, res: Response) => {
    const payment = await adminService.confirmPayment(
      req.user!.sub,
      req.params.paymentId,
      req.body
    );
    res.status(200).json({ status: 'success', data: payment });
  }
);

const rejectPayment = asyncHandler(
  async (req: Request<PaymentIdParam, unknown, AdminRejectPaymentInput>, res: Response) => {
    const payment = await adminService.rejectPayment(req.user!.sub, req.params.paymentId, req.body);
    res.status(200).json({ status: 'success', data: payment });
  }
);

export const adminController = {
  listCompanies,
  listOrders,
  findOrderById,
  updateOrderStatus,
  listOrderPayments,
  confirmPayment,
  rejectPayment,
};
