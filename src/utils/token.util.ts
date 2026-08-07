import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AccountType, UserRole } from '../types/user.types';

/**
 * Adicionamos `role` ao payload pelo MESMO motivo que já guardamos
 * `email` e `accountType`: permitir que o middleware `requireRole`
 * (ver abaixo) decida se um utilizador é admin sem consultar o
 * banco em cada requisição — mantendo a vantagem de performance do
 * JWT stateless já discutida.
 */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  accountType: AccountType;
  role: UserRole;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}