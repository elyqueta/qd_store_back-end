import { query } from '../database/pool';
import {
  Company,
  CompanyRow,
  CompanyWithUsers,
  CompanyWithUsersRow,
  CreateCompanyData,
} from '../types/company.types';
import { UpdateCompanyInput } from '../validators/company.validator';
import { ConflictError } from '../errors';

/** Código SQLSTATE do Postgres para violação de UNIQUE constraint. */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * Type guard para erros vindos do driver `pg`.
 *
 * Mesma justificativa já dada em category.repository.ts: o
 * TypeScript, em modo strict, tipa o `catch` como `unknown` — não
 * podemos acessar `.code` sem antes confirmar em runtime que o
 * objeto realmente tem essa forma.
 */
function isPgError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

/**
 * Converte uma linha crua do Postgres (snake_case) no formato de
 * domínio (camelCase). Único ponto da aplicação que conhece os dois
 * formatos ao mesmo tempo — todo o resto do código só vê `Company`.
 */
function toCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    nif: row.nif,
    sector: row.sector,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCompanyWithUsers(row: CompanyWithUsersRow): CompanyWithUsers {
  return {
    id: row.id,
    name: row.name,
    nif: row.nif,
    sector: row.sector,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    users: row.users,
  };
}

/**
 * Insere uma nova empresa.
 *
 * O `RETURNING` evita uma segunda query — o Postgres já devolve a
 * linha completa (id, status='active' por DEFAULT, created_at,
 * updated_at) na mesma viagem ao banco que fez o INSERT. Mesma
 * técnica já usada em category.repository.ts.
 */
async function create(data: CreateCompanyData): Promise<Company> {
  try {
    const result = await query<CompanyRow>(
      `INSERT INTO company (name, nif, sector)
       VALUES ($1, $2, $3)
       RETURNING id, name, nif, sector, status, created_at, updated_at`,
      [data.name, data.nif, data.sector ?? null]
    );

    // result.rows[0] é seguro: um INSERT bem-sucedido com RETURNING
    // sempre devolve exatamente uma linha.
    return toCompany(result.rows[0] as CompanyRow);
  } catch (err) {
    if (isPgError(err) && err.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError(`Já existe uma empresa registada com o NIF "${data.nif}".`);
    }
    // Qualquer outro erro sobe sem tratamento especial — vira 500
    // genérico no errorHandler global, comportamento correto para
    // falhas que não sabemos explicar ao cliente.
    throw err;
  }
}

/**
 * Lista todas as empresas, ordenadas por nome.
 *
 * Esta é a versão "simples" (sem os utilizadores embutidos) — usada
 * pela rota pública/autenticada GET /api/companies. A versão com
 * json_agg (findAllWithUsers, abaixo) é reservada ao endpoint
 * administrativo, que tem um propósito diferente: auditoria de quem
 * está vinculado a cada empresa.
 */
async function findAll(): Promise<Company[]> {
  const result = await query<CompanyRow>(
    `SELECT id, name, nif, sector, status, created_at, updated_at
     FROM company
     ORDER BY name ASC`
  );

  return result.rows.map(toCompany);
}

/**
 * Busca uma empresa por id.
 *
 * Devolve `Company | null` em vez de lançar erro — "não encontrado"
 * é um resultado válido de uma busca, não uma falha de acesso a
 * dados. É o service (company.service.ts) quem decide transformar
 * isso num HTTP 404, através de NotFoundError.
 */
async function findById(id: string): Promise<Company | null> {
  const result = await query<CompanyRow>(
    `SELECT id, name, nif, sector, status, created_at, updated_at
     FROM company
     WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  return row ? toCompany(row) : null;
}

/**
 * Atualiza parcialmente uma empresa (PATCH).
 *
 * Mesmo desafio já resolvido em category.repository.ts: o
 * UpdateCompanyInput é PARCIAL, então montamos a cláusula SET
 * dinamicamente, incluindo só os campos que de facto vieram no
 * payload.
 *
 * `nif` propositadamente NUNCA aparece aqui — é imutável após a
 * criação (decisão já documentada em company.validator.ts, reforçada
 * pelo `.strict()` no schema Zod, que rejeita com 422 qualquer
 * tentativa de enviá-lo no PATCH).
 *
 * `'sector' in data` (em vez de `data.sector !== undefined`) segue a
 * mesma técnica de `icon` em category.repository.ts: distingue
 * "campo ausente" (não mexer) de "campo enviado como null" (limpar o
 * setor), honrando a intenção desenhada no schema Zod
 * (`.nullable().optional()`).
 */
async function update(id: string, data: UpdateCompanyInput): Promise<Company | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex}`);
    values.push(data.name);
    paramIndex += 1;
  }

  if ('sector' in data) {
    fields.push(`sector = $${paramIndex}`);
    values.push(data.sector);
    paramIndex += 1;
  }

  // Defesa em profundidade: o validator já bloqueia um PATCH vazio
  // via .refine(), mas o repository não deve confiar cegamente que
  // quem o chama sempre validou tudo primeiro.
  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);

  const result = await query<CompanyRow>(
    `UPDATE company
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, nif, sector, status, created_at, updated_at`,
    values
  );

  const row = result.rows[0];
  return row ? toCompany(row) : null;
}

/**
 * Desativa uma empresa — SOFT DELETE, não DELETE físico.
 *
 * Por que soft delete, e não DELETE FROM company?
 *
 * Uma empresa tem histórico ligado a ela (encomendas via
 * orders.id_company, configurações de pagamento, utilizadores
 * vinculados via user_company). Apagar a linha fisicamente destruiria
 * esse histórico ou dispararia CASCADE indesejado em cadeia. Marcar
 * como 'inactive' preserva os dados para auditoria/histórico, e
 * qualquer rota que precise "esconder" empresas inactivas simplesmente
 * filtra por status = 'active' na query — decisão já registada nas
 * notas do projeto.
 *
 * O `WHERE status != 'inactive'` no UPDATE é o que torna esta
 * operação IDEMPOTENTE e permite diferenciar dois casos no service:
 *   - id não existe          -> rowCount = 0 -> false
 *   - id existe mas já estava inactive -> rowCount = 0 -> false
 * Ambos os casos resultam em `false` aqui, e company.service.ts já
 * trata os dois com a mesma mensagem ("não encontrada ou já está
 * inactiva") — o repository não precisa distinguir os dois cenários,
 * só informar se a operação teve efeito ou não.
 */
async function deactivate(id: string): Promise<boolean> {
  const result = await query(
    `UPDATE company
     SET status = 'inactive'
     WHERE id = $1 AND status != 'inactive'`,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Lista todas as empresas, cada uma já com o array dos seus
 * utilizadores vinculados embutido.
 *
 * Reservada ao endpoint administrativo (GET /api/admin/companies).
 * Ver explicação completa do uso de json_agg diretamente nos
 * comentários originais desta função, mantidos abaixo.
 *
 * Por que agregar com json_agg dentro do SQL, em vez de fazer uma
 * query para as empresas e depois, no Node, uma query por empresa
 * para buscar os utilizadores dela?
 *
 * A segunda abordagem é o clássico problema "N+1 queries": para 20
 * empresas, seriam 21 idas ao banco (1 + 20), cada uma com o seu
 * próprio round-trip de rede. json_agg resolve isto numa ÚNICA
 * query — o próprio Postgres monta o array de utilizadores por
 * empresa, agrupado via GROUP BY c.id, e devolve tudo já pronto.
 *
 * FILTER (WHERE u.id IS NOT NULL): sem isto, uma empresa SEM
 * nenhum utilizador vinculado (LEFT JOIN não encontra par) geraria
 * um array com um único objeto todo com valores NULL
 * (`[{"id": null, "fullName": null, ...}]`), em vez de um array
 * vazio `[]`. O FILTER garante que só entram no agregado as linhas
 * onde o JOIN de facto encontrou um utilizador.
 *
 * COALESCE(..., '[]'): cobre o caso em que FILTER remove TODAS as
 * linhas (empresa sem nenhum utilizador) — nesse cenário json_agg
 * devolveria NULL em vez de um array vazio; o COALESCE substitui
 * por '[]' explicitamente.
 */
async function findAllWithUsers(): Promise<CompanyWithUsers[]> {
  const result = await query<CompanyWithUsersRow>(
    `SELECT
       c.id, c.name, c.nif, c.sector, c.status, c.created_at, c.updated_at,
       COALESCE(
         json_agg(
           json_build_object(
             'id', u.id,
             'fullName', u.full_name,
             'email', u.email,
             'companyRole', uc.role
           )
           ORDER BY u.full_name
         ) FILTER (WHERE u.id IS NOT NULL),
         '[]'
       ) AS users
     FROM company c
     LEFT JOIN user_company uc ON uc.id_company = c.id
     LEFT JOIN users u ON u.id = uc.id_user
     GROUP BY c.id
     ORDER BY c.name ASC`
  );

  return result.rows.map(toCompanyWithUsers);
}

/**
 * Exportado como objeto (não como funções soltas) para que, no
 * service, a origem de cada chamada fique explícita na leitura do
 * código: `companyRepository.findById(...)` — mesmo princípio já
 * aplicado em category.repository.ts.
 */
export const companyRepository = {
  create,
  findAll,
  findById,
  update,
  deactivate,
  findAllWithUsers,
};