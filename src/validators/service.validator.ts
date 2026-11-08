import { z } from 'zod';
import { isCatalogIcon } from '../data/icon-catalog';

const icon = z.string().trim().max(60).regex(/^(brands\/)?[a-z0-9]+(-[a-z0-9]+)*$/).refine(
  isCatalogIcon,
  'icon não existe no catálogo de ícones.'
);
const price = z.coerce.number().nonnegative('startsFromPrice não pode ser negativo.');

export const createServiceSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(5000).optional().nullable(),
    icon,
    startsFromPrice: price.optional().nullable(),
    isActive: z.preprocess(
      (value) => (value === 'true' ? true : value === 'false' ? false : value),
      z.boolean().default(true)
    ),
  })
  .strict();

export const updateServiceSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    icon: icon.optional(),
    startsFromPrice: price.optional().nullable(),
    isActive: z.preprocess(
      (value) => (value === 'true' ? true : value === 'false' ? false : value),
      z.boolean().optional()
    ),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envie pelo menos um campo para actualizar o serviço.',
  });

export const serviceIdParamSchema = z.object({ id: z.guid('id deve ser um UUID válido.') }).strict();
export const publicListServicesQuerySchema = z.object({}).strict();
export const listServicesQuerySchema = z.object({ includeInactive: z.enum(['true', 'false']).optional() }).strict();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceIdParam = z.infer<typeof serviceIdParamSchema>;
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
