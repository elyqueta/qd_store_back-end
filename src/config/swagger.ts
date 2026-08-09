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
      /**
       * accountType agora inclui 'admin' — reflete AccountType em
       * types/user.types.ts (ver 090_add_admin_account_type.sql).
       */
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string', example: 'João Manuel' },
          email: { type: 'string', format: 'email', example: 'joao@exemplo.co.ao' },
          phone: { type: 'string', example: '923456789' },
          nif: { type: 'string', nullable: true, example: '005123456LA042' },
          accountType: { type: 'string', enum: ['personal', 'business', 'admin'] },
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
      CompanyUser: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string', example: 'Maria Fernandes' },
          email: { type: 'string', format: 'email', example: 'maria@empresa.co.ao' },
          companyRole: { type: 'string', nullable: true, example: 'Gerente' },
        },
      },
      CompanyWithUsers: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
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
      /**
       * Schemas do domínio LOCATION (províncias e municípios de
       * Angola). Não têm "Input" porque são rotas somente-leitura —
       * não existe operação de criação/edição destes dados pela API.
       */
      Province: {
        type: 'object',
        properties: {
          slug: { type: 'string', example: 'icolo-e-bengo' },
          name: { type: 'string', example: 'Ícolo e Bengo' },
        },
      },
      ProvinceWithMunicipalities: {
        type: 'object',
        properties: {
          slug: { type: 'string', example: 'luanda' },
          name: { type: 'string', example: 'Luanda' },
          municipalities: {
            type: 'array',
            items: { type: 'string' },
            example: ['Belas', 'Cacuaco', 'Cazenga', 'Talatona', 'Viana'],
          },
        },
      },

      /**
       * Schemas do domínio ADDRESS.
       *
       * `latitude`/`longitude` aparecem como `number` aqui — mesmo o
       * Postgres guardando DECIMAL e o driver `pg` devolvendo string
       * internamente (ver address.types.ts) — porque o Swagger
       * documenta o CONTRATO HTTP (JSON), não os detalhes internos
       * de armazenamento. O repository já faz essa conversão antes
       * de a resposta chegar ao cliente.
       */
      Address: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          label: { type: 'string', nullable: true, example: 'Casa' },
          province: { type: 'string', example: 'Luanda' },
          municipality: { type: 'string', example: 'Talatona' },
          neighborhood: { type: 'string', example: 'Talatona' },
          address: { type: 'string', example: 'Rua Direita de Talatona, casa 10' },
          reference: { type: 'string', nullable: true, example: 'Perto do mercado' },
          latitude: { type: 'number', nullable: true, example: -8.9147 },
          longitude: { type: 'number', nullable: true, example: 13.1894 },
          isDefault: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateAddressInput: {
        type: 'object',
        required: ['province', 'municipality', 'neighborhood', 'address'],
        properties: {
          label: { type: 'string', maxLength: 100, example: 'Casa' },
          province: { type: 'string', maxLength: 100, example: 'Luanda' },
          municipality: { type: 'string', maxLength: 100, example: 'Talatona' },
          neighborhood: { type: 'string', maxLength: 100, example: 'Talatona' },
          address: {
            type: 'string',
            maxLength: 500,
            example: 'Rua Direita de Talatona, casa 10',
          },
          reference: { type: 'string', maxLength: 500, example: 'Perto do mercado' },
          latitude: { type: 'number', minimum: -90, maximum: 90, example: -8.9147 },
          longitude: { type: 'number', minimum: -180, maximum: 180, example: 13.1894 },
        },
      },
      /**
       * `province` e `municipality` aparecem como opcionais aqui,
       * mas o validator Zod exige que sejam enviados JUNTOS ou
       * NENHUM dos dois (ver address.validator.ts) — o OpenAPI 3.0
       * puro não tem uma forma direta de expressar "obrigatório
       * apenas quando o outro campo está presente", então essa regra
       * fica documentada em texto na descrição do endpoint (ver
       * abaixo), não no schema.
       */
      UpdateAddressInput: {
        type: 'object',
        properties: {
          label: { type: 'string', maxLength: 100, nullable: true, example: 'Casa' },
          province: { type: 'string', maxLength: 100, example: 'Luanda' },
          municipality: { type: 'string', maxLength: 100, example: 'Talatona' },
          neighborhood: { type: 'string', maxLength: 100, example: 'Talatona' },
          address: { type: 'string', maxLength: 500, example: 'Rua Direita de Talatona, casa 10' },
          reference: {
            type: 'string',
            maxLength: 500,
            nullable: true,
            example: 'Perto do mercado',
          },
          latitude: { type: 'number', minimum: -90, maximum: 90, nullable: true, example: -8.9147 },
          longitude: {
            type: 'number',
            minimum: -180,
            maximum: 180,
            nullable: true,
            example: 13.1894,
          },
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
