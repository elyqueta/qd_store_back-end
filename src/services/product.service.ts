import { productRepository } from '../repositories/product.repository';
import { productImageRepository } from '../repositories/productImage.repository';
import { productSpecificationRepository } from '../repositories/productSpecification.repository';
import { categoryService } from './category.service';
import { Product, ProductDetails, ProductFilters } from '../types/product.types';
import { PaginatedResult, PaginationParams } from '../types/pagination.types';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';
import { NotFoundError } from '../errors';
import { cloudinaryService } from './cloudinary.service';
import {
  enqueueCloudinaryDeletions,
  processCloudinaryDeletionQueue,
} from './cloudinaryDeletionQueue.service';
import { logger } from '../config/logger';

async function cleanupUploadedAsset(publicId: string): Promise<void> {
  try {
    await enqueueCloudinaryDeletions([publicId]);
    await processCloudinaryDeletionQueue();
  } catch (error) {
    logger.error(
      { err: error, publicId },
      'Falha ao agendar a limpeza de uma imagem enviada sem persistência.'
    );
    try {
      await cloudinaryService.deleteImage(publicId);
    } catch (deleteError) {
      logger.error(
        { err: deleteError, publicId },
        'Não foi possível remover do Cloudinary uma imagem sem persistência.'
      );
    }
  }
}

/**
 * `await categoryService.findById(...)` aqui não serve para usar o
 * valor devolvido — serve para forçar um 404 CLARO ("categoria não
 * encontrada") ANTES de sequer tentar o INSERT. Mesmo raciocínio já
 * documentado em userCompany.service.ts para companyService.findById.
 */
async function create(input: CreateProductInput, file?: Express.Multer.File): Promise<Product> {
  await categoryService.findById(input.categoryId);

  const uploaded = file ? await cloudinaryService.uploadImage(file.buffer) : undefined;

  try {
    return await productRepository.create({
      categoryId: input.categoryId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      originalPrice: input.originalPrice ?? null,
      badge: input.badge ?? null,
      mainImage: uploaded
        ? {
            url: uploaded.url,
            width: uploaded.width,
            height: uploaded.height,
            format: uploaded.format,
            sizeBytes: uploaded.sizeBytes,
            cloudinaryPublicId: uploaded.publicId,
          }
        : undefined,
    });
  } catch (error) {
    if (uploaded) {
      await cleanupUploadedAsset(uploaded.publicId);
    }
    throw error;
  }
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

async function findByIdWithIncludes(
  id: string,
  includes: Array<'images' | 'specifications'>
): Promise<ProductDetails> {
  const product = await findById(id);
  const [images, specifications] = await Promise.all([
    includes.includes('images') ? productImageRepository.findAllByProduct(id) : undefined,
    includes.includes('specifications')
      ? productSpecificationRepository.findAllByProduct(id)
      : undefined,
  ]);

  return {
    ...product,
    ...(images !== undefined ? { images } : {}),
    ...(specifications !== undefined ? { specifications } : {}),
  };
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
  const images = await productImageRepository.findAllForCleanup(id);
  const cloudinaryPublicIds = images.map(
    (image) => image.cloudinaryPublicId ?? cloudinaryService.publicIdFromUrl(image.url)
  );
  const deleted = await productRepository.remove(
    id,
    cloudinaryPublicIds.filter((publicId): publicId is string => publicId !== null)
  );

  if (!deleted) {
    throw new NotFoundError(`Produto com id "${id}" não encontrado.`);
  }

  await processCloudinaryDeletionQueue();
}

export const productService = {
  create,
  findAll,
  findById,
  findByIdWithIncludes,
  update,
  remove,
};
