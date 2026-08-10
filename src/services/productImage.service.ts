import { productImageRepository } from '../repositories/productImage.repository';
import { productService } from './product.service';
import { ProductImage } from '../types/productImage.types';
import {
  CreateProductImageInput,
  UpdateProductImageInput,
} from '../validators/productImage.validator';
import { NotFoundError } from '../errors';

async function create(productId: string, input: CreateProductImageInput): Promise<ProductImage> {
  await productService.findById(productId);

  return productImageRepository.create({ productId, ...input });
}

async function findAllByProduct(productId: string): Promise<ProductImage[]> {
  await productService.findById(productId);
  return productImageRepository.findAllByProduct(productId);
}

async function findOwnedById(productId: string, id: string): Promise<ProductImage> {
  const image = await productImageRepository.findById(id);

  if (!image || image.productId !== productId) {
    throw new NotFoundError('Imagem não encontrada.');
  }

  return image;
}

async function update(
  productId: string,
  id: string,
  input: UpdateProductImageInput
): Promise<ProductImage> {
  await findOwnedById(productId, id);

  const updated = await productImageRepository.update(id, input);

  if (!updated) {
    throw new NotFoundError('Imagem não encontrada.');
  }

  return updated;
}

async function remove(productId: string, id: string): Promise<void> {
  await findOwnedById(productId, id);
  await productImageRepository.remove(id);
}

export const productImageService = {
  create,
  findAllByProduct,
  update,
  remove,
};
