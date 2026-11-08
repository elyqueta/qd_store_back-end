import { z } from 'zod';

const uuid = z.uuid('deve ser um UUID válido.');
const date = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() ? new Date(value) : value),
  z.date().optional().nullable()
);
const boolean = z.preprocess(
  (value) => (value === 'true' ? true : value === 'false' ? false : value),
  z.boolean()
);
const ctaUrl = z
  .string()
  .trim()
  .max(255)
  .refine((value) => value.startsWith('/') || /^https:\/\//.test(value), {
    message: 'ctaUrl deve ser uma rota interna ou uma URL HTTPS.',
  });
const productId = z.preprocess(
  (value) => (value === '' ? null : value),
  uuid.nullable().optional()
);

const base = {
  placement: z.enum(['hero', 'showcase', 'category_block']),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(255).optional().nullable(),
  label: z.string().trim().max(60).optional().nullable(),
  ctaLabel: z.string().trim().max(60).optional().nullable(),
  ctaUrl: ctaUrl.optional().nullable(),
  productId,
  categoryId: uuid.optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: boolean.default(true),
  startsAt: date,
  endsAt: date,
  theme: z.enum(['dark', 'light']).default('dark'),
};

function validateDates(data: { startsAt?: Date | null; endsAt?: Date | null }, ctx: z.RefinementCtx): void {
  if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
    ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'endsAt deve ser posterior a startsAt.' });
  }
}

export const createHighlightSchema = z.object(base).strict().superRefine(validateDates);
export const updateHighlightSchema = z
  .object({
    ...base,
    displayOrder: z.coerce.number().int().min(0).optional(),
    isActive: boolean.optional(),
    theme: z.enum(['dark', 'light']).optional(),
  })
  .strict()
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Envie pelo menos um campo.' })
  .superRefine(validateDates);
export const highlightIdParamSchema = z.object({ id: uuid }).strict();
export const listHighlightsQuerySchema = z
  .object({ placement: z.enum(['hero', 'showcase', 'category_block']).optional() })
  .strict();
export const reorderHighlightsSchema = z
  .object({
    items: z
      .array(z.object({ id: uuid, displayOrder: z.coerce.number().int().min(0) }).strict())
      .min(1),
  })
  .strict();

export type CreateHighlightInput = z.infer<typeof createHighlightSchema>;
export type UpdateHighlightInput = z.infer<typeof updateHighlightSchema>;
export type HighlightIdParam = z.infer<typeof highlightIdParamSchema>;
export type ListHighlightsQuery = z.infer<typeof listHighlightsQuerySchema>;
export type ReorderHighlightsInput = z.infer<typeof reorderHighlightsSchema>;
