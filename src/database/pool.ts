import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env';

/**
 * Por que um Pool único e exportado como singleton?
 *
 * O Pool já gerencia internamente múltiplas conexões — não faz
 * sentido criar mais de um Pool na aplicação, isso apenas duplicaria
 * o número de conexões abertas com o Postgres sem nenhum benefício.
 * Um módulo Node.js só é executado uma vez e depois fica em cache
 * (require/import cache), então "export const pool" aqui garante que
 * toda a aplicação compartilha a mesma instância.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,

  // Máximo de conexões simultâneas que o pool pode abrir.
  // 10 é um valor conservador e seguro para começar; ajustamos
  // depois com base em métricas reais de carga, não por achismo.
  max: 10,

  // Tempo (ms) que uma conexão pode ficar ociosa no pool antes
  // de ser fechada. Evita manter conexões penduradas sem uso.
  idleTimeoutMillis: 30000,

  // Tempo (ms) que o pool espera para conseguir uma conexão
  // antes de desistir e lançar erro. Protege contra requisições
  // que ficariam "penduradas" indefinidamente se o banco estiver
  // sobrecarregado.
  connectionTimeoutMillis: 5000,
});

/**
 * Loga erros que acontecem em conexões OCIOSAS do pool (não durante
 * uma query ativa). Isso normalmente indica problema de rede ou o
 * Postgres derrubando a conexão do lado dele.
 *
 * Sem esse listener, um erro assim derrubaria o processo Node inteiro
 * (comportamento padrão do EventEmitter para eventos 'error' sem
 * listener). Com o listener, apenas logamos e o pool se recupera
 * sozinho na próxima query, abrindo uma nova conexão.
 */
pool.on('error', (err) => {
  console.error('Erro inesperado em conexão ociosa do pool Postgres:', err);
});

/**
 * Helper genérico para executar queries com tipagem forte no
 * retorno. O generic <T> permite que quem chama especifique o
 * formato esperado das linhas, em vez de receber "any".
 *
 * Exemplo de uso futuro (em um repository):
 *   const result = await query<{ id: string; nome: string }>(
 *     'SELECT id, nome FROM produto WHERE id = $1',
 *     [produtoId]
 *   );
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

/**
 * Empresta uma conexão dedicada do pool para operações que precisam
 * de múltiplos comandos na MESMA conexão — o caso clássico é
 * transações (BEGIN / COMMIT / ROLLBACK), que só fazem sentido se
 * todos os comandos rodarem na mesma sessão do Postgres.
 *
 * Quem chama esta função é responsável por chamar client.release()
 * no final (sempre em um finally), devolvendo a conexão ao pool.
 * Esquecer o release() é a causa nº1 de "pool esgotado" em produção.
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Encerra todas as conexões do pool de forma graciosa.
 * Usado no shutdown do servidor (ver server.ts) para garantir que,
 * ao derrubar a aplicação, não deixamos conexões "penduradas" no
 * Postgres — o que consumiria slots de conexão do banco à toa.
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
