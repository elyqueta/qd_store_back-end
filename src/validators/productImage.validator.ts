import { z } from 'zod';

const numericInputSchema = z.union([
  z.number(),
  z.string().trim().regex(/^\d+$/, 'deve ser um número inteiro.').transform(Number),
]);

const displayOrderSchema = numericInputSchema.pipe(
  z.number().int().min(0, 'displayOrder não pode ser negativo.')
);
const formatSchema = z.string().trim().max(10, 'format deve ter no máximo 10 caracteres.');
const dimensionSchema = numericInputSchema.pipe(z.number().int().positive());
const sizeBytesSchema = numericInputSchema.pipe(z.number().int().positive());

export const createProductImageSchema = z
  .object({
    displayOrder: displayOrderSchema.optional(),
    width: dimensionSchema.optional(),
    height: dimensionSchema.optional(),
    format: formatSchema.optional(),
    sizeBytes: sizeBytesSchema.optional(),
  })
  .strict();

export const updateProductImageSchema = z
  .object({
    displayOrder: displayOrderSchema.optional(),
    width: dimensionSchema.nullable().optional(),
    height: dimensionSchema.nullable().optional(),
    format: formatSchema.nullable().optional(),
    sizeBytes: sizeBytesSchema.nullable().optional(),
  })
  .strict();

/** Só o :productId, para POST / e GET / (listar todas as imagens). */
export const productIdOnlyParamSchema = z.object({
  productId: z.guid('productId deve ser um UUID válido.'),
});

/** :productId + :id, para PATCH/DELETE de uma imagem específica. */
export const productImageParamSchema = z.object({
  productId: z.guid('productId deve ser um UUID válido.'),
  id: z.guid('id deve ser um UUID válido.'),
});

export type CreateProductImageInput = z.infer<typeof createProductImageSchema>;
export type UpdateProductImageInput = z.infer<typeof updateProductImageSchema>;
export type ProductIdOnlyParam = z.infer<typeof productIdOnlyParamSchema>;
export type ProductImageParam = z.infer<typeof productImageParamSchema>;
