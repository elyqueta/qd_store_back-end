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