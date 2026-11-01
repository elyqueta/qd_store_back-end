import { z } from 'zod';

export const addWishlistItemSchema = z
  .object({ productId: z.uuid('productId deve ser um UUID válido.') })
  .strict();

export const wishlistProductIdParamSchema = z
  .object({ productId: z.uuid('productId deve ser um UUID válido.') })
  .strict();

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
export type WishlistProductIdParam = z.infer<typeof wishlistProductIdParamSchema>;
