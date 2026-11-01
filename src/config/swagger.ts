import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';
import { catalogSchemas } from './swagger-schemas/catalog.schemas';
import { cartSchemas } from './swagger-schemas/cart.schemas';
import { orderSchemas } from './swagger-schemas/order.schemas';
import { paymentSchemas } from './swagger-schemas/payment.schemas';
import { engagementSchemas } from './swagger-schemas/engagement.schemas';
import { commonSchemas } from './swagger-schemas/common.schemas';
import { authSchemas } from './swagger-schemas/auth.schemas';
import { companySchemas } from './swagger-schemas/company.schemas';
import { locationSchemas } from './swagger-schemas/location.schemas';
import { addressSchemas } from './swagger-schemas/address.schemas';
import { productSchemas } from './swagger-schemas/product.schemas';

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
      ...catalogSchemas,
      ...cartSchemas,
      ...orderSchemas,
      ...paymentSchemas,
      ...engagementSchemas,
      ...commonSchemas,
      ...authSchemas,
      ...companySchemas,
      ...locationSchemas,
      ...addressSchemas,
      ...productSchemas,
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
  // Dois padrões, um por modo de execução: em desenvolvimento (tsx),
  // __dirname aponta para src/config e os ficheiros são .ts; na imagem
  // Docker compilada, __dirname aponta para dist/config e os ficheiros
  // são .js. Sem o padrão .js, o spec ficaria vazio no container.
  // O subdirectório v1/ acompanha o versionamento das rotas.
  apis: [
    path.join(__dirname, '../routes/v1/*.routes.ts'),
    path.join(__dirname, '../routes/v1/*.routes.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
