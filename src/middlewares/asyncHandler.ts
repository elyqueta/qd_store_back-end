import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Por que este wrapper existe?
 *
 * O Express 4 não sabe lidar nativamente com handlers async: se a
 * Promise retornada por um handler async rejeitar, o Express NÃO
 * captura esse erro automaticamente (isso só foi corrigido no
 * Express 5). O resultado, sem este wrapper, seria uma unhandled
 * promise rejection silenciosa e a requisição HTTP nunca respondida.
 *
 * asyncHandler resolve isso: executa o handler async e, se ele
 * rejeitar, encaminha o erro para next(error) — que é o mecanismo
 * padrão do Express para chegar até o error handler global.
 *
 * O tipo genérico <T> permite tipar req.params corretamente em cada
 * rota (ex: asyncHandler<{ id: string }>), sem recorrer a "any".
 */
type AsyncRequestHandler<P = Record<string, string>> = (
  req: Request<P>,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function asyncHandler<P = Record<string, string>>(
  handler: AsyncRequestHandler<P>
): RequestHandler<P> {
  return (req, res, next) => {
    // O .catch aqui é o ponto-chave: garante que QUALQUER rejeição
    // da Promise retornada pelo handler seja capturada e encaminhada
    // para o Express, em vez de se perder silenciosamente.
    handler(req, res, next).catch(next);
  };
}