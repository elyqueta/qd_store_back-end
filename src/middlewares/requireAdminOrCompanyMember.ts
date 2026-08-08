import { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../errors';
import { userCompanyRepository } from '../repositories/userCompany.repository';

/**
 * Middleware de autorização para GET /api/companies/:companyId/users.
 *
 * Regra de negócio: só pode listar os utilizadores vinculados a uma
 * empresa quem for (a) administrador da plataforma, OU (b) alguém
 * que já está vinculado àquela MESMA empresa. Um utilizador comum
 * vinculado à Empresa A não pode listar os colegas da Empresa B —
 * ele só enxerga a própria empresa.
 *
 * Por que isto precisa ser DIFERENTE de requireAdmin/requireRole?
 *
 * requireAdmin e requireRole decidem olhando só para req.user — o
 * payload já decodificado do JWT, sem tocar no banco. Aqui a decisão
 * depende de um dado que NÃO está no token: "este utilizador está
 * vinculado a ESTA empresa específica?". Essa informação só existe
 * na tabela user_company, então este middleware precisa de fazer uma
 * consulta assíncrona — por isso não pode seguir o mesmo formato
 * 100% síncrono dos outros dois.
 *
 * Por que `.then()/.catch(next)` em vez de declarar a função como
 * `async`?
 *
 * O Express não sabe capturar a rejeição de uma Promise devolvida
 * por um middleware `async` (mesmo problema já documentado em
 * asyncHandler.ts, que resolve isso para controllers). Aqui,
 * como é um caso único e não um padrão repetido em dezenas de rotas,
 * não vale a pena criar um wrapper genérico — basta encadear
 * `.catch(next)` diretamente, garantindo que qualquer erro da query
 * (ex: conexão perdida com o banco) siga para o errorHandler global
 * em vez de se perder como unhandled rejection.
 *
 * Ordem obrigatória de uso na rota: DEPOIS de authenticate (para
 * req.user existir) e DEPOIS de validate({ params: ... }) (para
 * garantir que req.params.companyId já é um UUID válido antes de
 * usá-lo numa query).
 */
export function requireAdminOrCompanyMember(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Caminho rápido: administradores sempre têm acesso, sem precisar
  // consultar o banco. Mesma regra de negócio já aplicada em
  // requireAdmin.ts, só que aqui é o primeiro de dois caminhos
  // possíveis, não o único.
  if (req.user?.role === 'admin') {
    next();
    return;
  }

  const userId = req.user?.sub;
  const { companyId } = req.params as { companyId: string };

  // Defesa em profundidade: se por algum motivo req.user não estiver
  // preenchido aqui (ex: middleware chamado fora de ordem, sem
  // authenticate antes), negamos por padrão em vez de arriscar uma
  // query com userId undefined.
  if (!userId) {
    next(new ForbiddenError('Não tens permissão para aceder a este recurso.'));
    return;
  }

  userCompanyRepository
    .isMember(companyId, userId)
    .then((isMember) => {
      if (!isMember) {
        next(new ForbiddenError('Não tens permissão para aceder a este recurso.'));
        return;
      }

      next();
    })
    .catch(next);
}