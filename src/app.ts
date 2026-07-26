import express, { Application, Request, Response } from 'express';
import { pool } from './database/pool';
import { asyncHandler } from './middlewares/asyncHandler';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Rota de health check.
 *
 * Note que o try/catch continua aqui — e isso é intencional, não
 * redundante. O asyncHandler garante que um erro NÃO TRATADO chegue
 * ao error handler global (evitando que a requisição fique pendurada).
 * Já o try/catch aqui dentro serve para um propósito diferente: eu
 * QUERO capturar a falha de conexão com o banco e responder 503 de
 * forma controlada, em vez de deixar virar um erro 500 genérico.
 *
 * Ou seja: try/catch = "eu sei tratar esse erro específico".
 * asyncHandler = "rede de segurança para o que eu não previ".
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

export default app;