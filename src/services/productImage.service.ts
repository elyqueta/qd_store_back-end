import { productImageRepository } from '../repositories/productImage.repository';
import { productService } from './product.service';
import { ProductImage } from '../types/productImage.types';
import type { ProductImageStorage } from '../repositories/productImage.repository';
import {
  CreateProductImageInput,
  UpdateProductImageInput,
} from '../validators/productImage.validator';
import { NotFoundError, ValidationError } from '../errors';
import { logger } from '../config/logger';
import { cloudinaryService } from './cloudinary.service';
import {
  enqueueCloudinaryDeletions,
  processCloudinaryDeletionQueue,
} from './cloudinaryDeletionQueue.service';

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

async function create(
  productId: string,
  input: CreateProductImageInput,
  file?: Express.Multer.File
): Promise<ProductImage> {
  await productService.findById(productId);

  if (!file) {
    throw new ValidationError('Envie o ficheiro da imagem no campo "image".');
  }

  const uploaded = await cloudinaryService.uploadImage(file.buffer);
  try {
    return await productImageRepository.create({
      productId,
      url: uploaded.url,
      displayOrder: input.displayOrder,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
      sizeBytes: uploaded.sizeBytes,
      cloudinaryPublicId: uploaded.publicId,
    });
  } catch (error) {
    await cleanupUploadedAsset(uploaded.publicId);
    throw error;
  }
}

async function findAllByProduct(productId: string): Promise<ProductImage[]> {
  await productService.findById(productId);
  return productImageRepository.findAllByProduct(productId);
}

async function findAllForCleanup(productId: string): Promise<ProductImageStorage[]> {
  return productImageRepository.findAllForCleanup(productId);
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
  input: UpdateProductImageInput,
  file?: Express.Multer.File
): Promise<ProductImage> {
  await findOwnedById(productId, id);
  const storage = await productImageRepository.findStorageById(id);

  if (!file && Object.keys(input).length === 0) {
    throw new ValidationError('Envie um ficheiro ou pelo menos um campo para atualizar.');
  }

  const uploaded = file ? await cloudinaryService.uploadImage(file.buffer) : undefined;
  const updateData = uploaded
    ? {
        ...input,
        url: uploaded.url,
        cloudinaryPublicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
        format: uploaded.format,
        sizeBytes: uploaded.sizeBytes,
      }
    : {
        ...input,
        previousCloudinaryPublicId:
          storage?.cloudinaryPublicId ??
          (storage ? cloudinaryService.publicIdFromUrl(storage.url) : null),
      };

  let updated: ProductImage;
  try {
    const result = await productImageRepository.update(id, updateData);
    if (!result) {
      throw new NotFoundError('Imagem não encontrada.');
    }
    updated = result;
  } catch (error) {
    if (uploaded) {
      await cleanupUploadedAsset(uploaded.publicId);
    }
    throw error;
  }

  await processCloudinaryDeletionQueue();
  return updated;
}

async function remove(productId: string, id: string): Promise<void> {
  await findOwnedById(productId, id);
  const storage = await productImageRepository.findStorageById(id);
  const publicId =
    storage?.cloudinaryPublicId ??
    (storage ? cloudinaryService.publicIdFromUrl(storage.url) : null);
  await productImageRepository.remove(id, publicId);
  await processCloudinaryDeletionQueue();
}

export const productImageService = {
  create,
  findAllByProduct,
  findAllForCleanup,
  update,
  remove,
};
