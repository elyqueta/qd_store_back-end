import { z } from 'zod';

export const createOrderSchema = z
  .object({
    deliveryTypeId: z.guid('deliveryTypeId deve ser um UUID válido.'),
    paymentMethodId: z.guid('paymentMethodId deve ser um UUID válido.'),
    addressId: z.guid('addressId deve ser um UUID válido.'),
    companyId: z.guid('companyId deve ser um UUID válido.').nullable().optional(),
    companySnapshot: z
      .object({
        name: z.string().trim().min(1).max(200),
        nif: z
          .string()
          .trim()
          .regex(/^[0-9]{9}$/, 'nif deve conter exactamente 9 dígitos.'),
        role: z.string().trim().min(1).max(100),
      })
      .strict()
      .optional(),
    notes: z.string().trim().max(1000, 'notes deve ter no máximo 1000 caracteres.').optional(),
  })
  .strict()
  .refine((data) => !(data.companyId && data.companySnapshot), {
    message: 'Escolha companyId ou companySnapshot, não ambos.',
    path: ['companyId'],
  });

export const orderIdParamSchema = z.object({ id: z.guid('id deve ser um UUID válido.') }).strict();

export const listOrdersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['processing', 'in_transit', 'delivered', 'cancelled']).optional(),
  })
  .strict();

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(['in_transit', 'delivered', 'cancelled']),
    note: z.string().trim().max(500, 'note deve ter no máximo 500 caracteres.').optional(),
  })
  .strict();

export const adminListOrdersQuerySchema = listOrdersQuerySchema.extend({
  userId: z.guid('userId deve ser um UUID válido.').optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AdminListOrdersQuery = z.infer<typeof adminListOrdersQuerySchema>;
