import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { User, UserWithPasswordHash } from '../types/user.types';
import { LoginInput, RegisterInput } from '../validators/auth.validator';
import { comparePassword, hashPassword } from '../utils/password.util';
import { generateAccessToken, generateRefreshToken, hashToken } from '../utils/token.util';
import { env } from '../config/env';
import { UnauthorizedError } from '../errors';

interface SessionContext {
  device?: string | null;
  ip?: string | null;
}

interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Extrai o formato SEGURO (User) a partir do formato completo usado
 * no login (UserWithPasswordHash), descartando explicitamente o
 * hash da senha.
 *
 * Por que uma função dedicada, em vez de desestruturação
 * "{ passwordHash: _x, ...user }"?
 *
 * Porque a desestruturação-descarte cria uma variável que existe só
 * para ser jogada fora, e o ESLint corretamente reclama de uma
 * variável nunca usada — o "_" no nome é só uma convenção, não uma
 * regra que o nosso eslint.config.js reconhece fora de parâmetros de
 * função. Listar os campos explicitamente resolve o lint E deixa
 * mais claro, para quem ler o código, exatamente o que compõe um
 * User seguro.
 */
function toSafeUser(user: UserWithPasswordHash): User {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    nif: user.nif,
    accountType: user.accountType,
    role: user.role,
    status: user.status,
    deactivatedAt: user.deactivatedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function calculateSessionExpiry(): Date {
  const days = env.JWT_REFRESH_EXPIRES_IN_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function issueTokens(user: User, context: SessionContext): Promise<AuthResult> {
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    accountType: user.accountType,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();

  await sessionRepository.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    device: context.device ?? null,
    ip: context.ip ?? null,
    expiresAt: calculateSessionExpiry(),
  });

  return { user, accessToken, refreshToken };
}

async function register(input: RegisterInput): Promise<User> {
  const passwordHash = await hashPassword(input.password);

  return userRepository.create({
    fullName: input.fullName,
    email: input.email,
    passwordHash,
    phone: input.phone,
    nif: input.nif ?? null,
    accountType: input.accountType,
  });
}

async function login(input: LoginInput, context: SessionContext): Promise<AuthResult> {
  const userWithHash = await userRepository.findByEmail(input.email);

  if (!userWithHash) {
    throw new UnauthorizedError('Credenciais inválidas.');
  }

  const isPasswordValid = await comparePassword(input.password, userWithHash.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Credenciais inválidas.');
  }

  if (userWithHash.status !== 'active') {
    throw new UnauthorizedError('Esta conta não está ativa. Contacte o suporte.');
  }

  const user = toSafeUser(userWithHash);

  return issueTokens(user, context);
}

async function refresh(refreshToken: string, context: SessionContext): Promise<AuthResult> {
  const tokenHash = hashToken(refreshToken);
  const session = await sessionRepository.findByTokenHash(tokenHash);

  if (!session) {
    throw new UnauthorizedError('Sessão inválida. Faça login novamente.');
  }

  await sessionRepository.remove(session.id);

  if (session.expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedError('Sessão expirada. Faça login novamente.');
  }

  const user = await userRepository.findById(session.userId);

  if (!user || user.status !== 'active') {
    throw new UnauthorizedError('Sessão inválida. Faça login novamente.');
  }

  return issueTokens(user, context);
}

async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  const session = await sessionRepository.findByTokenHash(tokenHash);

  if (session) {
    await sessionRepository.remove(session.id);
  }
}

export const authService = {
  register,
  login,
  refresh,
  logout,
};
