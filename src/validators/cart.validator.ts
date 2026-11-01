import { z } from 'zod';

export const addCartItemSchema = z
  .object({
    productId: z.uuid('productId deve ser um UUID válido.'),
    quantity: z.coerce
      .number({ error: 'quantity deve ser um número inteiro.' })
      .int('quantity deve ser um número inteiro.')
      .min(1, 'quantity deve ser no mínimo 1.')
      .max(99, 'quantity deve ser no máximo 99.')
      .default(1),
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: z.coerce
      .number({ error: 'quantity deve ser um número inteiro.' })
      .int('quantity deve ser um número inteiro.')
      .min(1, 'quantity deve ser no mínimo 1.')
      .max(99, 'quantity deve ser no máximo 99.'),
  })
  .strict();

export const cartItemIdParamSchema = z
  .object({
    itemId: z.uuid('itemId deve ser um UUID válido.'),
  })
  .strict();

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemIdParam = z.infer<typeof cartItemIdParamSchema>;
