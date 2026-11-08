import { NotFoundError } from '../errors';
import { serviceRepository } from '../repositories/service.repository';
import { Service } from '../types/service.types';
import {
  CreateServiceInput,
  ListServicesQuery,
  UpdateServiceInput,
} from '../validators/service.validator';
import { cloudinaryService } from './cloudinary.service';
import {
  enqueueCloudinaryDeletions,
  processCloudinaryDeletionQueue,
} from './cloudinaryDeletionQueue.service';

async function list(_query: ListServicesQuery): Promise<Service[]> {
  return serviceRepository.findAll(false);
}

async function listAdmin(query: ListServicesQuery): Promise<Service[]> {
  return serviceRepository.findAll(query.includeInactive === 'true');
}

async function create(input: CreateServiceInput, file?: Express.Multer.File): Promise<Service> {
  const uploaded = file
    ? await cloudinaryService.uploadImage(file.buffer, 'qd-store/services')
    : undefined;
  try {
    return await serviceRepository.create({
      ...input,
      ...(uploaded ? { imageUrl: uploaded.url, imagePublicId: uploaded.publicId } : {}),
    });
  } catch (error) {
    if (uploaded) await enqueueCloudinaryDeletions([uploaded.publicId]);
    throw error;
  }
}

async function update(
  id: string,
  input: UpdateServiceInput,
  file?: Express.Multer.File
): Promise<Service> {
  const current = await serviceRepository.findById(id);
  if (!current) throw new NotFoundError('Serviço não encontrado.');
  const uploaded = file
    ? await cloudinaryService.uploadImage(file.buffer, 'qd-store/services')
    : undefined;
  try {
    const updated = await serviceRepository.update(id, {
      ...input,
      ...(uploaded ? { imageUrl: uploaded.url, imagePublicId: uploaded.publicId } : {}),
    });
    if (!updated) throw new NotFoundError('Serviço não encontrado.');
    if (uploaded) {
      await enqueueCloudinaryDeletions([cloudinaryService.publicIdFromUrl(current.imageUrl ?? '')]);
      await processCloudinaryDeletionQueue();
    }
    return updated;
  } catch (error) {
    if (uploaded) await enqueueCloudinaryDeletions([uploaded.publicId]);
    throw error;
  }
}

async function remove(id: string): Promise<void> {
  const current = await serviceRepository.findById(id);
  if (!current) throw new NotFoundError('Serviço não encontrado.');
  const updated = await serviceRepository.update(id, { isActive: false });
  if (!updated) throw new NotFoundError('Serviço não encontrado.');
  await processCloudinaryDeletionQueue();
}

export const serviceService = { list, listAdmin, create, update, remove };
