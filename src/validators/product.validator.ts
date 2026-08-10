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
const priceSchema = z
  .number({ error: 'price é obrigatório e deve ser um número.' })
  .positive('price deve ser maior que zero.');

const originalPriceSchema = z
  .number({ error: 'originalPrice deve ser um número.' })
  .positive('originalPrice deve ser maior que zero.');

const categoryIdSchema = z.uuid('categoryId deve ser um UUID válido.');

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
  id: z.uuid('id deve ser um UUID válido.'),
});

/**
 * Query params de GET /api/products: paginação + filtros.
 *
 * z.coerce.number() é necessário porque query strings da URL SEMPRE
 * chegam como string ("?page=2"), nunca como number nativo — mesma
 * técnica já usada em config/env.ts para PORT e RATE_LIMIT_MAX.
 */
export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100, 'limit máximo é 100.').default(20),
  categoryId: z.uuid('categoryId deve ser um UUID válido.').optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
