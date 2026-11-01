import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool } from './database/pool';
import { env } from './config/env';
import { corsOptions } from './config/cors';
import { swaggerSpec } from './config/swagger';
import { asyncHandler } from './middlewares/asyncHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';
import v1Routes from './routes/v1';

const app: Application = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // A página de docs (/api-docs) carrega o Scalar UI via CDN;
        // permitir esse domínio em script-src sem abrir geral.
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      },
    },
  })
);
app.use(cors(corsOptions));

// Rate limit só nas rotas da API (não em /health, para não quebrar
// orchestrators que batem no health check em curto intervalo).
app.use('/api/v1', apiLimiter);

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
 * Montagem das rotas da API, versionadas em /api/v1.
 *
 * O versionamento vive em src/routes/v1/index.ts: aquele router monta
 * os domínios (auth, categories, companies...) sem prefixo próprio, e
 * é montado AQUI sob /api/v1. Uma futura v2 (src/routes/v2/, mesmo
 * formato) encaixa-se com uma única linha nova, sem tocar na v1 —
 * clientes antigos continuam servidos sem quebra de contrato.
 *
 * /health fica FORA do prefixo versionado de propósito: health check
 * de orquestrador (Docker, Kubernetes) não deve quebrar a cada nova
 * versão da API.
 */
app.use('/api/v1', v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
