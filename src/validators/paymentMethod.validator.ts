import { z } from 'zod';

const paymentMethodTypeSchema = z.enum([
  'multicaixa_express',
  'multicaixa_reference',
  'bank_transfer',
]);

const nameSchema = z
  .string({ error: 'name é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'name não pode ser vazio.')
  .max(100, 'name deve ter no máximo 100 caracteres.');

export const createPaymentMethodSchema = z
  .object({
    name: nameSchema,
    type: paymentMethodTypeSchema,
  })
  .strict();

export const updatePaymentMethodSchema = z
  .object({
    name: nameSchema.optional(),
    type: paymentMethodTypeSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser enviado para atualização.',
  });

export const paymentMethodIdParamSchema = z.object({
  id: z.uuid('id deve ser um UUID válido.'),
});

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;
export type PaymentMethodIdParam = z.infer<typeof paymentMethodIdParamSchema>;
