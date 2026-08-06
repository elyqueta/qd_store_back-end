import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

/**
 * Definição base da API — informação que não muda por endpoint:
 * título, versão, servidores disponíveis, e os "schemas" reutilizáveis
 * (formatos de dados que várias rotas vão referenciar).
 *
 * Por que declarar CategorySchema e ErrorResponse aqui, centralizados,
 * em vez de repetir a estrutura em cada rota?
 *
 * Porque ErrorResponse, por exemplo, é o MESMO formato para qualquer
 * erro de qualquer entidade (reflete o errorHandler global). Se cada
 * rota descrevesse essa estrutura à mão, teríamos 24 cópias
 * ligeiramente diferentes da mesma coisa — exatamente o tipo de
 * duplicação que o DRY existe para evitar.
 */
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
    /**
     * Todos os schemas abaixo são IRMÃOS entre si — cada um é uma
     * entrada própria dentro de "schemas", referenciável de forma
     * independente via $ref: '#/components/schemas/<Nome>'. Nenhum
     * schema deve ficar aninhado dentro de outro aqui (isso foi
     * exatamente o bug corrigido nesta versão do arquivo).
     */
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
      /**
       * Formato padronizado de erro — espelha ErrorResponseBody em
       * middlewares/errorHandler.ts. Toda rota de erro documentada
       * referencia este único schema, em vez de repetir a estrutura.
       */
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
       * A partir daqui: schemas do domínio de autenticação
       * (auth.routes.ts). User espelha o tipo User de
       * types/user.types.ts — deliberadamente SEM password_hash,
       * pela mesma razão de segurança explicada no código: o que
       * está documentado aqui é o que a API realmente devolve.
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
    },

    /**
     * Define o esquema "bearerAuth", usado por rotas protegidas
     * (via `security: [{ bearerAuth: [] }]` no JSDoc da rota, quando
     * aplicarmos authenticate a PRODUTO/CARRINHO/etc). Isto ainda
     * não protege nenhuma rota sozinho — só ensina o Swagger UI a
     * mostrar o cadeado e o campo "Authorize" quando referenciado.
     */
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

/**
 * `apis` diz ao swagger-jsdoc ONDE procurar os comentários JSDoc que
 * descrevem cada endpoint. Aponta para *.routes.ts com extensão .ts
 * (não .js) de propósito: o Swagger UI só é montado em desenvolvimento
 * (ver app.ts), ambiente em que o tsx executa os ficheiros .ts
 * diretamente — nunca existe uma versão compilada em dist/ a rodar
 * nesse cenário. Se um dia decidirmos servir Swagger também a partir
 * do build de produção, este caminho precisará ser revisto.
 */
const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [path.join(__dirname, '../routes/*.routes.ts')],
};

export const swaggerSpec = swaggerJsdoc(options);