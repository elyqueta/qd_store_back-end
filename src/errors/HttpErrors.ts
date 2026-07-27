import { AppError } from './AppError';

/**
 * Cada subclasse abaixo representa uma categoria de erro HTTP comum
 * em uma API REST. A ideia é que, em qualquer controller/service
 * futuro, o código de negócio simplesmente lance a classe certa:
 *
 *   if (!produto) {
 *     throw new NotFoundError('Produto não encontrado.');
 *   }
 *
 * ...sem nunca precisar saber ou escrever manualmente o número do
 * status HTTP (404, 409, etc.) — isso fica encapsulado aqui, em um
 * único lugar. Se um dia a equipe decidir mudar a convenção (por
 * exemplo, usar 400 em vez de 422 para erros de validação), a
 * mudança acontece em UM arquivo, não espalhada pela aplicação.
 */

/** 400 — a requisição está malformada ou não faz sentido como veio. */
export class BadRequestError extends AppError {
  constructor(message = 'Requisição inválida.', details?: unknown) {
    super(message, 400, details);
  }
}

/** 401 — o cliente não está autenticado (token ausente/inválido/expirado). */
export class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado.', details?: unknown) {
    super(message, 401, details);
  }
}

/** 403 — o cliente está autenticado, mas não tem permissão para a ação. */
export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado.', details?: unknown) {
    super(message, 403, details);
  }
}

/** 404 — o recurso solicitado não existe. */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.', details?: unknown) {
    super(message, 404, details);
  }
}

/**
 * 409 — a requisição conflita com o estado atual do recurso.
 * Exemplo típico: tentar cadastrar um NIF que já existe.
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflito com o estado atual do recurso.', details?: unknown) {
    super(message, 409, details);
  }
}

/**
 * 422 — a requisição está bem formada (é um JSON válido, por exemplo),
 * mas os dados nela não passam nas regras de validação de negócio.
 * É o status que o Zod (na camada de validators/) deve gerar quando
 * um schema falha.
 */
export class ValidationError extends AppError {
  constructor(message = 'Dados inválidos.', details?: unknown) {
    super(message, 422, details);
  }
}
