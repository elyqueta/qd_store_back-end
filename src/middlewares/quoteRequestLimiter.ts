import { rateLimit } from 'express-rate-limit';
import type { Request, Response } from 'express';

export const quoteRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req: Request, res: Response) {
    res.status(429).json({
      status: 'error',
      message: 'Limite de pedidos de orçamento atingido. Tente novamente mais tarde.',
    });
  },
});
