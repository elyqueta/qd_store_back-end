import express, { Application, Request, Response } from 'express';
import { pool } from './database/pool';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { asyncHandler } from './middlewares/asyncHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';
import categoryRoutes from './routes/category.routes';
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Documentação interativa, disponível SOMENTE fora de produção.
 *
 * Em vez do pacote @scalar/express-api-reference (ESM puro,
 * incompatível com nosso projeto CommonJS), servimos uma página HTML
 * estática que carrega a UI do Scalar via CDN diretamente no
 * navegador. O servidor Node nunca importa código do Scalar — só
 * entrega o JSON do spec (/openapi.json) e o HTML que aponta pra ele.
 * Isso elimina o conflito de módulos por completo.
 */
if (env.NODE_ENV !== 'production') {
  app.get('/openapi.json', (_req: Request, res: Response) => {
    res.json(swaggerSpec);
  });

  app.get('/api-docs', (_req: Request, res: Response) => {
    res.type('html').send(`
      <!doctype html>
      <html>
        <head>
          <title>QD Store API Docs</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <script
            id="api-reference"
            data-url="/openapi.json"
            data-configuration='{"theme":"purple"}'
          ></script>
          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        </body>
      </html>
    `);
  });
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

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/companies', companyRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
