import type { OpenApiSchemas } from './types';

export const authSchemas: OpenApiSchemas = {
  /**
   * accountType é apenas 'personal' | 'business' (enum account_type
   * do Postgres). 'admin' não é um tipo de conta — é um nível de
   * acesso da plataforma, representado pelo campo `role`.
   */
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      fullName: { type: 'string', example: 'João Manuel' },
      email: { type: 'string', format: 'email', example: 'joao@exemplo.co.ao' },
      phone: { type: 'string', example: '923456789' },
      nif: { type: 'string', nullable: true, example: '005123456LA042' },
      accountType: { type: 'string', enum: ['personal', 'business'] },
      role: { type: 'string', enum: ['customer', 'admin'] },
      status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
      deactivatedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  /**
   * accountType continua restrito a 'personal' aqui, de propósito:
   * este é o schema do endpoint PÚBLICO de registo. 'admin' nunca
   * deve ser um valor aceite por um cliente não autenticado.
   */
  RegisterInput: {
    type: 'object',
    required: ['fullName', 'email', 'password', 'phone', 'accountType'],
    properties: {
      fullName: { type: 'string', example: 'João Manuel' },
      email: { type: 'string', format: 'email', example: 'joao@exemplo.co.ao' },
      password: { type: 'string', format: 'password', example: 'SenhaForte123' },
      phone: { type: 'string', example: '923456789' },
      nif: { type: 'string', example: '005123456LA042' },
      accountType: { type: 'string', enum: ['personal'] },
    },
  },
  LoginInput: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'joao@exemplo.co.ao' },
      password: { type: 'string', format: 'password', example: 'SenhaForte123' },
    },
  },
  RefreshTokenInput: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string', example: 'a1b2c3...' },
    },
  },
  AuthResult: {
    type: 'object',
    properties: {
      user: { $ref: '#/components/schemas/User' },
      accessToken: { type: 'string', example: 'eyJhbGciOi...' },
      refreshToken: { type: 'string', example: 'a1b2c3...' },
    },
  },
};
