import bcrypt from 'bcrypt';
import { env } from '../config/env';

/**
 * Gera o hash bcrypt de uma senha em texto simples.
 *
 * `env.BCRYPT_SALT_ROUNDS` (validado no env.ts, padrão 12) controla
 * o custo computacional. O bcrypt já gera e embute o salt sozinho —
 * não precisamos gerar nem guardar um salt separado, ele vem
 * codificado dentro do próprio hash resultante.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
}

/**
 * Compara uma senha em texto simples com um hash já guardado.
 *
 * NUNCA comparar hashes com `===` ou `hash1 === hash2` — o bcrypt
 * embute o salt de forma que dois hashes da MESMA senha nunca são
 * idênticos entre si. `bcrypt.compare` sabe extrair o salt do hash
 * armazenado e refazer o cálculo corretamente antes de comparar.
 */
export async function comparePassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}