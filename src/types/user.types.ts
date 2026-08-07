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

/**
 * Valores possíveis de USERS.role (enum user_role no Postgres).
 *
 * Atenção: não confundir com user_company.role, que é o CARGO do
 * utilizador dentro de uma empresa específica (ex.: "Gerente",
 * "Comprador") — um VARCHAR livre, sem relação nenhuma com este
 * enum. Este campo (`UserRole`) responde a uma pergunta diferente:
 * "que nível de acesso este utilizador tem na PLATAFORMA".
 */
export type UserRole = 'customer' | 'admin';

/** Formato exato devolvido pelo Postgres. Só o repository conhece isto. */
export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string;
  nif: string | null;
  account_type: AccountType;
  role: UserRole;
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
  role: UserRole;
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
 *
 * `role` é OPCIONAL e propositadamente não faz parte de
 * RegisterInput (validators/auth.validator.ts) — o cliente nunca
 * consegue enviá-lo pela API pública. Só existe para permitir que o
 * script de seed (scripts/seedAdmin.ts) crie o primeiro admin
 * diretamente via repository, sem passar pelo fluxo HTTP de
 * registo. Quando ausente, o repository assume 'customer'.
 */
export interface CreateUserData {
  fullName: string;
  email: string;
  passwordHash: string;
  phone: string;
  nif?: string | null;
  accountType: AccountType;
  role?: UserRole;
}