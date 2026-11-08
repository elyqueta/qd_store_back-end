import { z } from 'zod';

const nameSchema = z
  .string({ error: 'name é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'name não pode ser vazio.')
  .max(200, 'name deve ter no máximo 200 caracteres.');

const descriptionSchema = z
  .string()
  .trim()
  .max(5000, 'description deve ter no máximo 5000 caracteres.');

const badgeSchema = z.string().trim().max(50, 'badge deve ter no máximo 50 caracteres.');

/**
 * `.positive()` porque um preço zero ou negativo não faz sentido de
 * negócio, mesmo que a coluna DECIMAL do banco tecnicamente aceite.
 * Validar aqui evita que um erro de digitação (ex: esquecer um dígito)
 * chegue a ser persistido.
 */
const numberLikeSchema = (fieldName: string) =>
  z.preprocess(
    (value) => {
      if (typeof value === 'string' && value.trim() !== '' && /^\d+(?:\.\d+)?$/.test(value)) {
        return Number(value);
      }
      return value;
    },
    z.number({ error: `${fieldName} deve ser um número.` }).positive(`${fieldName} deve ser maior que zero.`)
  );

const priceSchema = numberLikeSchema('price');
const originalPriceSchema = numberLikeSchema('originalPrice');

const categoryIdSchema = z.guid('categoryId deve ser um UUID válido.');

/**
 * Regra cruzada: originalPrice representa o preço "riscado" antes do
 * desconto — só faz sentido de negócio se for MAIOR que o price atual.
 * Um originalPrice menor ou igual ao price não é um desconto, é um
 * dado inconsistente (ou um erro de digitação do lado de quem cria o
 * produto). Validamos aqui, ANTES de chegar ao banco, pelo mesmo
 * motivo já aplicado em address.validator.ts para província/município:
 * é mais barato rejeitar cedo com uma mensagem clara do que descobrir
 * a inconsistência depois, já persistida.
 */
function validatePriceConsistency(
  data: { price: number; originalPrice?: number | null },
  ctx: z.RefinementCtx
): void {
  if (
    data.originalPrice !== undefined &&
    data.originalPrice !== null &&
    data.originalPrice <= data.price
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['originalPrice'],
      message: 'originalPrice deve ser maior que price (senão não representa um desconto).',
    });
  }
}

export const createProductSchema = z
  .object({
    categoryId: categoryIdSchema,
    name: nameSchema,
    description: descriptionSchema.optional(),
    price: priceSchema,
    originalPrice: originalPriceSchema.optional(),
    badge: badgeSchema.optional(),
  })
  .strict()
  .superRefine(validatePriceConsistency);

/**
 * PATCH parcial. `originalPrice` aceita `.nullable()` além de
 * `.optional()` — mesmo padrão de icon em category.validator.ts —
 * porque um produto em promoção pode voltar ao preço normal (remover
 * o "preço riscado" explicitamente com originalPrice: null).
 *
 * A validação cruzada de preços só roda quando AMBOS os campos vêm
 * no payload — se o cliente só está a atualizar o `name`, não faz
 * sentido reexigir os preços.
 */
export const updateProductSchema = z
  .object({
    categoryId: categoryIdSchema.optional(),
    name: nameSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    price: priceSchema.optional(),
    originalPrice: originalPriceSchema.nullable().optional(),
    badge: badgeSchema.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser enviado para atualização.',
  })
  .superRefine((data, ctx) => {
    if (
      data.price !== undefined &&
      data.originalPrice !== undefined &&
      data.originalPrice !== null
    ) {
      validatePriceConsistency({ price: data.price, originalPrice: data.originalPrice }, ctx);
    }
  });

export const productIdParamSchema = z.object({
  id: z.guid('id deve ser um UUID válido.'),
});

/**
 * Query params de GET /api/products: paginação + filtros.
 *
 * z.coerce.number() é necessário porque query strings da URL SEMPRE
 * chegam como string ("?page=2"), nunca como number nativo — mesma
 * técnica já usada em config/env.ts para PORT e RATE_LIMIT_MAX.
 */
export const listProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100, 'limit máximo é 100.').default(20),
    categoryId: z.guid('categoryId deve ser um UUID válido.').optional(),
    status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
    excludeId: z.guid('excludeId deve ser um UUID válido.').optional(),
    search: z.string().trim().min(1).max(200).optional(),
    sort: z
      .enum([
        'createdAt_desc',
        'createdAt_asc',
        'name_asc',
        'name_desc',
        'price_asc',
        'price_desc',
      ])
      .default('createdAt_desc'),
    priceMin: z.coerce.number().nonnegative().optional(),
    priceMax: z.coerce.number().nonnegative().optional(),
    availableOnly: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .strict()
  .superRefine((query, ctx) => {
    if (query.priceMin !== undefined && query.priceMax !== undefined && query.priceMin > query.priceMax) {
      ctx.addIssue({
        code: 'custom',
        path: ['priceMax'],
        message: 'priceMax deve ser maior ou igual a priceMin.',
      });
    }

    if (query.availableOnly && query.status !== undefined && query.status !== 'active') {
      ctx.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'availableOnly=true não pode ser combinado com status diferente de active.',
      });
    }
  });

const productDetailIncludeSchema = z.string().transform((value, ctx) => {
  const includes = value.split(',');
  const allowedIncludes = new Set(['images', 'specifications']);

  if (
    includes.some((include) => !allowedIncludes.has(include)) ||
    new Set(includes).size !== includes.length
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'include deve conter images e/ou specifications, sem duplicados.',
    });
    return z.NEVER;
  }

  return includes as Array<'images' | 'specifications'>;
});

export const productDetailQuerySchema = z
  .object({
    include: productDetailIncludeSchema.optional(),
  })
  .strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type ProductDetailQuery = z.infer<typeof productDetailQuerySchema>;
