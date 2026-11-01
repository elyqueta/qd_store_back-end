import { z } from 'zod';

export const createPaymentSchema = z.discriminatedUnion('methodType', [
  z
    .object({
      methodType: z.literal('multicaixa_express'),
      customerPhone: z
        .string()
        .trim()
        .min(9, 'customerPhone deve ter pelo menos 9 caracteres.')
        .max(20, 'customerPhone deve ter no máximo 20 caracteres.'),
    })
    .strict(),
  z.object({ methodType: z.literal('multicaixa_reference') }).strict(),
  z.object({ methodType: z.literal('bank_transfer') }).strict(),
]);

export const orderIdParamSchema = z
  .object({ orderId: z.uuid('orderId deve ser um UUID válido.') })
  .strict();

export const paymentIdParamSchema = z
  .object({ paymentId: z.uuid('paymentId deve ser um UUID válido.') })
  .strict();

const adminPaymentNotesSchema = z
  .object({
    notes: z.string().trim().max(500, 'notes deve ter no máximo 500 caracteres.').optional(),
  })
  .strict()
  .default({});

export const adminConfirmPaymentSchema = adminPaymentNotesSchema;
export const adminRejectPaymentSchema = adminPaymentNotesSchema;

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type OrderPaymentIdParam = z.infer<typeof orderIdParamSchema>;
export type PaymentIdParam = z.infer<typeof paymentIdParamSchema>;
export type AdminConfirmPaymentInput = z.infer<typeof adminConfirmPaymentSchema>;
export type AdminRejectPaymentInput = z.infer<typeof adminRejectPaymentSchema>;
