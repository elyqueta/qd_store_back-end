import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { paymentService } from '../services/payment.service';
import {
  AdminConfirmPaymentInput,
  AdminRejectPaymentInput,
  CreatePaymentInput,
  OrderPaymentIdParam,
  PaymentIdParam,
} from '../validators/payment.validator';

const pay = asyncHandler(
  async (req: Request<OrderPaymentIdParam, unknown, CreatePaymentInput>, res: Response) => {
    const payment = await paymentService.pay(req.user!.sub, req.params.orderId, req.body);
    res.status(201).json({ status: 'success', data: payment });
  }
);

const findAllByOrder = asyncHandler(async (req: Request<OrderPaymentIdParam>, res: Response) => {
  const payments = await paymentService.findAllByOrder(req.user!.sub, req.params.orderId);
  res.status(200).json({ status: 'success', data: payments, count: payments.length });
});

const adminFindAllByOrder = asyncHandler(
  async (req: Request<OrderPaymentIdParam>, res: Response) => {
    const payments = await paymentService.adminFindAllByOrder(req.params.orderId);
    res.status(200).json({ status: 'success', data: payments, count: payments.length });
  }
);

const adminConfirm = asyncHandler(
  async (req: Request<PaymentIdParam, unknown, AdminConfirmPaymentInput>, res: Response) => {
    const payment = await paymentService.adminConfirm(
      req.user!.sub,
      req.params.paymentId,
      req.body
    );
    res.status(200).json({ status: 'success', data: payment });
  }
);

const adminReject = asyncHandler(
  async (req: Request<PaymentIdParam, unknown, AdminRejectPaymentInput>, res: Response) => {
    const payment = await paymentService.adminReject(req.user!.sub, req.params.paymentId, req.body);
    res.status(200).json({ status: 'success', data: payment });
  }
);

export const paymentController = {
  pay,
  findAllByOrder,
  adminFindAllByOrder,
  adminConfirm,
  adminReject,
};
