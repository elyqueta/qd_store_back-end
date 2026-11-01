import type { OpenApiSchemas } from './types';

export const addressSchemas: OpenApiSchemas = {
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
};
