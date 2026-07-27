import express, { Application, Request, Response } from 'express';
import { pool } from './database/pool';
import { asyncHandler } from './middlewares/asyncHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';

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

/**
 * A partir daqui, apenas middlewares de "fim de linha". A ordem é
 * estrita e não pode ser invertida:
 *
 * 1º notFoundHandler — captura qualquer requisição que não bateu com
 *    NENHUMA rota declarada acima (incluindo rotas que ainda serão
 *    adicionadas no futuro: elas devem SEMPRE ser registradas antes
 *    desta linha, nunca depois).
 *
 * 2º errorHandler — captura tanto o NotFoundError gerado acima quanto
 *    qualquer outro erro (`next(error)`) vindo de qualquer rota da
 *    aplicação. Precisa ser o ÚLTIMO app.use() do arquivo.
 */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;