import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';
import { ValidationError } from '../errors';

/**
 * `query` foi adicionado aos campos validáveis. Continua opcional,
 * então nenhuma rota já existente (category, address, company) que
 * chama validate({ body/params }) precisa mudar — este campo
 * simplesmente não é passado por elas, e o `if (schemas.query)`
 * abaixo nunca executa nesses casos.
 */
interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }

      /**
       * Mesma técnica de reatribuição já usada para params: o Zod
       * não só valida `req.query` (todos os valores chegam como
       * string, ex: "?page=2"), como TRANSFORMA via z.coerce.number()
       * — por isso reatribuímos, e não apenas validamos e descartamos.
       */
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        next(new ValidationError('Dados inválidos.', details));
        return;
      }

      next(err);
    }
  };
}
