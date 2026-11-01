import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { wishlistService } from '../services/wishlist.service';
import { AddWishlistItemInput, WishlistProductIdParam } from '../validators/wishlist.validator';

const findAll = asyncHandler(async (req: Request, res: Response) => {
  const items = await wishlistService.findAll(req.user!.sub);
  res.status(200).json({ status: 'success', data: items, count: items.length });
});

const add = asyncHandler(
  async (req: Request<Record<string, string>, unknown, AddWishlistItemInput>, res: Response) => {
    const result = await wishlistService.add(req.user!.sub, req.body);
    res.status(result.created ? 201 : 200).json({ status: 'success', data: result.item });
  }
);

const remove = asyncHandler(async (req: Request<WishlistProductIdParam>, res: Response) => {
  await wishlistService.remove(req.user!.sub, req.params.productId);
  res.status(204).send();
});

export const wishlistController = { findAll, add, remove };
