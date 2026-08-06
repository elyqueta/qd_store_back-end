import 'dotenv/config';
import { z } from 'zod';

/**
 * Por que validar variáveis de ambiente com Zod?
 *
 * Sem isso, um erro de digitação numa variável (ex: "PROT" em vez de
 * "PORT", ou esquecer a DATABASE_URL) só aparece como um erro genérico
 * em algum ponto aleatório da aplicação — muitas vezes em produção,
 * na primeira requisição que depende daquela variável.
 *
 * Com essa validação rodando na inicialização, a aplicação recusa
 * subir se qualquer variável obrigatória estiver ausente ou no
 * formato errado, e o erro aponta exatamente qual variável e por quê.
 * Isso é o padrão "fail fast": falhar cedo e de forma clara é sempre
 * melhor do que falhar tarde e de forma confusa.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce.number({ error: 'PORT deve ser um número' }).int().positive().default(3000),

  // Connection string completa do PostgreSQL.
  // Formato: postgres://usuario:senha@host:porta/nome_do_banco
  DATABASE_URL: z
    .string({ error: 'DATABASE_URL é obrigatória' })
    .min(1, 'DATABASE_URL não pode ser vazia')
    .url('DATABASE_URL deve ser uma URL de conexão válida'),

  CORS_ORIGIN: z
    .string({ error: 'CORS_ORIGIN é obrigatória' })
    .min(1, 'CORS_ORIGIN não pode ser vazia'),

  RATE_LIMIT_WINDOW_MS: z.coerce
    .number({ error: 'RATE_LIMIT_WINDOW_MS deve ser um número' })
    .int()
    .positive()
    .default(900000),

  RATE_LIMIT_MAX: z.coerce
    .number({ error: 'RATE_LIMIT_MAX deve ser um número' })
    .int()
    .positive()
    .default(100),

  /**
   * Segredo usado para ASSINAR e VERIFICAR o access token (JWT).
   *
   * Por que exigir no mínimo 32 caracteres?
   *
   * Um JWT assinado com HS256 usa este valor como chave HMAC. Um
   * segredo curto (ex: "123456") é trivialmente quebrável por força
   * bruta offline — quem descobrir o segredo consegue forjar tokens
   * válidos para QUALQUER utilizador, incluindo administradores. 32
   * caracteres é o mínimo recomendado pela própria especificação
   * JWS (RFC 7518) para chaves HMAC-SHA256; na prática, deve ser
   * gerado com algo como `openssl rand -base64 48`, nunca digitado
   * manualmente.
   */
  JWT_SECRET: z
    .string({ error: 'JWT_SECRET é obrigatória' })
    .min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres.'),

  /**
   * Duração do access token. Formato aceite pela biblioteca
   * `jsonwebtoken` (ex: "15m", "1h", "7d").
   *
   * Por que curto (15 minutos por padrão)?
   *
   * O access token NÃO é revogável — uma vez emitido, continua
   * válido até expirar, mesmo que o utilizador faça logout, porque
   * ele nunca é consultado no banco (essa é a vantagem de
   * performance do JWT stateless). Se ele for roubado, o prejuízo
   * fica limitado à janela de 15 minutos. É o refresh token
   * (guardado em SESSAO, esse sim revogável) que permite renovar o
   * access token sem pedir login de novo.
   */
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),

  /**
   * Duração do refresh token, em dias. Usado para calcular
   * `session.expires_at` no momento da criação da sessão.
   */
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce
    .number({ error: 'JWT_REFRESH_EXPIRES_IN_DAYS deve ser um número' })
    .int()
    .positive()
    .default(7),

  /**
   * Custo do algoritmo bcrypt (número de rounds).
   *
   * Por que 12, e por que isto precisa ser configurável?
   *
   * Cada incremento dobra o tempo de cálculo do hash. 12 rounds é o
   * equilíbrio atual recomendado entre segurança (resistência a
   * força bruta) e performance (não travar o login por 2 segundos).
   * Mantemos como variável de ambiente, e não uma constante fixa no
   * código, porque hardware de servidor melhora com o tempo — daqui
   * a alguns anos, 12 rounds pode ficar barato demais de quebrar, e
   * subir esse número não deve exigir alterar código, só configuração.
   */
  BCRYPT_SALT_ROUNDS: z.coerce
    .number({ error: 'BCRYPT_SALT_ROUNDS deve ser um número' })
    .int()
    .min(10, 'BCRYPT_SALT_ROUNDS deve ser no mínimo 10 por segurança.')
    .max(15, 'BCRYPT_SALT_ROUNDS acima de 15 é impraticavelmente lento.')
    .default(12),
});

/**
 * z.infer extrai o tipo TypeScript diretamente do schema Zod.
 * Isso significa que o tipo "Env" abaixo NUNCA fica dessincronizado
 * do schema de validação — se alguém adicionar um campo no schema,
 * o tipo se atualiza sozinho, sem duplicar a definição manualmente.
 */
export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\nErro na configuração de variáveis de ambiente:\n');

    for (const issue of result.error.issues) {
      const campo = issue.path.join('.') || '(desconhecido)';
      console.error(`  • ${campo}: ${issue.message}`);
    }

    console.error(
      '\nVerifique o arquivo .env (use .env.example como referência) e tente novamente.\n'
    );

    // Encerra o processo imediatamente. A aplicação NUNCA deve subir
    // com configuração inválida.
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();