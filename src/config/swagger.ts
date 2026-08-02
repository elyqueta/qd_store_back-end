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
    schemas: {
      /**
       * Espelha exatamente o type `Category` (types/category.types.ts).
       * Se um dia a API de category mudar de formato, este schema
       * precisa ser atualizado manualmente — é a única desvantagem
       * real de não gerar isto automaticamente a partir do Zod (algo
       * que poderíamos explorar no futuro com zod-to-openapi, mas
       * seria uma biblioteca adicional, fora do escopo de hoje).
       */
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