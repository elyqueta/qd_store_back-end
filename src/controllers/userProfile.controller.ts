import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { userRepository } from '../repositories/user.repository';
import { userProfileService } from '../services/userProfile.service';
import { UpdateUserProfileInput } from '../validators/userProfile.validator';
import { NotFoundError } from '../errors';

const get = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.user!.sub);
  if (!user) {
    throw new NotFoundError('Utilizador não encontrado.');
  }
  res.status(200).json({ status: 'success', data: user });
});

const update = asyncHandler(
  async (
    req: Request<Record<string, string>, unknown, UpdateUserProfileInput>,
    res: Response
  ) => {
    const user = await userProfileService.update(req.user!.sub, req.body, req.file);
    res.status(200).json({ status: 'success', data: user });
  }
);

const removePhoto = asyncHandler(async (req: Request, res: Response) => {
  const user = await userProfileService.removePhoto(req.user!.sub);
  res.status(200).json({ status: 'success', data: user });
});

export const userProfileController = { get, update, removePhoto };
