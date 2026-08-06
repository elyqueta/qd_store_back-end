import { z } from 'zod';

/**
 * Schemas de validação para o fluxo de autenticação.
 *
 * Por que a senha tem regras mais rígidas do que um campo de texto
 * comum?
 *
 * Diferente de "label" numa categoria, a senha é o único fator que
 * protege a conta do utilizador. Regras fracas (ex: aceitar "123")
 * tornam contas vulneráveis a força bruta mesmo com bcrypt bem
 * configurado do lado do servidor — a defesa em profundidade começa
 * já na entrada.
 */
const passwordSchema = z
  .string({ error: 'password é obrigatória e deve ser texto.' })
  .min(8, 'password deve ter no mínimo 8 caracteres.')
  .max(72, 'password deve ter no máximo 72 caracteres.')
  .regex(/[a-z]/, 'password deve conter pelo menos uma letra minúscula.')
  .regex(/[A-Z]/, 'password deve conter pelo menos uma letra maiúscula.')
  .regex(/[0-9]/, 'password deve conter pelo menos um número.');

/**
 * Nota sobre o limite de 72 caracteres: não é um capricho — é uma
 * limitação real do próprio algoritmo bcrypt, que ignora
 * silenciosamente qualquer caractere além do 72º. Validar isso aqui
 * evita a falsa sensação de segurança de uma senha "longa" cujos
 * caracteres extras nunca chegam a ser considerados no hash.
 */

const emailSchema = z
  .email('email deve ser um endereço válido.')
  .trim()
  .toLowerCase()
  .max(255, 'email deve ter no máximo 255 caracteres.');

const fullNameSchema = z
  .string({ error: 'full_name é obrigatório e deve ser texto.' })
  .trim()
  .min(3, 'full_name deve ter no mínimo 3 caracteres.')
  .max(150, 'full_name deve ter no máximo 150 caracteres.');

const phoneSchema = z
  .string({ error: 'phone é obrigatório e deve ser texto.' })
  .trim()
  .min(9, 'phone deve ter no mínimo 9 caracteres.')
  .max(20, 'phone deve ter no máximo 20 caracteres.');

const nifSchema = z.string().trim().max(20, 'nif deve ter no máximo 20 caracteres.');

/**
 * Schema de registo (POST /api/auth/register).
 *
 * accountType aceita apenas 'personal' por agora — 'business' fica
 * bloqueado neste endpoint de propósito: uma conta empresarial
 * precisa também de criar/associar uma COMPANY (tabela company +
 * user_company), o que é um fluxo à parte, ainda não implementado.
 * Isto evita criar um USER com account_type = 'business' órfão, sem
 * nenhuma empresa associada — um estado inconsistente que o modelo
 * de dados não previne sozinho.
 */
export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  nif: nifSchema.optional(),
  accountType: z.literal('personal', {
    error: () =>
      'accountType deve ser "personal". Contas "business" ainda não são suportadas por este endpoint.',
  }),
});

/** Schema de login (POST /api/auth/login). */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'password é obrigatória.' }).min(1, 'password não pode ser vazia.'),
});

/**
 * Schema de refresh (POST /api/auth/refresh).
 *
 * O refresh token não passa por regras de formato de senha/email —
 * é uma string opaca gerada pelo próprio servidor, então só
 * validamos que ela existe e não está vazia.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ error: 'refreshToken é obrigatório.' })
    .min(1, 'refreshToken não pode ser vazio.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
