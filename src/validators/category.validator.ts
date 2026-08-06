import { z } from 'zod';

/**
 * Por que centralizar `label` e `icon` como schemas reutilizáveis
 * em vez de repetir `.string().max(100)` em cada schema?
 *
 * Porque a mesma regra de negócio ("label tem no máximo 100
 * caracteres", espelhando VARCHAR(100) na tabela) é usada tanto na
 * criação quanto na atualização. Definir uma vez e reutilizar evita
 * que as duas regras divirjam silenciosamente no futuro.
 */
const labelSchema = z
  .string({ error: 'label é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'label não pode ser vazio.')
  .max(100, 'label deve ter no máximo 100 caracteres.');

/**
 * `icon` é VARCHAR(10) na tabela — normalmente guarda um único
 * emoji ou um código curto de ícone, nunca um nome de ficheiro longo.
 * O limite de 10 caracteres aqui espelha exatamente a coluna,
 * evitando que a aplicação tente inserir um valor que o Postgres
 * rejeitaria de qualquer forma — só que com um erro melhor,
 * detectado ANTES de tocar no banco.
 */
const iconSchema = z.string().trim().max(10, 'icon deve ter no máximo 10 caracteres.');

/**
 * Schema de criação.
 *
 * Note que NÃO validamos `slug` aqui — ele nunca chega como input
 * do cliente. É gerado pelo service a partir do `label`, conforme
 * decidido. `id`, `createdAt` e `updatedAt` também estão ausentes
 * pelo mesmo motivo: são responsabilidade do banco de dados.
 */
export const createCategorySchema = z.object({
  label: labelSchema,
  icon: iconSchema.optional(),
});

/**
 * Schema de atualização parcial (PATCH).
 *
 * Duas diferenças importantes em relação ao schema de criação:
 *
 * 1. `label` é opcional aqui — um PATCH pode querer alterar só o
 *    `icon`, sem reenviar o label inteiro.
 *
 * 2. `icon` aceita explicitamente `.nullable()` além de `.optional()`.
 *    Isso permite três estados distintos no payload, coerente com o
 *    UpdateCategoryInput que desenhámos: campo ausente (não mexer),
 *    `null` (remover o ícone), ou uma string (definir/substituir).
 *
 * O `.refine()` no final impede o caso degenerado de um PATCH vazio
 * `{}` — se o cliente não está a mudar nada, a requisição não faz
 * sentido, e é melhor rejeitá-la cedo com uma mensagem clara do que
 * deixá-la seguir até o banco e gastar uma query inteira "atualizando
 * nada" (o UPDATE ainda dispararia o trigger de `updated_at`, o que
 * seria enganoso: pareceria que algo mudou quando na verdade não).
 */
export const updateCategorySchema = z
  .object({
    label: labelSchema.optional(),
    icon: iconSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo (label ou icon) deve ser enviado para atualização.',
  });

/**
 * Schema para validar o `:id` recebido via parâmetro de rota
 * (ex: GET /api/categories/:id). Como a coluna `id` é do tipo uuid
 * no Postgres, validamos o formato ANTES de sequer tentar consultar
 * o banco — um id malformado (ex: "abc123") nunca vai encontrar
 * nenhuma linha, mas sem essa validação a query ainda seria
 * executada desnecessariamente, e o Postgres devolveria um erro de
 * tipo menos claro para o cliente final.
 */
export const categoryIdParamSchema = z.object({
  id: z.uuid('id deve ser um UUID válido.'),
});

/**
 * Tipos derivados diretamente dos schemas acima — nunca escritos
 * manualmente. Isso garante que tipo e validação NUNCA podem
 * divergir: qualquer mudança de regra no schema atualiza o tipo
 * TypeScript automaticamente, sem esforço adicional.
 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;
