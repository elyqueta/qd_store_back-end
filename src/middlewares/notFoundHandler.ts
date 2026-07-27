import { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../errors';

/**
 * Middleware de "rota não encontrada".
 *
 * Onde ele deve ficar registrado, e por quê:
 *
 * Precisa ser adicionado em app.ts DEPOIS de todas as rotas reais da
 * aplicação (health check, futuras rotas de produtos, pedidos etc.) e
 * ANTES do errorHandler. O Express percorre os middlewares na ordem
 * em que foram registrados — se uma requisição chegou até aqui, é
 * porque nenhuma rota anterior bateu com o método + caminho pedido.
 *
 * Em vez de deixar o Express responder com o 404 padrão dele (uma
 * página HTML genérica, fora do padrão JSON da nossa API), criamos um
 * NotFoundError e passamos para `next(...)`. Isso faz a requisição
 * cair no errorHandler global, que devolve a MESMA estrutura JSON
 * usada por qualquer outro erro da aplicação — o cliente da API nunca
 * precisa tratar "rota inexistente" como um caso especial.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Rota não encontrada: ${req.method} ${req.originalUrl}`));
}
