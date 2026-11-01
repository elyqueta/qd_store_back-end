import { z } from 'zod';

export const createOrderSchema = z
  .object({
    deliveryTypeId: z.uuid('deliveryTypeId deve ser um UUID válido.'),
    paymentMethodId: z.uuid('paymentMethodId deve ser um UUID válido.'),
    addressId: z.uuid('addressId deve ser um UUID válido.'),
    companyId: z.uuid('companyId deve ser um UUID válido.').optional(),
    notes: z.string().trim().max(1000, 'notes deve ter no máximo 1000 caracteres.').optional(),
  })
  .strict();

export const orderIdParamSchema = z.object({ id: z.uuid('id deve ser um UUID válido.') }).strict();

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
  userId: z.uuid('userId deve ser um UUID válido.').optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AdminListOrdersQuery = z.infer<typeof adminListOrdersQuerySchema>;
