import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/token.util';
import { UnauthorizedError } from '../errors';

/**
 * Middleware que protege rotas exigindo um access token válido no
 * cabeçalho Authorization.
 *
 * Formato esperado: "Authorization: Bearer <token>" — este é o
 * padrão definido pela RFC 6750 (OAuth 2.0 Bearer Token), adotado
 * universalmente por APIs REST, não uma convenção nossa.
 *
 * Onde este middleware deve ser usado?
 *
 * Em qualquer rota que precise saber "quem está a fazer esta
 * requisição" — ex: GET /api/cart (carrinho é sempre de um
 * utilizador específico), POST /api/orders. Rotas públicas como
 * GET /api/categories continuam sem este middleware.
 *
 * Por que não distinguir "token ausente" de "token inválido" na
 * mensagem de erro?
 *
 * Mesmo raciocínio já aplicado no login (ver auth.service.ts): do
 * ponto de vista do cliente, a ação correta é sempre a mesma
 * ("autentique-se de novo"). Diferenciar as mensagens não ajudaria
 * um utilizador legítimo e só daria informação extra a quem estiver
 * a tentar contornar a autenticação.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Token de acesso ausente.'));
    return;
  }

  // "Bearer <token>" — descarta os 7 caracteres de "Bearer " para
  // isolar só o token em si.
  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    // verifyAccessToken lança em dois cenários: assinatura inválida
    // (token forjado/adulterado) ou token expirado. Tratamos os
    // dois da mesma forma aqui, pelo motivo explicado acima.
    next(new UnauthorizedError('Token de acesso inválido ou expirado.'));
  }
}