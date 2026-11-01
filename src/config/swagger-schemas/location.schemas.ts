import type { OpenApiSchemas } from './types';

export const locationSchemas: OpenApiSchemas = {
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
};
