import { companyRepository } from '../repositories/company.repository';
import { CompanyWithUsers } from '../types/company.types';
import { OrderFilters, OrderListResult, Order } from '../types/order.types';
import { PaginationParams } from '../types/pagination.types';
import { UpdateOrderStatusInput } from '../validators/order.validator';
import { orderService } from './order.service';
import { paymentService } from './payment.service';
import { AdminConfirmPaymentInput, AdminRejectPaymentInput } from '../validators/payment.validator';
import { Payment } from '../types/payment.types';

/**
 * Camada fina de propósito: hoje só delega ao repository, mas fica
 * pronta para crescer (ex.: paginação, filtros por status) sem
 * precisar de mudar o controller — mesmo princípio já aplicado em
 * category.service.ts.
 */
async function listCompaniesWithUsers(): Promise<CompanyWithUsers[]> {
  return companyRepository.findAllWithUsers();
}

async function listOrders(
  filters: OrderFilters,
  pagination: PaginationParams
): Promise<OrderListResult> {
  return orderService.adminFindAll(filters, pagination);
}

async function findOrderById(id: string): Promise<Order> {
  return orderService.adminFindById(id);
}

async function updateOrderStatus(
  adminId: string,
  id: string,
  input: UpdateOrderStatusInput
): Promise<Order> {
  return orderService.adminUpdateStatus(adminId, id, input);
}

async function listOrderPayments(orderId: string): Promise<Payment[]> {
  return paymentService.adminFindAllByOrder(orderId);
}

async function confirmPayment(
  adminId: string,
  paymentId: string,
  input: AdminConfirmPaymentInput
): Promise<Payment> {
  return paymentService.adminConfirm(adminId, paymentId, input);
}

async function rejectPayment(
  adminId: string,
  paymentId: string,
  input: AdminRejectPaymentInput
): Promise<Payment> {
  return paymentService.adminReject(adminId, paymentId, input);
}

export const adminService = {
  listCompaniesWithUsers,
  listOrders,
  findOrderById,
  updateOrderStatus,
  listOrderPayments,
  confirmPayment,
  rejectPayment,
};
