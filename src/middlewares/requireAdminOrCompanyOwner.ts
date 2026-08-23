import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, NotFoundError } from '../errors';
import { companyRepository } from '../repositories/company.repository';

/**
 * Autoriza administradores da plataforma ou o proprietário da empresa.
 *
 * Tal como requireAdminOrCompanyMember, este middleware usa
 * `.then()/.catch(next)` porque o Express 4 não encaminha sozinho
 * rejeições de middlewares declarados como async.
 */
export function requireAdminOrCompanyOwner(companyIdParam: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.user?.role === 'admin') {
      next();
      return;
    }

    const companyId = req.params[companyIdParam];
    const userId = req.user?.sub;

    if (!companyId || !userId) {
      next(new ForbiddenError('Não tens permissão para aceder a este recurso.'));
      return;
    }

    companyRepository
      .findById(companyId)
      .then((company) => {
        if (!company) {
          next(new NotFoundError('Empresa não encontrada.'));
          return;
        }

        if (company.ownerId !== userId) {
          next(
            new ForbiddenError(
              'Apenas o proprietário da empresa ou um administrador pode realizar esta ação.'
            )
          );
          return;
        }

        next();
      })
      .catch(next);
  };
}
