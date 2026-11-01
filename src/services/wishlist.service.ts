import { productService } from './product.service';
import { wishlistRepository } from '../repositories/wishlist.repository';
import { WishlistItem } from '../types/wishlist.types';
import { AddWishlistItemInput } from '../validators/wishlist.validator';

async function findAll(userId: string): Promise<WishlistItem[]> {
  return wishlistRepository.findAllByUser(userId);
}

async function add(
  userId: string,
  input: AddWishlistItemInput
): Promise<{ item: WishlistItem; created: boolean }> {
  await productService.findById(input.productId);
  const created = await wishlistRepository.add(userId, input.productId);
  const item = await wishlistRepository.findByUserAndProduct(userId, input.productId);
  if (!item) {
    throw new Error('O produto adicionado à wishlist não foi encontrado.');
  }
  return { item, created };
}

async function remove(userId: string, productId: string): Promise<void> {
  await wishlistRepository.remove(userId, productId);
}

export const wishlistService = { findAll, add, remove };
