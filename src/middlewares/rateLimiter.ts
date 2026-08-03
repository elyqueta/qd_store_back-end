import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';

/**
 * Rate limiter global, aplicado apenas ao prefixo `/api` (ver app.ts).
 *
 * Por que não aplicar também em `/health`?
 *
 * `/health` costuma ser chamado por ferramentas de infraestrutura
 * (load balancer, orquestrador, monitorização externa) em intervalos
 * curtos e regulares — é o tipo de tráfego que o rate limit NÃO deve
 * barrar, porque bloquear health checks pode fazer um orquestrador
 * (ex: Docker, Kubernetes) concluir erradamente que a aplicação está
 * fora do ar e reiniciá-la sem necessidade.
 *
 * Por que a resposta de erro segue o mesmo formato do errorHandler
 * global (`{ status: 'error', message }`)?
 *
 * Porque o rate limiter responde ANTES de qualquer rota ou
 * middleware de erro ser alcançado — ele intercepta a requisição e
 * responde diretamente. Se a estrutura da resposta fosse diferente
 * do resto da API, o cliente (front-end) precisaria de tratar "erro
 * de rate limit" como um caso especial, quebrando a promessa de
 * "todo erro da API tem o mesmo formato" que o errorHandler global
 * garante para os outros casos.
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,

  // Inclui os headers padronizados `RateLimit-*` (RFC atual) na
  // resposta, para que o cliente saiba quantas requisições ainda
  // tem disponíveis e quando a janela reinicia.
  standardHeaders: true,

  // Desliga os headers antigos `X-RateLimit-*`, não padronizados,
  // para não duplicar a mesma informação em dois formatos.
  legacyHeaders: false,

  handler(_req: Request, res: Response) {
    res.status(429).json({
      status: 'error',
      message: 'Muitas requisições. Tente novamente mais tarde.',
    });
  },
});
