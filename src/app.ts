import express, { Application, Request, Response } from 'express';
import { pool } from './database/pool';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { asyncHandler } from './middlewares/asyncHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';
import companyRoutes from './routes/company.routes';
import categoryRoutes from './routes/category.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

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
 *
 * Consulta o banco (SELECT 1) a cada chamada para confirmar não só
 * que o processo Node está de pé, mas que a conexão com o Postgres
 * também está saudável — um orquestrador (Docker, Kubernetes) que só
 * verificasse "o processo respondeu" poderia achar a aplicação
 * saudável mesmo com o banco indisponível.
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

/**
 * Montagem das rotas da API.
 *
 * Cada linha abaixo aparece EXATAMENTE uma vez — router.use() é uma
 * operação de REGISTO no middleware stack do Express, não uma
 * declaração idempotente. Montar o mesmo router duas vezes no mesmo
 * prefixo faz o Express avaliar essa cadeia de middlewares duas
 * vezes por requisição (sem erro visível hoje, mas um risco real
 * assim que qualquer um destes routers ganhar um middleware que não
 * finaliza a resposta, como um `authenticate` no topo).
 *
 * userCompanyRoutes NÃO aparece aqui de propósito: é um router
 * aninhado, montado dentro de company.routes.ts via
 * `router.use('/:companyId/users', userCompanyRoutes)`, herdando o
 * prefixo /api/companies/:companyId através de mergeParams: true.
 */
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;