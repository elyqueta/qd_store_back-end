import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AccountType } from '../types/user.types';

/**
 * Formato do payload do access token (JWT).
 *
 * `sub` (subject) é o nome de campo padrão da especificação JWT
 * (RFC 7519) para "de quem é este token" — usamos o id do
 * utilizador. Manter o nome `sub`, em vez de inventar `userId` aqui,
 * facilita a interoperabilidade caso outra ferramenta (ex: um
 * API Gateway) precise inspecionar o token no futuro.
 *
 * Guardamos `email` e `accountType` DENTRO do token de propósito:
 * assim, rotas que só precisam saber "quem é" e "que tipo de conta"
 * não precisam consultar o banco a cada requisição — é exatamente a
 * vantagem de performance do JWT stateless que expliquei antes.
 */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  accountType: AccountType;
}

/**
 * Assina um novo access token.
 *
 * O cast em `expiresIn` existe porque a tipagem da biblioteca
 * `jsonwebtoken` espera um formato literal muito específico
 * (ex: "15m", "1h") que o TypeScript não consegue inferir a partir
 * de uma `string` genérica vinda do `env.ts`. Isto não é um "any"
 * disfarçado — é um cast pontual e seguro, porque a validação real
 * do FORMATO já seria rejeitada em runtime pela própria biblioteca
 * se `JWT_ACCESS_EXPIRES_IN` estivesse mal configurada.
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verifica e decodifica um access token.
 *
 * `jwt.verify` já faz duas coisas em uma chamada: confirma que a
 * assinatura bate com JWT_SECRET (ou seja, que o token não foi
 * forjado nem alterado) E confirma que ele ainda não expirou. Se
 * qualquer uma dessas checagens falhar, a função lança uma exceção
 * (`JsonWebTokenError` ou `TokenExpiredError`) — não devolve `null`
 * nem `false`. Quem chamar esta função precisa estar preparado para
 * o `throw` (o middleware de autenticação, no próximo passo, vai
 * tratar isso).
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

/**
 * Gera um refresh token opaco — uma string aleatória sem nenhuma
 * estrutura interna (ao contrário do JWT, não carrega payload
 * decodificável). 64 bytes (512 bits) tornam adivinhação por força
 * bruta computacionalmente inviável.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Calcula o hash SHA-256 de um token, para guardar em
 * `session.token_hash`.
 *
 * Por que SHA-256 e não bcrypt aqui? Ver explicação acima da
 * mensagem — resumindo: precisamos de um hash DETERMINÍSTICO (o
 * mesmo input sempre gera o mesmo output) para poder localizar a
 * sessão no banco com `WHERE token_hash = $1`. bcrypt não serve para
 * isso porque gera saída diferente a cada chamada mesmo para o
 * mesmo input.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}