import { z } from 'zod';

const specKeySchema = z
  .string({ error: 'specKey é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'specKey não pode ser vazio.')
  .max(255, 'specKey deve ter no máximo 255 caracteres.');

const specValueSchema = z
  .string({ error: 'specValue é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'specValue não pode ser vazio.')
  .max(255, 'specValue deve ter no máximo 255 caracteres.');

/**
 * OBRIGATÓRIO (sem .optional()), diferente de displayOrder em
 * product_image: a coluna display_order aqui é NOT NULL SEM DEFAULT
 * no banco — não há um valor "de fallback" seguro para inventar em
 * nome do cliente, então exigimos explicitamente.
 */
const displayOrderSchema = z.number().int().min(0, 'displayOrder não pode ser negativo.');

export const createProductSpecificationSchema = z
  .object({
    specKey: specKeySchema,
    specValue: specValueSchema,
    displayOrder: displayOrderSchema,
  })
  .strict();

export const updateProductSpecificationSchema = z
  .object({
    specKey: specKeySchema.optional(),
    specValue: specValueSchema.optional(),
    displayOrder: displayOrderSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser enviado para atualização.',
  });

export const productIdOnlyParamSchema = z.object({
  productId: z.uuid('productId deve ser um UUID válido.'),
});

export const productSpecificationParamSchema = z.object({
  productId: z.uuid('productId deve ser um UUID válido.'),
  id: z.uuid('id deve ser um UUID válido.'),
});

export type CreateProductSpecificationInput = z.infer<typeof createProductSpecificationSchema>;
export type UpdateProductSpecificationInput = z.infer<typeof updateProductSpecificationSchema>;
export type ProductIdOnlyParam = z.infer<typeof productIdOnlyParamSchema>;
export type ProductSpecificationParam = z.infer<typeof productSpecificationParamSchema>;
