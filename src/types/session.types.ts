/**
 * Tipos relacionados à entidade SESSION (tabela `session`).
 *
 * Guarda o refresh token (como hash, nunca em texto simples) de cada
 * dispositivo/sessão ativa de um utilizador. É esta tabela que torna
 * possível revogar acesso (logout real) sem esperar o access token
 * expirar sozinho.
 */

export interface SessionRow {
  id: string;
  id_user: string;
  token_hash: string;
  device: string | null;
  ip: string | null;
  expires_at: Date;
  created_at: Date;
}

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  device: string | null;
  ip: string | null;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Dados necessários para o REPOSITORY criar uma nova sessão.
 * `tokenHash` chega já calculado pelo service (hash do refresh token
 * gerado) — o repository nunca vê o refresh token em texto simples.
 */
export interface CreateSessionData {
  userId: string;
  tokenHash: string;
  device?: string | null;
  ip?: string | null;
  expiresAt: Date;
}
