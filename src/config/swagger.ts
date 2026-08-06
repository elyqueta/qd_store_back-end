import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const swaggerDefinition: swaggerJsdoc.OAS3Definition = {
  openapi: '3.0.0',
  info: {
    title: 'QD Store API',
    version: '1.0.0',
    description:
      'API REST do QD Solutions — e-commerce de tecnologia para Angola. ' +
      'Documentação gerada automaticamente a partir de comentários JSDoc ' +
      'nas rotas, garantindo que a documentação nunca fica desatualizada ' +
      'em relação ao código real.',
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Servidor local de desenvolvimento',
    },
  ],
  components: {
    schemas: {
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string', example: 'portateis' },
          label: { type: 'string', example: 'Portáteis' },
          icon: { type: 'string', nullable: true, example: '🖥️' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateCategoryInput: {
        type: 'object',
        required: ['label'],
        properties: {
          label: { type: 'string', maxLength: 100, example: 'Portáteis' },
          icon: { type: 'string', maxLength: 10, example: '🖥️' },
        },
      },
      UpdateCategoryInput: {
        type: 'object',
        properties: {
          label: { type: 'string', maxLength: 100, example: 'Portáteis' },
          icon: {
            type: 'string',
            maxLength: 10,
            nullable: true,
            example: '🖥️',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Recurso não encontrado.' },
          details: {
            type: 'array',
            items: { type: 'object' },
            description: 'Presente apenas em erros de validação (422).',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string', example: 'João Manuel' },
          email: { type: 'string', format: 'email', example: 'joao@exemplo.co.ao' },
          phone: { type: 'string', example: '923456789' },
          nif: { type: 'string', nullable: true, example: '005123456LA042' },
          accountType: { type: 'string', enum: ['personal', 'business'] },
          status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
          deactivatedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
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

      /**
       * A partir daqui: schemas do domínio EMPRESA / UTILIZADOR_EMPRESA.
       * Company espelha types/company.types.ts; UserCompany espelha
       * types/userCompany.types.ts.
       */
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Tech Solutions Lda' },
          nif: { type: 'string', example: '005123456LA042' },
          sector: { type: 'string', nullable: true, example: 'Tecnologia' },
          status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateCompanyInput: {
        type: 'object',
        required: ['name', 'nif'],
        properties: {
          name: { type: 'string', maxLength: 200, example: 'Tech Solutions Lda' },
          nif: { type: 'string', maxLength: 20, example: '005123456LA042' },
          sector: { type: 'string', maxLength: 100, example: 'Tecnologia' },
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
        required: ['userId'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          role: { type: 'string', maxLength: 100, example: 'Gerente' },
        },
      },
      UpdateUserCompanyInput: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', maxLength: 100, nullable: true, example: 'Comprador' },
        },
      },
    },

    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [path.join(__dirname, '../routes/*.routes.ts')],
};

export const swaggerSpec = swaggerJsdoc(options);
