import type swaggerJsdoc from 'swagger-jsdoc';

export type OpenApiSchemas = NonNullable<
  NonNullable<swaggerJsdoc.OAS3Definition['components']>['schemas']
>;
