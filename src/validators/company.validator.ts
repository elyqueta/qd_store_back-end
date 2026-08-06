// src/validators/company.validator.ts
import { z } from 'zod';

const nameSchema = z
  .string({ error: 'name é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'name não pode ser vazio.')
  .max(200, 'name deve ter no máximo 200 caracteres.');

const nifSchema = z
  .string({ error: 'nif é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'nif não pode ser vazio.')
  .max(20, 'nif deve ter no máximo 20 caracteres.');

const sectorSchema = z.string().trim().max(100, 'sector deve ter no máximo 100 caracteres.');

/**
 * .strict() aqui garante que um campo inesperado no CORPO da
 * criação (ex.: um "status" que o cliente tente forçar) também é
 * rejeitado, e não apenas descartado em silêncio.
 */
export const createCompanySchema = z
  .object({
    name: nameSchema,
    nif: nifSchema,
    sector: sectorSchema.optional(),
  })
  .strict();

/**
 * "nif" e "status" continuam FORA das properties do schema (ver
 * explicação já dada: NIF é identificador fiscal imutável, status
 * só muda via soft delete). A diferença agora é o `.strict()`: sem
 * ele, um PATCH { nif: "..." } seria silenciosamente IGNORADO pelo
 * Zod (comportamento padrão de z.object() é descartar chaves não
 * declaradas) — o cliente recebia 200 achando que alterou o NIF,
 * quando na verdade nada mudou. Com `.strict()`, esse mesmo payload
 * passa a ser REJEITADO com 422, deixando explícito para o cliente
 * que "nif" não é um campo editável neste endpoint, em vez de
 * mascarar o erro como sucesso.
 */
export const updateCompanySchema = z
  .object({
    name: nameSchema.optional(),
    sector: sectorSchema.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo (name ou sector) deve ser enviado para atualização.',
  });

export const companyIdParamSchema = z.object({
  id: z.uuid('id deve ser um UUID válido.'),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyIdParam = z.infer<typeof companyIdParamSchema>;