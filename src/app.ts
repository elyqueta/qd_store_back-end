import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { pool } from './database/pool';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { corsOptions } from './config/cors';
import { asyncHandler } from './middlewares/asyncHandler';
import { apiLimiter } from './middlewares/rateLimiter';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';
import categoryRoutes from './routes/category.routes';

const app: Application = express();

/**
 * Helmet: define um conjunto de headers HTTP de segurança
 * recomendados (ex: remove `X-Powered-By: Express`, define
 * `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`,
 * política restritiva de `Content-Security-Policy`, entre outros).
 *
 * Por que vem ANTES de tudo o resto?
 *
 * Estes headers precisam de estar presentes em TODA resposta da
 * aplicação, incluindo respostas de erro e do próprio Swagger UI.
 * Registá-lo primeiro garante que nenhuma resposta escapa dele.
 *
 * Por que zero configuração customizada por agora?
 *
 * Os defaults do Helmet já seguem as recomendações da OWASP para a
 * maioria das APIs REST. Vamos revisitar a Content-Security-Policy
 * especificamente quando o Swagger UI ou outra interface servida
 * por esta API precisar de carregar recursos externos que os
 * defaults bloqueiem — por agora, nenhum problema foi identificado.
 */
app.use(helmet());

/**
 * CORS: decide QUAIS origens (front-ends) podem consumir esta API a
 * partir do browser. As origens permitidas vêm de env.CORS_ORIGIN
 * (ver src/config/env.ts), nunca hard-coded aqui — assim, mudar de
 * ambiente (dev -> produção) é só mudar uma variável de ambiente,
 * sem tocar em código.
 */
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Rate limiting: aplicado apenas ao prefixo `/api`, não a `/health`
 * nem ao Swagger UI. Ver justificação completa em
 * src/middlewares/rateLimiter.ts.
 */
app.use('/api', apiLimiter);

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