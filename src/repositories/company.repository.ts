import { query } from '../database/pool';
import { CompanyWithUsers, CompanyWithUsersRow } from '../types/company.types';

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
 * Lista todas as empresas, cada uma já com o array dos seus
 * utilizadores vinculados embutido.
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

export const companyRepository = {
  findAllWithUsers,
};