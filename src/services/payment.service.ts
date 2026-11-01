import { env } from '../config/env';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors';
import { paymentRepository } from '../repositories/payment.repository';
import { Payment } from '../types/payment.types';
import {
  AdminConfirmPaymentInput,
  AdminRejectPaymentInput,
  CreatePaymentInput,
} from '../validators/payment.validator';
import { orderService } from './order.service';
import { getPaymentGateway } from './payment';
import { paymentMethodService } from './paymentMethod.service';
import { notificationService } from './notification.service';

async function pay(userId: string, orderId: string, input: CreatePaymentInput): Promise<Payment> {
  const order = await orderService.findOwnedById(userId, orderId);
  if (order.status !== 'processing') {
    throw new ConflictError('A encomenda não está em processamento.');
  }
  const paymentMethod = await paymentMethodService.findById(order.paymentMethodId);
  if (paymentMethod.type !== input.methodType) {
    throw new ConflictError('O método de pagamento não corresponde ao escolhido na encomenda.');
  }

  const previousPayments = await paymentRepository.findAllByOrder(orderId);
  if (
    previousPayments.some(
      (payment) => payment.status === 'pending' || payment.status === 'confirmed'
    )
  ) {
    throw new ConflictError('Já existe um pagamento pendente ou confirmado para esta encomenda.');
  }

  const gatewayResult = await getPaymentGateway().initiate({
    orderId: order.id,
    orderReference: order.reference,
    amount: order.total,
    methodType: input.methodType,
    ...(input.methodType === 'multicaixa_express' ? { customerPhone: input.customerPhone } : {}),
  });
  const paymentId = await paymentRepository.createPayment(
    order.id,
    paymentMethod.id,
    order.total,
    input.methodType,
    input.methodType === 'multicaixa_express' ? input.customerPhone : null,
    gatewayResult
  );
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) {
    throw new Error('O pagamento criado não foi encontrado.');
  }
  if (payment.status === 'confirmed') {
    try {
      await notificationService.notify(
        order.userId,
        'order',
        `O pagamento da encomenda ${order.reference} foi confirmado.`
      );
    } catch (error) {
      console.error('Não foi possível criar a notificação do pagamento:', error);
    }
  }
  return payment;
}

async function findAllByOrder(userId: string, orderId: string): Promise<Payment[]> {
  await orderService.findOwnedById(userId, orderId);
  return paymentRepository.findAllByOrder(orderId);
}

async function adminFindAllByOrder(orderId: string): Promise<Payment[]> {
  await orderService.adminFindById(orderId);
  return paymentRepository.findAllByOrder(orderId);
}

async function adminConfirm(
  adminId: string,
  paymentId: string,
  input: AdminConfirmPaymentInput
): Promise<Payment> {
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) {
    throw new NotFoundError('Pagamento não encontrado.');
  }
  if (payment.methodType === 'multicaixa_reference' && env.PAYMENT_GATEWAY !== 'mock') {
    throw new ForbiddenError('Esta confirmação é feita automaticamente pelo gateway.');
  }
  const result = await paymentRepository.confirm(adminId, paymentId, input.notes ?? null);
  if (result === 'not_found') {
    throw new NotFoundError('Pagamento não encontrado.');
  }
  if (result === 'conflict') {
    throw new ConflictError('Só é possível confirmar pagamentos pendentes não automáticos.');
  }
  const confirmed = await paymentRepository.findById(paymentId);
  if (!confirmed) {
    throw new Error('O pagamento confirmado não foi encontrado.');
  }
  const order = await orderService.adminFindById(confirmed.orderId);
  try {
    await notificationService.notify(
      order.userId,
      'order',
      `O pagamento da encomenda ${order.reference} foi confirmado.`
    );
  } catch (error) {
    console.error('Não foi possível criar a notificação do pagamento:', error);
  }
  return confirmed;
}

async function adminReject(
  adminId: string,
  paymentId: string,
  input: AdminRejectPaymentInput
): Promise<Payment> {
  const result = await paymentRepository.reject(adminId, paymentId, input.notes ?? null);
  if (result === 'not_found') {
    throw new NotFoundError('Pagamento não encontrado.');
  }
  if (result === 'conflict') {
    throw new ConflictError('Só é possível rejeitar pagamentos pendentes.');
  }
  const rejected = await paymentRepository.findById(paymentId);
  if (!rejected) {
    throw new Error('O pagamento rejeitado não foi encontrado.');
  }
  return rejected;
}

export const paymentService = {
  pay,
  findAllByOrder,
  adminFindAllByOrder,
  adminConfirm,
  adminReject,
};
