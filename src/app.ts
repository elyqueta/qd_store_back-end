import express, { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { pool } from './database/pool';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { asyncHandler } from './middlewares/asyncHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';
import categoryRoutes from './routes/category.routes';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Documentação interativa (Swagger UI), disponível SOMENTE fora de
 * produção.
 *
 * Por que isto importa: o Swagger UI expõe publicamente a estrutura
 * completa da API (endpoints, formatos de payload, exemplos de erro)
 * — informação valiosa para um atacante mapear a superfície de ataque
 * da aplicação. Em desenvolvimento isso é desejável (é a própria
 * finalidade da ferramenta); em produção, reduzimos a exposição por
 * padrão, seguindo o mesmo espírito de "fail-safe by default" que já
 * aplicamos em env.ts.
 */
if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

/**
 * Rota de health check.
 * ...(inalterado)
 */
app.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      await pool.query('SELECT 1');

      res.status(200).json({
        status: 'ok',
        service: 'qd-store-backend',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Falha no health check ao consultar o banco:', error);
      res.status(503).json({
        status: 'error',
        service: 'qd-store-backend',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

app.use('/api/categories', categoryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;