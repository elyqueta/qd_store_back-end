import { z } from 'zod';

const roleSchema = z.string().trim().max(100, 'role deve ter no máximo 100 caracteres.');

/**
 * companyId NÃO entra aqui — vem sempre do parâmetro de rota
 * (:companyId), nunca do corpo. O único dado que o cliente envia no
 * corpo é QUEM está a associar (userId) e QUAL o cargo (role).
 */
export const createUserCompanySchema = z.object({
  userId: z.uuid('userId deve ser um UUID válido.'),
  role: roleSchema.optional(),
});

/**
 * "role" é o único campo desta associação além das chaves — por
 * isso o PATCH exige-o sempre presente (sem .optional() aqui), em
 * vez de usar o padrão de "pelo menos um campo" do resto da API:
 * com um único campo possível, torná-lo opcional tornaria um PATCH
 * vazio {} tecnicamente válido, o que não faz sentido.
 */
export const updateUserCompanySchema = z.object({
  role: roleSchema.nullable(),
});

export const companyIdParamOnlySchema = z.object({
  companyId: z.uuid('companyId deve ser um UUID válido.'),
});

export const userCompanyParamSchema = z.object({
  companyId: z.uuid('companyId deve ser um UUID válido.'),
  userId: z.uuid('userId deve ser um UUID válido.'),
});

export type CreateUserCompanyInput = z.infer<typeof createUserCompanySchema>;
export type UpdateUserCompanyInput = z.infer<typeof updateUserCompanySchema>;
export type CompanyIdParamOnly = z.infer<typeof companyIdParamOnlySchema>;
export type UserCompanyParam = z.infer<typeof userCompanyParamSchema>;
