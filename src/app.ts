import express, { Application, Request, Response } from 'express';

/**
 * app.ts é responsável APENAS por configurar a instância do Express:
 * middlewares globais, rotas, error handler.
 * Ele NÃO inicia o servidor (isso é responsabilidade do server.ts).
 *
 * Por que separar app de server?
 * Testes automatizados (ex: supertest) importam o "app" diretamente,
 * sem precisar abrir uma porta de rede real. Se app.listen() estivesse
 * misturado aqui, cada teste abriria uma porta, o que é lento e frágil.
 */
const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Rota de health check.
 * Serve para confirmar que a API está de pé, sem depender do banco
 * ainda (o banco entra no passo 5 do plano).
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'qd-store-backend',
    timestamp: new Date().toISOString(),
  });
});

export default app;