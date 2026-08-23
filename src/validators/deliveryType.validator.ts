import { z } from 'zod';

const deliveryModeSchema = z.enum(['standard', 'express', 'corporate', 'pickup']);

const nameSchema = z
  .string({ error: 'name é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'name não pode ser vazio.')
  .max(100, 'name deve ter no máximo 100 caracteres.');

const descriptionSchema = z
  .string()
  .trim()
  .max(200, 'description deve ter no máximo 200 caracteres.');

export const createDeliveryTypeSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema.optional(),
    price: z.number().nonnegative('price deve ser maior ou igual a zero.'),
    type: deliveryModeSchema,
  })
  .strict();

export const updateDeliveryTypeSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    price: z.number().nonnegative('price deve ser maior ou igual a zero.').optional(),
    type: deliveryModeSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser enviado para atualização.',
  });

export const deliveryTypeIdParamSchema = z.object({
  id: z.uuid('id deve ser um UUID válido.'),
});

export type CreateDeliveryTypeInput = z.infer<typeof createDeliveryTypeSchema>;
export type UpdateDeliveryTypeInput = z.infer<typeof updateDeliveryTypeSchema>;
export type DeliveryTypeIdParam = z.infer<typeof deliveryTypeIdParamSchema>;
