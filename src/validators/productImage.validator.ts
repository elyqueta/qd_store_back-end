import { z } from 'zod';

/**
 * URL-only, conforme decidido na Etapa 2: a API não recebe upload de
 * ficheiro, só a URL de uma imagem já hospedada (ex: Supabase
 * Storage, S3, CDN). width/height/format/sizeBytes são opcionais —
 * metadados que o cliente PODE enviar se já os conhece (ex: um
 * front-end que leu as dimensões antes do upload), mas a API não os
 * calcula sozinha.
 */
const urlSchema = z
  .url('url deve ser um endereço válido.')
  .max(2048, 'url deve ter no máximo 2048 caracteres.');

const displayOrderSchema = z.number().int().min(0, 'displayOrder não pode ser negativo.');
const formatSchema = z.string().trim().max(10, 'format deve ter no máximo 10 caracteres.');
const dimensionSchema = z.number().int().positive();
const sizeBytesSchema = z.number().int().positive();

export const createProductImageSchema = z
  .object({
    url: urlSchema,
    displayOrder: displayOrderSchema.optional(),
    width: dimensionSchema.optional(),
    height: dimensionSchema.optional(),
    format: formatSchema.optional(),
    sizeBytes: sizeBytesSchema.optional(),
  })
  .strict();

export const updateProductImageSchema = z
  .object({
    url: urlSchema.optional(),
    displayOrder: displayOrderSchema.optional(),
    width: dimensionSchema.nullable().optional(),
    height: dimensionSchema.nullable().optional(),
    format: formatSchema.nullable().optional(),
    sizeBytes: sizeBytesSchema.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser enviado para atualização.',
  });

/** Só o :productId, para POST / e GET / (listar todas as imagens). */
export const productIdOnlyParamSchema = z.object({
  productId: z.uuid('productId deve ser um UUID válido.'),
});

/** :productId + :id, para PATCH/DELETE de uma imagem específica. */
export const productImageParamSchema = z.object({
  productId: z.uuid('productId deve ser um UUID válido.'),
  id: z.uuid('id deve ser um UUID válido.'),
});

export type CreateProductImageInput = z.infer<typeof createProductImageSchema>;
export type UpdateProductImageInput = z.infer<typeof updateProductImageSchema>;
export type ProductIdOnlyParam = z.infer<typeof productIdOnlyParamSchema>;
export type ProductImageParam = z.infer<typeof productImageParamSchema>;
