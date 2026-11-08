import { z } from 'zod';
import { findMunicipalityInProvince, findProvinceByName } from '../data/angola-locations';

const nif = z
  .string()
  .trim()
  .regex(/^[0-9]{9}$/, 'nif deve conter exactamente 9 dígitos.');
const phone = z
  .string()
  .trim()
  .regex(
    /^(?:\+?244[\s().-]*)?[239][0-9](?:[\s().-]*[0-9]){7}$/,
    'phone deve ser um número angolano válido.'
  );

export const createQuoteRequestSchema = z
  .object({
    companyName: z.string().trim().min(1).max(200),
    nif,
    contactName: z.string().trim().min(1).max(150),
    email: z.string().trim().toLowerCase().email().max(255),
    phone,
    province: z.string().trim().min(1).max(100),
    municipality: z.string().trim().min(1).max(100),
    sector: z.string().trim().min(1).max(100),
    volume: z.string().trim().min(1).max(100),
    categories: z.array(z.string().trim().min(1).max(100)).min(1).max(30),
    message: z.string().trim().max(5000).optional().nullable(),
  })
  .strict()
  .superRefine((input, context) => {
    const province = findProvinceByName(input.province);
    if (!province) {
      context.addIssue({
        code: 'custom',
        path: ['province'],
        message: 'province não corresponde a uma província de Angola.',
      });
      return;
    }

    if (!findMunicipalityInProvince(province, input.municipality)) {
      context.addIssue({
        code: 'custom',
        path: ['municipality'],
        message: 'municipality não pertence à província indicada.',
      });
    }

    if (new Set(input.categories).size !== input.categories.length) {
      context.addIssue({
        code: 'custom',
        path: ['categories'],
        message: 'categories não pode conter valores repetidos.',
      });
    }
  })
  .transform((input) => {
    const province = findProvinceByName(input.province);
    if (!province) return input;
    const municipality = findMunicipalityInProvince(province, input.municipality);

    return {
      ...input,
      province: province.name,
      municipality: municipality ?? input.municipality,
    };
  });

export const listQuoteRequestsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().max(255).optional(),
    status: z.enum(['new', 'contacted', 'closed']).optional(),
  })
  .strict();

export const quoteRequestIdParamSchema = z
  .object({ id: z.uuid('id deve ser um UUID válido.') })
  .strict();

export const updateQuoteRequestStatusSchema = z
  .object({ status: z.enum(['new', 'contacted', 'closed']) })
  .strict();

export type CreateQuoteRequestInput = z.infer<typeof createQuoteRequestSchema>;
export type ListQuoteRequestsQuery = z.infer<typeof listQuoteRequestsQuerySchema>;
export type QuoteRequestIdParam = z.infer<typeof quoteRequestIdParamSchema>;
export type UpdateQuoteRequestStatusInput = z.infer<typeof updateQuoteRequestStatusSchema>;
