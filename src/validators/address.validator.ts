import { z } from 'zod';
import { findProvinceByName, findMunicipalityInProvince } from '../data/angola-locations';

const labelSchema = z.string().trim().max(100, 'label deve ter no máximo 100 caracteres.');

const provinceSchema = z
  .string({ error: 'province é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'province não pode ser vazio.')
  .max(100, 'province deve ter no máximo 100 caracteres.');

const municipalitySchema = z
  .string({ error: 'municipality é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'municipality não pode ser vazio.')
  .max(100, 'municipality deve ter no máximo 100 caracteres.');

const neighborhoodSchema = z
  .string({ error: 'neighborhood é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'neighborhood não pode ser vazio.')
  .max(100, 'neighborhood deve ter no máximo 100 caracteres.');

const addressLineSchema = z
  .string({ error: 'address é obrigatório e deve ser texto.' })
  .trim()
  .min(1, 'address não pode ser vazio.')
  .max(500, 'address deve ter no máximo 500 caracteres.');

const referenceSchema = z.string().trim().max(500, 'reference deve ter no máximo 500 caracteres.');

/**
 * Latitude/longitude são OPCIONAIS (conforme decidido), mas quando
 * presentes precisam estar dentro do intervalo geograficamente
 * válido. -90/90 e -180/180 não são limites arbitrários — são os
 * extremos reais de latitude e longitude em qualquer ponto da Terra.
 * Validar isso aqui, ANTES de tocar no banco, evita que coordenadas
 * absurdas (ex: alguém envia 900 por engano) cheguem a ser gravadas.
 */
const latitudeSchema = z
  .number({ error: 'latitude deve ser um número.' })
  .min(-90, 'latitude deve estar entre -90 e 90.')
  .max(90, 'latitude deve estar entre -90 e 90.');

const longitudeSchema = z
  .number({ error: 'longitude deve ser um número.' })
  .min(-180, 'longitude deve estar entre -180 e 180.')
  .max(180, 'longitude deve estar entre -180 e 180.');

/**
 * Validação cruzada província <-> município, compartilhada entre
 * criação e atualização. Recebe um `RefinementCtx` do Zod para poder
 * anexar o erro ao CAMPO exato que falhou (`path`), em vez de um erro
 * genérico no objeto inteiro — isso é o que faz o cliente da API
 * receber `{ field: "municipality", message: "..." }` em vez de um
 * erro solto sem indicar onde está o problema.
 *
 * Por que uma função separada, chamada por `.superRefine()`, em vez
 * de dois `.refine()` independentes (um para province, outro para
 * municipality)?
 *
 * Porque a validação de município DEPENDE do resultado da validação
 * de província — não dá para saber se "Cazenga" é válido sem saber
 * primeiro que a província é "Luanda". `.refine()` isolados não
 * conseguem compartilhar esse contexto entre si; `.superRefine()`
 * recebe o objeto completo já validado nos schemas individuais,
 * permitindo essa checagem em sequência.
 */
function validateProvinceMunicipality(
  data: { province: string; municipality: string },
  ctx: z.RefinementCtx
): void {
  const province = findProvinceByName(data.province);

  if (!province) {
    ctx.addIssue({
      code: 'custom',
      path: ['province'],
      message: `"${data.province}" não corresponde a nenhuma das 21 províncias de Angola.`,
    });
    return;
  }

  const municipality = findMunicipalityInProvince(province, data.municipality);

  if (!municipality) {
    ctx.addIssue({
      code: 'custom',
      path: ['municipality'],
      message: `"${data.municipality}" não é um município da província "${province.name}".`,
    });
  }
}

/**
 * `.strict()` aqui segue o mesmo motivo já aplicado em
 * company.validator.ts: nunca deixar o Zod descartar silenciosamente
 * um campo que o cliente não deveria poder enviar (ex: tentar forçar
 * `isDefault: true` na criação, contornando a regra de negócio que
 * decide isso no service).
 */
export const createAddressSchema = z
  .object({
    label: labelSchema.optional(),
    province: provinceSchema,
    municipality: municipalitySchema,
    neighborhood: neighborhoodSchema,
    address: addressLineSchema,
    reference: referenceSchema.optional(),
    latitude: latitudeSchema.optional(),
    longitude: longitudeSchema.optional(),
  })
  .strict()
  .superRefine(validateProvinceMunicipality);

/**
 * No PATCH, `province` e `municipality` só podem ser enviados JUNTOS
 * ou NENHUM dos dois — nunca um sozinho. Se o cliente já mora em
 * "Cazenga, Luanda" e só quer atualizar o município para "Viana"
 * (ainda em Luanda), ele precisa reenviar `province: "Luanda"`
 * também. Por quê essa exigência, em vez de permitir atualizar só o
 * município e reaproveitar a província já salva no banco?
 *
 * Porque validar a COMBINAÇÃO exige que o validator (camada Zod,
 * sem acesso ao banco) enxergue os dois valores ao mesmo tempo. Se
 * ele só recebesse `municipality: "Viana"` sem a província, não
 * teria como saber se está validando contra Luanda ou contra
 * qualquer outra província que tenha um município chamado "Viana" —
 * essa ambiguidade é resolvida obrigando o par completo.
 */
export const updateAddressSchema = z
  .object({
    label: labelSchema.nullable().optional(),
    province: provinceSchema.optional(),
    municipality: municipalitySchema.optional(),
    neighborhood: neighborhoodSchema.optional(),
    address: addressLineSchema.optional(),
    reference: referenceSchema.nullable().optional(),
    latitude: latitudeSchema.nullable().optional(),
    longitude: longitudeSchema.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser enviado para atualização.',
  })
  .refine((data) => 'province' in data === 'municipality' in data, {
    message: 'province e municipality devem ser enviados juntos.',
    path: ['municipality'],
  })
  .superRefine((data, ctx) => {
    if (data.province !== undefined && data.municipality !== undefined) {
      validateProvinceMunicipality(
        { province: data.province, municipality: data.municipality },
        ctx
      );
    }
  });

export const addressIdParamSchema = z.object({
  id: z.uuid('id deve ser um UUID válido.'),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AddressIdParam = z.infer<typeof addressIdParamSchema>;
