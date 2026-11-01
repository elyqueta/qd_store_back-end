import { NotFoundError } from '../errors';
import { paymentMethodRepository } from '../repositories/paymentMethod.repository';
import { PaymentMethod } from '../types/paymentMethod.types';
import {
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
} from '../validators/paymentMethod.validator';

async function create(input: CreatePaymentMethodInput): Promise<PaymentMethod> {
  return paymentMethodRepository.create({
    name: input.name,
    type: input.type,
  });
}

async function findAll(): Promise<PaymentMethod[]> {
  const paymentMethods = await paymentMethodRepository.findAll();
  return paymentMethods.filter((paymentMethod) => paymentMethod.isActive);
}

async function findById(id: string): Promise<PaymentMethod> {
  const paymentMethod = await paymentMethodRepository.findById(id);

  if (!paymentMethod || !paymentMethod.isActive) {
    throw new NotFoundError(`Método de pagamento com id "${id}" não encontrado.`);
  }

  return paymentMethod;
}

async function update(id: string, input: UpdatePaymentMethodInput): Promise<PaymentMethod> {
  const updated = await paymentMethodRepository.update(id, input);

  if (!updated) {
    throw new NotFoundError(`Método de pagamento com id "${id}" não encontrado.`);
  }

  return updated;
}

async function deactivate(id: string): Promise<void> {
  const deactivated = await paymentMethodRepository.deactivate(id);

  if (!deactivated) {
    throw new NotFoundError(
      `Método de pagamento com id "${id}" não encontrado ou já está inactivo.`
    );
  }
}

export const paymentMethodService = {
  create,
  findAll,
  findById,
  update,
  deactivate,
};
