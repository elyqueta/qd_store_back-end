import { productRepository } from '../repositories/product.repository';
import { categoryService } from './category.service';
import { Product, ProductFilters } from '../types/product.types';
import { PaginatedResult, PaginationParams } from '../types/pagination.types';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';
import { NotFoundError } from '../errors';

/**
 * `await categoryService.findById(...)` aqui não serve para usar o
 * valor devolvido — serve para forçar um 404 CLARO ("categoria não
 * encontrada") ANTES de sequer tentar o INSERT. Mesmo raciocínio já
 * documentado em userCompany.service.ts para companyService.findById.
 */
async function create(input: CreateProductInput): Promise<Product> {
  await categoryService.findById(input.categoryId);

  return productRepository.create({
    categoryId: input.categoryId,
    name: input.name,
    description: input.description ?? null,
    price: input.price,
    originalPrice: input.originalPrice ?? null,
    badge: input.badge ?? null,
  });
}

async function findAll(
  filters: ProductFilters,
  pagination: PaginationParams
): Promise<PaginatedResult<Product>> {
  return productRepository.findAll(filters, pagination);
}

async function findById(id: string): Promise<Product> {
  const product = await productRepository.findById(id);

  if (!product) {
    throw new NotFoundError(`Produto com id "${id}" não encontrado.`);
  }

  return product;
}

/**
 * Se o cliente está a MUDAR o produto de categoria (categoryId
 * presente no payload), validamos a nova categoria da mesma forma
 * que em `create`. Se `categoryId` não veio no payload, não há nada
 * para validar aqui — o produto simplesmente mantém a categoria
 * atual.
 */
async function update(id: string, input: UpdateProductInput): Promise<Product> {
  if (input.categoryId !== undefined) {
    await categoryService.findById(input.categoryId);
  }

  const updated = await productRepository.update(id, input);

  if (!updated) {
    throw new NotFoundError(`Produto com id "${id}" não encontrado.`);
  }

  return updated;
}

async function remove(id: string): Promise<void> {
  const deleted = await productRepository.remove(id);

  if (!deleted) {
    throw new NotFoundError(`Produto com id "${id}" não encontrado.`);
  }
}

export const productService = {
  create,
  findAll,
  findById,
  update,
  remove,
};
