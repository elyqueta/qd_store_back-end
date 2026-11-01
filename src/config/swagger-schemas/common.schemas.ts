import type { OpenApiSchemas } from './types';

export const commonSchemas: OpenApiSchemas = {
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
};
