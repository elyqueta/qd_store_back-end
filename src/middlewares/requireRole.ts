import { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../errors';
import { UserRole } from '../types/user.types';

/**
 * Middleware factory (função que devolve um middleware) para
 * restringir rotas a determinados papéis.
 *
 * Por que uma factory, e não um middleware fixo `requireAdmin`?
 *
 * Porque o mesmo mecanismo pode servir qualquer papel futuro sem
 * duplicar código — ex.: `requireRole('admin')`,
 * `requireRole('admin', 'operator')` (se um dia existir um terceiro
 * papel). Escrever `requireAdmin`, `requireOperator` como funções
 * separadas repetiria a mesma lógica de verificação três vezes.
 *
 * Ordem de uso obrigatória nas rotas: SEMPRE depois de
 * `authenticate`. Este middleware só lê `req.user`, nunca o
 * preenche — se vier antes de `authenticate`, `req.user` ainda
 * estará `undefined` e toda a requisição seria barrada,
 * independentemente do papel real do utilizador.
 *
 * Por que 403 (ForbiddenError) e não 401 (UnauthorizedError)?
 *
 * São situações semanticamente diferentes: 401 significa "não sei
 * quem és" (token ausente/inválido); 403 significa "sei quem és,
 * mas não tens permissão para isto". Um utilizador autenticado como
 * 'customer' que tenta aceder a uma rota admin SABE quem é — só não
 * tem o papel certo. Misturar os dois códigos confundiria clientes
 * da API que tentassem, por exemplo, redirecionar 401 para a tela
 * de login (não faz sentido pedir login de novo a quem já está
 * logado, só sem permissão).
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      next(new ForbiddenError('Não tens permissão para aceder a este recurso.'));
      return;
    }

    next();
  };
}