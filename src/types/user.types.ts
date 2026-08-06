/**
 * Tipos relacionados à entidade USERS (tabela `users`).
 *
 * Mesma lógica já aplicada em category.types.ts: separar o formato
 * cru do banco (snake_case, UserRow) do formato de domínio
 * (camelCase, User) usado pelo resto da aplicação.
 *
 * A diferença importante aqui é de SEGURANÇA, não só de estilo:
 * `User` nunca contém `password_hash`. Só `UserWithPasswordHash`
 * contém, e esse tipo é usado exclusivamente dentro da fronteira de
 * autenticação (repository de auth + service de auth), nunca
 * devolvido por um controller.
 */

/** Valores possíveis de USERS.account_type (enum account_type no Postgres). */
export type AccountType = 'personal' | 'business';

/** Valores possíveis de USERS.status (enum user_status no Postgres). */
export type UserStatus = 'active' | 'inactive' | 'banned';

/** Formato exato devolvido pelo Postgres. Só o repository conhece isto. */
export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string;
  nif: string | null;
  account_type: AccountType;
  status: UserStatus;
  deactivated_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Formato de domínio SEGURO — é o que service, controller e resposta
 * HTTP enxergam. Note a AUSÊNCIA deliberada de password_hash.
 */
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nif: string | null;
  accountType: AccountType;
  status: UserStatus;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Formato usado APENAS no fluxo de login, para comparar a senha
 * enviada com o hash guardado. Nunca deve atravessar a fronteira do
 * auth.service.ts — o service extrai o User seguro dele e descarta
 * o resto antes de devolver qualquer coisa ao controller.
 */
export interface UserWithPasswordHash extends User {
  passwordHash: string;
}

/**
 * Dados necessários para o REPOSITORY inserir um novo utilizador.
 * `passwordHash` chega aqui já com o hash calculado pelo service
 * (via bcrypt) — o repository nunca lida com senha em texto simples,
 * nem sabe que bcrypt existe.
 */
export interface CreateUserData {
  fullName: string;
  email: string;
  passwordHash: string;
  phone: string;
  nif?: string | null;
  accountType: AccountType;
}