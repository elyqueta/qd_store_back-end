import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { cartService } from '../services/cart.service';
import {
  CartItemIdParam,
  AddCartItemInput,
  UpdateCartItemInput,
} from '../validators/cart.validator';

function getUserId(req: Request): string {
  return req.user!.sub;
}

const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(getUserId(req));
  res.status(200).json({ status: 'success', data: cart });
});

const addItem = asyncHandler(
  async (req: Request<Record<string, string>, unknown, AddCartItemInput>, res: Response) => {
    const cart = await cartService.addItem(getUserId(req), req.body);
    res.status(201).json({ status: 'success', data: cart });
  }
);

const updateItem = asyncHandler(
  async (req: Request<CartItemIdParam, unknown, UpdateCartItemInput>, res: Response) => {
    const cart = await cartService.updateItem(getUserId(req), req.params.itemId, req.body);
    res.status(200).json({ status: 'success', data: cart });
  }
);

const removeItem = asyncHandler(async (req: Request<CartItemIdParam>, res: Response) => {
  await cartService.removeItem(getUserId(req), req.params.itemId);
  res.status(204).send();
});

const clear = asyncHandler(async (req: Request, res: Response) => {
  await cartService.clear(getUserId(req));
  res.status(204).send();
});

export const cartController = { getCart, addItem, updateItem, removeItem, clear };
