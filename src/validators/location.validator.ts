import { z } from 'zod';

/**
 * Valida o parâmetro `:province` da rota
 * GET /api/locations/provinces/:province/municipalities.
 *
 * Aqui validamos apenas FORMATO (string não vazia, com um limite
 * razoável de tamanho) — não validamos se a província de facto
 * existe entre as 21. Essa segunda verificação é responsabilidade do
 * controller, que consulta `findProvinceBySlug` e decide entre 200 e
 * 404. Misturar as duas coisas neste schema forçaria o Zod a
 * conhecer o dataset de províncias, o que não é papel dele — Zod
 * valida FORMA, não regra de negócio "isto existe no sistema".
 */
export const provinceSlugParamSchema = z.object({
  province: z
    .string({ error: 'province é obrigatório.' })
    .trim()
    .toLowerCase()
    .min(1, 'province não pode ser vazio.')
    .max(50, 'province deve ter no máximo 50 caracteres.'),
});

export type ProvinceSlugParam = z.infer<typeof provinceSlugParamSchema>;
