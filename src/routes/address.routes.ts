import { Router } from 'express';
import { addressController } from '../controllers/address.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import {
  addressIdParamSchema,
  createAddressSchema,
  updateAddressSchema,
} from '../validators/address.validator';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Addresses
 *   description: Gestão dos endereços de entrega do utilizador autenticado
 */

router.use(authenticate);

/**
 * @openapi
 * /api/addresses:
 *   post:
 *     tags: [Addresses]
 *     summary: Cria um novo endereço para o utilizador autenticado
 *     description: >
 *       O dono do endereço é sempre o utilizador do token de acesso
 *       (nunca informado no corpo ou na URL). Se este for o primeiro
 *       endereço do utilizador, ele é automaticamente marcado como
 *       padrão (isDefault: true).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAddressInput'
 *     responses:
 *       201:
 *         description: Endereço criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/Address' }
 *       401:
 *         description: Não autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: >
 *           Dados inválidos — inclui o caso de province/municipality
 *           não corresponderem a uma combinação real das 21
 *           províncias de Angola.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', validate({ body: createAddressSchema }), addressController.create);

/**
 * @openapi
 * /api/addresses:
 *   get:
 *     tags: [Addresses]
 *     summary: Lista os endereços do utilizador autenticado
 *     description: O endereço padrão (isDefault true) aparece sempre primeiro na lista.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de endereços.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 count: { type: integer, example: 2 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Address' }
 *       401:
 *         description: Não autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', addressController.findAll);

/**
 * @openapi
 * /api/addresses/{id}:
 *   get:
 *     tags: [Addresses]
 *     summary: Busca um endereço do utilizador autenticado pelo id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Endereço encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/Address' }
 *       401:
 *         description: Não autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: >
 *           Endereço não encontrado, ou pertence a outro utilizador
 *           (a API devolve 404 em ambos os casos, nunca 403, para
 *           não revelar a existência de ids de terceiros).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', validate({ params: addressIdParamSchema }), addressController.findById);

/**
 * @openapi
 * /api/addresses/{id}:
 *   patch:
 *     tags: [Addresses]
 *     summary: Atualiza parcialmente um endereço
 *     description: >
 *       province e municipality devem ser enviados JUNTOS, ou nenhum
 *       dos dois — não é permitido atualizar apenas um deles. Este
 *       endpoint nunca altera isDefault; use
 *       PATCH /api/addresses/{id}/default para isso.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAddressInput'
 *     responses:
 *       200:
 *         description: Endereço atualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/Address' }
 *       401:
 *         description: Não autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Endereço não encontrado ou pertence a outro utilizador.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Dados inválidos, payload vazio, ou combinação província/município inexistente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/:id',
  validate({ params: addressIdParamSchema, body: updateAddressSchema }),
  addressController.update
);

/**
 * @openapi
 * /api/addresses/{id}/default:
 *   patch:
 *     tags: [Addresses]
 *     summary: Define este endereço como o padrão do utilizador
 *     description: >
 *       Sem corpo de requisição. Executa uma transação de banco de
 *       dados: desmarca o endereço atualmente padrão (se existir) e
 *       marca este como o novo padrão, garantindo que existe sempre
 *       no máximo um endereço padrão por utilizador.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Endereço definido como padrão com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/Address' }
 *       401:
 *         description: Não autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Endereço não encontrado ou pertence a outro utilizador.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/:id/default',
  validate({ params: addressIdParamSchema }),
  addressController.setAsDefault
);

/**
 * @openapi
 * /api/addresses/{id}:
 *   delete:
 *     tags: [Addresses]
 *     summary: Remove um endereço (remoção física)
 *     description: >
 *       Seguro mesmo para endereços já usados em pedidos antigos: o
 *       histórico de pedidos guarda uma cópia própria dos dados de
 *       entrega (snapshot pattern em order_address) e não depende
 *       deste registo continuar a existir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Endereço removido com sucesso (sem conteúdo).
 *       401:
 *         description: Não autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Endereço não encontrado ou pertence a outro utilizador.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', validate({ params: addressIdParamSchema }), addressController.remove);

export default router;
