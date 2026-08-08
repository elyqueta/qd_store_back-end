/**
 * Tipos relacionados à entidade COMPANY e à listagem administrativa
 * de empresas com os seus utilizadores vinculados (via USER_COMPANY).
 *
 * `companyRole` aqui corresponde a user_company.role no banco — o
 * CARGO do utilizador na empresa (ex.: "Gerente"). Chamamos de
 * `companyRole`, e não apenas `role`, para nunca confundir com
 * UserRole (customer/admin) de user.types.ts — são dois conceitos
 * completamente diferentes que, por acaso, têm o mesmo nome de
 * coluna em tabelas diferentes.
 */

export type CompanyStatus = 'active' | 'inactive' | 'banned';

export interface CompanyRow {
  id: string;
  name: string;
  nif: string;
  sector: string | null;
  status: CompanyStatus;
  created_at: Date;
  updated_at: Date;
}

/**
 * Formato de um utilizador vinculado, já no shape que a query SQL
 * devolve dentro do array JSON agregado (ver company.repository.ts)
 * — por isso já vem em camelCase, mesmo sendo "row": é o próprio
 * Postgres, via json_build_object, quem monta este formato.
 */
export interface CompanyUserRow {
  id: string;
  fullName: string;
  email: string;
  companyRole: string | null;
}

export interface CompanyWithUsersRow extends CompanyRow {
  users: CompanyUserRow[];
}

export interface Company {
  id: string;
  name: string;
  nif: string;
  sector: string | null;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyUser {
  id: string;
  fullName: string;
  email: string;
  companyRole: string | null;
}

export interface CompanyWithUsers extends Company {
  users: CompanyUser[];
}

/**
 * Dados necessários para o REPOSITORY inserir uma nova empresa.
 *
 * Note a ausência de `status`: toda empresa nasce com
 * status = 'active' por DEFAULT na própria tabela (ver
 * migrations/1739900000000_baseline-schema.js) — o repository não
 * precisa (e não deve) decidir esse valor no INSERT. Isso evita que
 * amanhã alguém, por engano, permita ao cliente criar uma empresa já
 * 'inactive' ou 'banned' através de uma mudança descuidada no
 * validator.
 *
 * `sector` é opcional/nulo pelo mesmo motivo já documentado em
 * CreateCategoryData para `icon`: é um campo genuinamente opcional
 * no modelo de dados (coluna sem NOT NULL).
 */
export interface CreateCompanyData {
  name: string;
  nif: string;
  sector?: string | null;
}