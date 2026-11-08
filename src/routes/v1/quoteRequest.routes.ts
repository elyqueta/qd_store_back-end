import { Router } from 'express';
import { quoteRequestController } from '../../controllers/quoteRequest.controller';
import { quoteRequestLimiter } from '../../middlewares/quoteRequestLimiter';
import { validate } from '../../middlewares/validate';
import { createQuoteRequestSchema } from '../../validators/quoteRequest.validator';

const router = Router();

/**
 * @openapi
 * /api/v1/quote-requests:
 *   post:
 *     tags: [Quote Requests]
 *     summary: Submete um pedido de orçamento empresarial
 *     description: Público e limitado a cinco submissões por endereço IP em cada janela de 15 minutos. A notificação por e-mail ou WhatsApp não está incluída nesta fase.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateQuoteRequestInput' }
 *     responses:
 *       201:
 *         description: Pedido registado para triagem.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/QuoteRequest' }
 *       422: { description: Dados inválidos, incluindo NIF, telefone ou localização. }
 *       429: { description: Limite de submissões atingido. }
 *       500: { description: Erro inesperado ao registar o pedido. }
 */
router.post(
  '/',
  quoteRequestLimiter,
  validate({ body: createQuoteRequestSchema }),
  quoteRequestController.create
);

export default router;
