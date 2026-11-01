import { ConflictError, NotFoundError } from '../errors';
import { cartRepository } from '../repositories/cart.repository';
import { Cart } from '../types/cart.types';
import { AddCartItemInput, UpdateCartItemInput } from '../validators/cart.validator';
import { productService } from './product.service';

async function getCart(userId: string): Promise<Cart> {
  await cartRepository.getOrCreateCartId(userId);
  return cartRepository.findCartByUser(userId);
}

async function addItem(userId: string, input: AddCartItemInput): Promise<Cart> {
  const product = await productService.findById(input.productId);
  if (product.status !== 'active') {
    throw new ConflictError('Este produto não está disponível.');
  }

  const cartId = await cartRepository.getOrCreateCartId(userId);
  await cartRepository.addItem(cartId, product.id, input.quantity, product.price);
  return cartRepository.findCartByUser(userId);
}

async function updateItem(
  userId: string,
  itemId: string,
  input: UpdateCartItemInput
): Promise<Cart> {
  const cartId = await cartRepository.getOrCreateCartId(userId);
  const updated = await cartRepository.updateItemQuantity(cartId, itemId, input.quantity);
  if (!updated) {
    throw new NotFoundError('Item do carrinho não encontrado.');
  }
  return cartRepository.findCartByUser(userId);
}

async function removeItem(userId: string, itemId: string): Promise<void> {
  const cartId = await cartRepository.getOrCreateCartId(userId);
  const removed = await cartRepository.removeItem(cartId, itemId);
  if (!removed) {
    throw new NotFoundError('Item do carrinho não encontrado.');
  }
}

async function clear(userId: string): Promise<void> {
  const cartId = await cartRepository.getOrCreateCartId(userId);
  await cartRepository.clear(cartId);
}

export const cartService = { getCart, addItem, updateItem, removeItem, clear };
