import { productSpecificationRepository } from '../repositories/productSpecification.repository';
import { productService } from './product.service';
import { ProductSpecification } from '../types/productSpecification.types';
import {
  CreateProductSpecificationInput,
  UpdateProductSpecificationInput,
} from '../validators/productSpecification.validator';
import { NotFoundError } from '../errors';

async function create(
  productId: string,
  input: CreateProductSpecificationInput
): Promise<ProductSpecification> {
  await productService.findById(productId);

  return productSpecificationRepository.create({ productId, ...input });
}

async function findAllByProduct(productId: string): Promise<ProductSpecification[]> {
  await productService.findById(productId);
  return productSpecificationRepository.findAllByProduct(productId);
}

async function findOwnedById(productId: string, id: string): Promise<ProductSpecification> {
  const spec = await productSpecificationRepository.findById(id);

  if (!spec || spec.productId !== productId) {
    throw new NotFoundError('Especificação não encontrada.');
  }

  return spec;
}

async function update(
  productId: string,
  id: string,
  input: UpdateProductSpecificationInput
): Promise<ProductSpecification> {
  await findOwnedById(productId, id);

  const updated = await productSpecificationRepository.update(id, input);

  if (!updated) {
    throw new NotFoundError('Especificação não encontrada.');
  }

  return updated;
}

async function remove(productId: string, id: string): Promise<void> {
  await findOwnedById(productId, id);
  await productSpecificationRepository.remove(id);
}

export const productSpecificationService = {
  create,
  findAllByProduct,
  update,
  remove,
};
