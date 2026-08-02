import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';
import { ValidationError } from '../errors';

/**
 * Cada rota pode precisar validar `body`, `params`, ou ambos — nunca
 * os dois são obrigatórios ao mesmo tempo (ex: GET /categories não
 * tem body; POST /categories não tem :id). Por isso os dois campos
 * são opcionais aqui.
 */
interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
}

/**
 * Middleware de validação genérico, reutilizável por qualquer
 * entidade da aplicação — não só CATEGORY.
 *
 * Por que isto fica ANTES do controller na cadeia de middlewares
 * (ver routes.ts), e não dentro dele?
 *
 * Porque validação de formato de entrada é uma preocupação
 * transversal (cross-cutting concern) — não é "regra de negócio de
 * category", é "regra de como qualquer requisição HTTP deve chegar
 * bem formada". Middlewares existem exatamente para isolar esse tipo
 * de lógica repetitiva da lógica específica de cada rota.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Reatribuir req.body/req.params com o resultado do .parse()
      // (não apenas validar e descartar) é intencional: o Zod não só
      // valida, também TRANSFORMA (ex: .trim() em labelSchema). Sem
      // isto, o controller receberia os dados originais, sem as
      // transformações já aplicadas pelo schema.
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }

      next();
    } catch (err) {
      // ZodError tem uma estrutura própria (err.issues) diferente de
      // qualquer AppError nosso. Aqui é o único lugar da aplicação
      // que precisa entender o formato nativo do Zod — traduzimos
      // isso para o formato padronizado de erro (ValidationError)
      // ANTES de repassar para o errorHandler global, que só conhece
      // AppError e seus detalhes.
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        next(new ValidationError('Dados inválidos.', details));
        return;
      }

      // Qualquer erro que não seja de validação (ex: um bug real no
      // próprio middleware) segue o caminho normal de erro
      // inesperado, tratado pelo errorHandler global.
      next(err);
    }
  };
}