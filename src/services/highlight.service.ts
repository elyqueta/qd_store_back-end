import { NotFoundError, ValidationError } from '../errors';
import { cloudinaryService } from './cloudinary.service';
import { enqueueCloudinaryDeletions, processCloudinaryDeletionQueue } from './cloudinaryDeletionQueue.service';
import { highlightRepository } from '../repositories/highlight.repository';
import { CreateHighlightInput, ReorderHighlightsInput, UpdateHighlightInput } from '../validators/highlight.validator';
import { Highlight } from '../types/highlight.types';
import { productRepository } from '../repositories/product.repository';

async function listPublic(placement?: string): Promise<Highlight[]> {
  return highlightRepository.findAll(placement, true);
}
async function listAdmin(placement?: string): Promise<Highlight[]> {
  return highlightRepository.findAll(placement);
}
async function create(input: CreateHighlightInput, file?: Express.Multer.File): Promise<Highlight> {
  if (input.productId) {
    await requireProductImage(input.productId);
    if (file) throw new ValidationError('A imagem de um destaque ligado a produto é obtida automaticamente.');
    return highlightRepository.create({ ...input, imageUrl: null, imagePublicId: null });
  }
  if (!file) throw new ValidationError('Seleccione um produto com imagem ou envie a imagem no campo "image".');
  const uploaded = await cloudinaryService.uploadImage(file.buffer, 'qd-store/highlights');
  try {
    return await highlightRepository.create({ ...input, imageUrl: uploaded.url, imagePublicId: uploaded.publicId });
  } catch (error) {
    await enqueueCloudinaryDeletions([uploaded.publicId]);
    throw error;
  }
}
async function update(id: string, input: UpdateHighlightInput, file?: Express.Multer.File): Promise<Highlight> {
  const current = await highlightRepository.findById(id);
  if (!current) throw new NotFoundError('Destaque não encontrado.');
  const productId = input.productId === undefined ? current.product?.id : input.productId;
  if (productId) {
    await requireProductImage(productId);
    if (file) throw new ValidationError('A imagem de um destaque ligado a produto é obtida automaticamente.');
  } else if (input.productId === null && current.product && !file) {
    throw new ValidationError('Envie uma imagem ao remover o produto associado.');
  }
  const uploaded = file ? await cloudinaryService.uploadImage(file.buffer, 'qd-store/highlights') : undefined;
  try {
    const updated = await highlightRepository.update(id, {
      ...input,
      ...(uploaded ? { imageUrl: uploaded.url, imagePublicId: uploaded.publicId } : {}),
    });
    if (!updated) throw new NotFoundError('Destaque não encontrado.');
    if (uploaded) {
      await enqueueCloudinaryDeletions([cloudinaryService.publicIdFromUrl(current.imageUrl ?? '')]);
    }
    await processCloudinaryDeletionQueue();
    return updated;
  } catch (error) {
    if (uploaded) await enqueueCloudinaryDeletions([uploaded.publicId]);
    throw error;
  }
}
async function remove(id: string): Promise<void> {
  if (!(await highlightRepository.remove(id))) throw new NotFoundError('Destaque não encontrado.');
}
async function permanentlyRemove(id: string): Promise<void> {
  if (!(await highlightRepository.permanentlyRemove(id))) {
    throw new NotFoundError('Destaque não encontrado.');
  }
  await processCloudinaryDeletionQueue();
}
async function reorder(input: ReorderHighlightsInput): Promise<void> {
  await highlightRepository.reorder(input);
}
export const highlightService = { listPublic, listAdmin, create, update, remove, permanentlyRemove, reorder };

async function requireProductImage(productId: string): Promise<void> {
  const product = await productRepository.findById(productId);
  if (!product) throw new NotFoundError('Produto do destaque não encontrado.');
  if (product.status !== 'active') {
    throw new ValidationError('Seleccione um produto activo para o destaque.');
  }
  if (!product.mainImage?.url) {
    throw new ValidationError('O produto seleccionado ainda não tem imagem principal.');
  }
}
