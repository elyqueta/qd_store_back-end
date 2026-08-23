import { NotFoundError } from '../errors';
import { deliveryTypeRepository } from '../repositories/deliveryType.repository';
import { DeliveryType } from '../types/deliveryType.types';
import {
  CreateDeliveryTypeInput,
  UpdateDeliveryTypeInput,
} from '../validators/deliveryType.validator';

async function create(input: CreateDeliveryTypeInput): Promise<DeliveryType> {
  return deliveryTypeRepository.create({
    name: input.name,
    description: input.description ?? null,
    price: input.price,
    type: input.type,
  });
}

async function findAll(): Promise<DeliveryType[]> {
  const deliveryTypes = await deliveryTypeRepository.findAll();
  return deliveryTypes.filter((deliveryType) => deliveryType.isActive);
}

async function findById(id: string): Promise<DeliveryType> {
  const deliveryType = await deliveryTypeRepository.findById(id);

  if (!deliveryType || !deliveryType.isActive) {
    throw new NotFoundError(`Tipo de entrega com id "${id}" não encontrado.`);
  }

  return deliveryType;
}

async function update(id: string, input: UpdateDeliveryTypeInput): Promise<DeliveryType> {
  const updated = await deliveryTypeRepository.update(id, input);

  if (!updated) {
    throw new NotFoundError(`Tipo de entrega com id "${id}" não encontrado.`);
  }

  return updated;
}

async function deactivate(id: string): Promise<void> {
  const deactivated = await deliveryTypeRepository.deactivate(id);

  if (!deactivated) {
    throw new NotFoundError(`Tipo de entrega com id "${id}" não encontrado ou já está inactivo.`);
  }
}

export const deliveryTypeService = {
  create,
  findAll,
  findById,
  update,
  deactivate,
};
