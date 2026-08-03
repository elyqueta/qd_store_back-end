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

  /**
   * CORS_ORIGIN: lista de origens (front-ends) autorizadas a
   * consumir esta API a partir do browser.
   *
   * Vem como string simples no .env (separada por vírgulas) porque
   * variáveis de ambiente só suportam texto puro. Aqui transformamos
   * essa string numa lista de URLs já "limpa" (sem espaços, sem
   * entradas vazias), para que o resto da aplicação (src/config/cors.ts)
   * trabalhe direto com um array, sem repetir esse parsing em outro
   * lugar.
   *
   * Exemplo no .env:
   *   CORS_ORIGIN=http://localhost:5173,https://qd-store.vercel.app
   */
  CORS_ORIGIN: z
    .string({ error: 'CORS_ORIGIN é obrigatória' })
    .min(1, 'CORS_ORIGIN não pode ser vazia')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    ),

  /**
   * Janela de tempo (ms) usada pelo express-rate-limit para contar
   * requisições de um mesmo cliente. Default: 15 minutos.
   */
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number({ error: 'RATE_LIMIT_WINDOW_MS deve ser um número' })
    .int()
    .positive()
    .default(15 * 60 * 1000),

  /**
   * Número máximo de requisições permitidas por IP dentro da janela
   * acima. Default: 100 requisições / 15 minutos — generoso o
   * suficiente para uso normal, mas suficiente para barrar abuso
   * grosseiro (scraping agressivo, brute-force simples).
   */
  RATE_LIMIT_MAX: z.coerce
    .number({ error: 'RATE_LIMIT_MAX deve ser um número' })
    .int()
    .positive()
    .default(100),
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