/**
 * Barrel export: permite importar qualquer erro da aplicação a partir
 * de um único caminho (`from '../errors'`), em vez de precisar saber
 * em qual arquivo específico cada classe foi definida.
 *
 * Exemplo de uso em um service futuro:
 *   import { NotFoundError, ConflictError } from '../errors';
 */
export * from './AppError';
export * from './HttpErrors';
