import type { OpenApiSchemas } from './types';

export const companySchemas: OpenApiSchemas = {
  CompanyUser: {
    type: 'object',
    required: ['id', 'fullName', 'email', 'companyRole'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      fullName: { type: 'string', example: 'Maria Fernandes' },
      email: { type: 'string', format: 'email', example: 'maria@empresa.co.ao' },
      companyRole: { type: 'string', nullable: true, example: 'Gerente' },
    },
  },
  Company: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      ownerId: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'Tech Solutions Lda' },
      nif: { type: 'string', example: '5417896230' },
      sector: { type: 'string', nullable: true, example: 'Tecnologia' },
      status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CompanyWithUsers: {
    type: 'object',
    required: [
      'id',
      'ownerId',
      'name',
      'nif',
      'sector',
      'status',
      'createdAt',
      'updatedAt',
      'users',
    ],
    properties: {
      id: { type: 'string', format: 'uuid' },
      ownerId: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'Tech Solutions Lda' },
      nif: { type: 'string', example: '5417896230' },
      sector: { type: 'string', nullable: true, example: 'Tecnologia' },
      status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      users: {
        type: 'array',
        items: { $ref: '#/components/schemas/CompanyUser' },
      },
    },
  },
  CreateCompanyInput: {
    type: 'object',
    required: ['name', 'nif', 'role'],
    properties: {
      name: { type: 'string', maxLength: 200, example: 'Tech Solutions Lda' },
      nif: { type: 'string', pattern: '^[0-9]{9}$', example: '500000001' },
      sector: { type: 'string', maxLength: 100, example: 'Tecnologia' },
      role: { type: 'string', minLength: 1, maxLength: 100, example: 'Gerente' },
    },
  },
  CompanyResolveResponse: {
    type: 'object',
    required: ['state', 'company'],
    properties: {
      state: { type: 'string', enum: ['mine', 'exists_not_member', 'not_found'] },
      company: {
        nullable: true,
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          nif: { type: 'string', pattern: '^[0-9]{9}$' },
        },
      },
    },
  },
  UpdateCompanyInput: {
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 200, example: 'Tech Solutions Lda' },
      sector: { type: 'string', maxLength: 100, nullable: true, example: 'Tecnologia' },
    },
  },
  UserCompany: {
    type: 'object',
    properties: {
      userId: { type: 'string', format: 'uuid' },
      companyId: { type: 'string', format: 'uuid' },
      role: { type: 'string', nullable: true, example: 'Gerente' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateUserCompanyInput: {
    type: 'object',
    description: 'Indique exactamente um dos campos userId ou email. O email é resolvido apenas no contexto da empresa e não existe endpoint de pesquisa pública.',
    properties: {
      userId: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email', example: 'maria@empresa.co.ao' },
      role: { type: 'string', maxLength: 100, example: 'Gerente' },
    },
    oneOf: [
      { required: ['userId'] },
      { required: ['email'] },
    ],
  },
  UpdateUserCompanyInput: {
    type: 'object',
    required: ['role'],
    properties: {
      role: { type: 'string', maxLength: 100, nullable: true, example: 'Comprador' },
    },
  },
};
