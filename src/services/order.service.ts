import { ConflictError, ForbiddenError, NotFoundError } from '../errors';
import { orderRepository } from '../repositories/order.repository';
import { Order, OrderFilters, OrderListResult } from '../types/order.types';
import { PaginationParams } from '../types/pagination.types';
import { CreateOrderInput, UpdateOrderStatusInput } from '../validators/order.validator';
import { addressService } from './address.service';
import { companyService } from './company.service';
import { deliveryTypeService } from './deliveryType.service';
import { paymentMethodService } from './paymentMethod.service';
import { userCompanyRepository } from '../repositories/userCompany.repository';
import { notificationService } from './notification.service';

async function create(userId: string, input: CreateOrderInput): Promise<Order> {
  const [address, deliveryType, paymentMethod] = await Promise.all([
    addressService.findOwnedById(userId, input.addressId),
    deliveryTypeService.findById(input.deliveryTypeId),
    paymentMethodService.findById(input.paymentMethodId),
  ]);
  let companyId: string | null = null;
  let type: 'personal' | 'business' = 'personal';

  if (input.companyId !== undefined) {
    const company = await companyService.findById(input.companyId);
    if (company.status !== 'active') {
      throw new ConflictError('Esta empresa não está disponível para encomendas.');
    }
    if (!(await userCompanyRepository.isMember(company.id, userId))) {
      throw new ForbiddenError('Não pertence a esta empresa.');
    }
    companyId = company.id;
    type = 'business';
  }

  const orderId = await orderRepository.createFromCart({
    userId,
    companyId,
    type,
    paymentMethodId: paymentMethod.id,
    deliveryTypeId: deliveryType.id,
    deliveryPrice: deliveryType.price,
    notes: input.notes ?? null,
    addressId: address.id,
    address: {
      province: address.province,
      municipality: address.municipality,
      neighborhood: address.neighborhood,
      address: address.address,
      reference: address.reference,
      latitude: address.latitude,
      longitude: address.longitude,
    },
  });
  const order = await orderRepository.findOwnedById(orderId);
  if (!order) {
    throw new Error('A encomenda criada não foi encontrada.');
  }
  try {
    await notificationService.notify(
      userId,
      'order',
      `A sua encomenda ${order.reference} foi registada.`
    );
  } catch (error) {
    console.error('Não foi possível criar a notificação da encomenda:', error);
  }
  return order;
}

async function findAllByUser(
  userId: string,
  filters: Pick<OrderFilters, 'status'>,
  pagination: PaginationParams
): Promise<OrderListResult> {
  return orderRepository.findAllByUser(userId, filters, pagination);
}

async function findOwnedById(userId: string, id: string): Promise<Order> {
  const order = await orderRepository.findOwnedById(id);
  if (!order || order.userId !== userId) {
    throw new NotFoundError('Encomenda não encontrada.');
  }
  return order;
}

async function cancel(userId: string, id: string): Promise<Order> {
  const result = await orderRepository.cancel(userId, id);
  if (result === 'not_found') {
    throw new NotFoundError('Encomenda não encontrada.');
  }
  if (result === 'conflict') {
    throw new ConflictError('Só é possível cancelar encomendas em processamento.');
  }
  if (result === 'payment_confirmed') {
    throw new ConflictError('Encomenda já paga. Contacte o suporte para reembolso.');
  }
  return findOwnedById(userId, id);
}

async function adminFindAll(
  filters: OrderFilters,
  pagination: PaginationParams
): Promise<OrderListResult> {
  return orderRepository.adminFindAll(filters, pagination);
}

async function adminFindById(id: string): Promise<Order> {
  const order = await orderRepository.adminFindById(id);
  if (!order) {
    throw new NotFoundError('Encomenda não encontrada.');
  }
  return order;
}

async function adminUpdateStatus(
  adminId: string,
  id: string,
  input: UpdateOrderStatusInput
): Promise<Order> {
  const result = await orderRepository.adminUpdateStatus(
    adminId,
    id,
    input.status,
    input.note ?? null
  );
  if (result.outcome === 'not_found') {
    throw new NotFoundError('Encomenda não encontrada.');
  }
  if (result.outcome === 'conflict') {
    throw new ConflictError(
      `Transição de estado inválida: ${result.previousStatus} -> ${input.status}.`
    );
  }
  const order = await adminFindById(id);
  const statusLabels: Record<Order['status'], string> = {
    processing: 'em processamento',
    in_transit: 'em trânsito',
    delivered: 'entregue',
    cancelled: 'cancelada',
  };
  try {
    await notificationService.notify(
      order.userId,
      'order',
      `A sua encomenda ${order.reference} está agora: ${statusLabels[order.status]}.`
    );
  } catch (error) {
    console.error('Não foi possível criar a notificação de alteração da encomenda:', error);
  }
  return order;
}

export const orderService = {
  create,
  findAllByUser,
  findOwnedById,
  cancel,
  adminFindAll,
  adminFindById,
  adminUpdateStatus,
};
