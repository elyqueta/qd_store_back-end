import { NotFoundError, UnauthorizedError, ValidationError } from '../errors';
import { logger } from '../config/logger';
import { cloudinaryService } from './cloudinary.service';
import { enqueueCloudinaryDeletions, processCloudinaryDeletionQueue } from './cloudinaryDeletionQueue.service';
import { comparePassword, hashPassword } from '../utils/password.util';
import { userRepository, UpdateUserProfileData } from '../repositories/user.repository';
import { UpdateUserProfileInput } from '../validators/userProfile.validator';
import { User } from '../types/user.types';

async function cleanupAsset(publicId: string): Promise<void> {
  try {
    await enqueueCloudinaryDeletions([publicId]);
    await processCloudinaryDeletionQueue();
  } catch (error) {
    logger.error({ err: error, publicId }, 'Falha ao limpar foto de perfil.');
  }
}

async function update(
  userId: string,
  input: UpdateUserProfileInput,
  file?: Express.Multer.File
): Promise<User> {
  const existing = await userRepository.findByIdWithPasswordHash(userId);
  if (!existing) throw new NotFoundError('Utilizador não encontrado.');

  if (input.currentPassword) {
    const valid = await comparePassword(input.currentPassword, existing.passwordHash);
    if (!valid) throw new UnauthorizedError('A password actual está incorrecta.');
  }
  if (input.newPassword && input.currentPassword === input.newPassword) {
    throw new ValidationError('A nova password deve ser diferente da actual.');
  }
  if (input.removePhoto && file) {
    throw new ValidationError('Não envie uma nova foto e removePhoto=true ao mesmo tempo.');
  }

  const uploaded = file
    ? await cloudinaryService.uploadImage(file.buffer, 'qd-store/profile')
    : undefined;
  const data: UpdateUserProfileData = {
    userId,
    actorId: userId,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    passwordHash: input.newPassword ? await hashPassword(input.newPassword) : undefined,
    previousEmail: input.email && input.email !== existing.user.email ? existing.user.email : undefined,
    previousPhone: input.phone && input.phone !== existing.user.phone ? existing.user.phone : undefined,
  };
  if (uploaded) {
    data.profilePhoto = uploaded;
  } else if (input.removePhoto) {
    data.profilePhoto = null;
  }

  try {
    const updated = await userRepository.updateProfile(data);
    if (
      existing.profilePhotoPublicId &&
      (uploaded || input.removePhoto)
    ) {
      await cleanupAsset(existing.profilePhotoPublicId);
    }
    return updated;
  } catch (error) {
    if (uploaded) await cleanupAsset(uploaded.publicId);
    throw error;
  }
}

async function removePhoto(userId: string): Promise<User> {
  return update(userId, { removePhoto: true });
}

export const userProfileService = { update, removePhoto };
