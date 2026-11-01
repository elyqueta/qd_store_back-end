# Contrato da API — QD Store

> **⚠️ Os pagamentos estão SIMULADOS (`PAYMENT_GATEWAY=mock`). Não há cobrança real.**

Este contrato acompanha as rotas e os validators existentes. Os endpoints de domínio usam o prefixo
`/api/v1`; `/health`, `/api-docs` e `/openapi.json` são rotas de infraestrutura/documentação.

## 1. URL base, respostas e erros

- Desenvolvimento local: `http://localhost:3000`
- Docker Compose: `http://localhost:1914`
- Prefixo da API: `/api/v1`
- Sucesso: `{ "status": "success", "data": ..., "count?": ..., "pagination?": ... }`
- Erro: `{ "status": "error", "message": "...", "details?": ... }`
- Remoções com sucesso devolvem `204 No Content`.

| HTTP | Significado |
|---|---|
| 200 | Pedido concluído; inclui leituras e alterações com resposta. |
| 201 | Recurso criado. |
| 204 | Operação concluída sem corpo (remoção/logout). |
| 400 | Pedido válido em JSON, mas sem sentido no estado actual, por exemplo carrinho vazio. |
| 401 | Token ausente, inválido ou expirado; ou credenciais inválidas. |
| 403 | Utilizador autenticado sem permissão. |
| 404 | Recurso inexistente ou que pertence a outro utilizador. |
| 409 | Conflito com o estado actual do recurso. |
| 422 | Body, parâmetro ou query inválidos. |
| 429 | Limite de pedidos excedido. |
| 500 | Erro inesperado do servidor. |

Bodies são validados com schemas estritos quando aplicável; campos desconhecidos são rejeitados.
Preços e totais são sempre calculados no servidor.

## 2. Autenticação

1. Registar uma conta pessoal com `POST /api/v1/auth/register` ou iniciar sessão com
   `POST /api/v1/auth/login`.
2. Enviar o access token nas rotas protegidas:
   `Authorization: Bearer <accessToken>`.
3. Quando o access token expirar (401), chamar `POST /api/v1/auth/refresh` com o refresh token.
   A resposta emite um novo access token **e um novo refresh token**; substituir imediatamente o
   refresh token antigo pelo novo (rotação).
4. Terminar a sessão com `POST /api/v1/auth/logout`, enviando o refresh token actual.

O access token dura o valor de `JWT_ACCESS_EXPIRES_IN` (por defeito `15m`). O refresh token dura
`JWT_REFRESH_EXPIRES_IN_DAYS` dias (por defeito `7`).

## 3. Endpoints por domínio

`Público` não requer token. `Utilizador` requer access token. `Admin` requer access token com papel
`admin`. Os corpos de resposta abaixo mostram o formato de sucesso; os erros seguem a tabela acima.

### Auth

| Método e URL | Acesso | Body e resultado |
|---|---|---|
| `POST /api/v1/auth/register` | Público | `{ fullName, email, password, phone, accountType: "personal", nif? }` → `201`, `data: User`. |
| `POST /api/v1/auth/login` | Público | `{ email, password }` → `200`, `data: { user, accessToken, refreshToken }`; também pode responder 401/422/429. |
| `POST /api/v1/auth/refresh` | Público | `{ refreshToken }` → `200`, novo par de tokens; 401 se inválido/expirado. |
| `POST /api/v1/auth/logout` | Público | `{ refreshToken }` → `204`. |

### Categorias

| Método e URL | Acesso | Body e resultado |
|---|---|---|
| `GET /api/v1/categories` | Público | `200`, array de categorias e `count`. |
| `GET /api/v1/categories/:id` | Público | `200`, categoria; 404 se inexistente. |
| `POST /api/v1/categories` | Admin | `{ label, icon? }` → `201`; 409 se o slug já existir. |
| `PATCH /api/v1/categories/:id` | Admin | `{ label?, icon? }` → `200`; pelo menos um campo. |
| `DELETE /api/v1/categories/:id` | Admin | `204`; 409 se ainda tiver produtos associados. |

### Produtos, imagens e especificações

| Método e URL | Acesso | Body, parâmetros ou resultado |
|---|---|---|
| `GET /api/v1/products?page=1&limit=20&categoryId=&status=` | Público | `200`, produtos e `pagination`. |
| `GET /api/v1/products/:id` | Público | `200`, produto; 404 se inexistente. |
| `POST /api/v1/products` | Admin | `{ categoryId, name, price, description?, originalPrice?, badge? }` → `201`. |
| `PATCH /api/v1/products/:id` | Admin | Campos editáveis do produto, todos opcionais, pelo menos um. |
| `DELETE /api/v1/products/:id` | Admin | `204`; 409 quando o produto está referenciado. |
| `GET /api/v1/products/:productId/images` | Público | `200`, imagens ordenadas por `displayOrder`. |
| `POST /api/v1/products/:productId/images` | Admin | `{ url, displayOrder?, width?, height?, format?, sizeBytes? }` → `201`. |
| `PATCH /api/v1/products/:productId/images/:id` | Admin | Campos da imagem a alterar → `200`. |
| `DELETE /api/v1/products/:productId/images/:id` | Admin | `204`. |
| `GET /api/v1/products/:productId/specifications` | Público | `200`, especificações chave/valor. |
| `POST /api/v1/products/:productId/specifications` | Admin | `{ specKey, specValue, displayOrder }` → `201`. |
| `PATCH /api/v1/products/:productId/specifications/:id` | Admin | `{ specKey?, specValue?, displayOrder? }` → `200`. |
| `DELETE /api/v1/products/:productId/specifications/:id` | Admin | `204`. |

### Localizações

| Método e URL | Acesso | Resultado |
|---|---|---|
| `GET /api/v1/locations` | Público | `200`, 21 províncias com municípios. |
| `GET /api/v1/locations/provinces` | Público | `200`, províncias. |
| `GET /api/v1/locations/provinces/:province/municipalities` | Público | `200`, municípios do slug; 404 se a província não existir. |

### Endereços

Todas as rotas exigem utilizador autenticado e operam apenas sobre endereços próprios.

| Método e URL | Body e resultado |
|---|---|
| `GET /api/v1/addresses` | `200`, lista; o endereço padrão vem primeiro. |
| `GET /api/v1/addresses/:id` | `200`; 404 para endereço inexistente ou de outra pessoa. |
| `POST /api/v1/addresses` | `{ province, municipality, neighborhood, address, label?, reference?, latitude?, longitude? }` → `201`. |
| `PATCH /api/v1/addresses/:id` | Campos de endereço opcionais; `province` e `municipality` têm de ser enviados juntos. |
| `PATCH /api/v1/addresses/:id/default` | Sem body; define o endereço padrão. |
| `DELETE /api/v1/addresses/:id` | `204`. |

### Empresas e utilizadores da empresa

| Método e URL | Acesso | Body e resultado |
|---|---|---|
| `POST /api/v1/companies` | Utilizador | `{ name, nif, sector? }` → `201`; o criador é o proprietário. |
| `GET /api/v1/companies` | Admin | `200`, lista de empresas. |
| `GET /api/v1/companies/:id` | Proprietário/Admin | `200`; 404 se inexistente. |
| `PATCH /api/v1/companies/:id` | Proprietário/Admin | `{ name?, sector? }` → `200`. |
| `DELETE /api/v1/companies/:id` | Proprietário/Admin | `204` (desactivação). |
| `POST /api/v1/companies/:companyId/users` | Proprietário/Admin | `{ userId, role? }` → `201`; 409 se já associado. |
| `GET /api/v1/companies/:companyId/users` | Membro da empresa/Admin | `200`, associações da empresa. |
| `PATCH /api/v1/companies/:companyId/users/:userId` | Proprietário/Admin | `{ role }` → `200`. |
| `DELETE /api/v1/companies/:companyId/users/:userId` | Proprietário/Admin | `204`. |

### Tipos de entrega e métodos de pagamento

As leituras são públicas; a gestão de catálogo é administrativa.

| Método e URL | Acesso | Body e resultado |
|---|---|---|
| `GET /api/v1/delivery-types` | Público | `200`, tipos activos e `count`. |
| `GET /api/v1/delivery-types/:id` | Público | `200`; 404 se inexistente/inactivo. |
| `POST /api/v1/delivery-types` | Admin | `{ name, price, type, description? }` → `201`. |
| `PATCH /api/v1/delivery-types/:id` | Admin | Campos de entrega editáveis → `200`. |
| `DELETE /api/v1/delivery-types/:id` | Admin | `204` (desactivação). |
| `GET /api/v1/payment-methods` | Público | `200`, métodos activos e `count`. |
| `GET /api/v1/payment-methods/:id` | Público | `200`; 404 se inexistente/inactivo. |
| `POST /api/v1/payment-methods` | Admin | `{ name, type }` → `201`. |
| `PATCH /api/v1/payment-methods/:id` | Admin | `{ name?, type? }` → `200`. |
| `DELETE /api/v1/payment-methods/:id` | Admin | `204` (desactivação). |

Os valores de `PaymentMethod.type` são `multicaixa_express`, `multicaixa_reference` e
`bank_transfer`. Não há CRUD de configuração bancária por empresa nesta versão.

### Carrinho

Todas as rotas exigem utilizador autenticado; a identidade vem do token.

| Método e URL | Body e resultado |
|---|---|
| `GET /api/v1/cart` | `200`, cria carrinho vazio de forma preguiçosa quando necessário. |
| `POST /api/v1/cart/items` | `{ productId, quantity? }` (1–99, omissão = 1) → `201`; soma se já existir. |
| `PATCH /api/v1/cart/items/:itemId` | `{ quantity }` (1–99) → `200`, carrinho actualizado. |
| `DELETE /api/v1/cart/items/:itemId` | `204`; 404 se o item não pertencer ao carrinho. |
| `DELETE /api/v1/cart` | `204`, esvazia. |

`CartItem` inclui preço actual, subtotal, primeira imagem e estado do produto. Totalizações usam
cêntimos inteiros no servidor.

### Encomendas

| Método e URL | Acesso | Body e resultado |
|---|---|---|
| `POST /api/v1/orders` | Utilizador | `{ deliveryTypeId, paymentMethodId, addressId, companyId?, notes? }` → `201`. |
| `GET /api/v1/orders?page=1&limit=20&status=` | Utilizador | `200`, apenas as suas encomendas e `pagination`. |
| `GET /api/v1/orders/:id` | Dono | `200`; 404 para encomenda alheia. Inclui snapshot, histórico e resumo do pagamento mais recente. |
| `POST /api/v1/orders/:id/cancel` | Dono | `200`; só cancela encomenda em processamento sem pagamento confirmado. |
| `GET /api/v1/admin/orders` | Admin | `200`, paginação, filtros opcionais `status` e `userId`. |
| `GET /api/v1/admin/orders/:id` | Admin | `200`, encomenda completa. |
| `PATCH /api/v1/admin/orders/:id/status` | Admin | `{ status: "in_transit" \| "delivered" \| "cancelled", note? }` → `200`. |

O checkout valida endereço, entrega, método e associação empresarial, lê os preços actuais e grava
encomenda, snapshot, itens, histórico e limpeza do carrinho numa única transacção. `total` e `status`
não são aceites no body.

### Pagamentos

| Método e URL | Acesso | Body e resultado |
|---|---|---|
| `POST /api/v1/orders/:orderId/payments` | Dono | `methodType` discriminado; Express também exige `customerPhone`. → `201`, pagamento criado, mesmo se Express simulado falhar. |
| `GET /api/v1/orders/:orderId/payments` | Dono | `200`, tentativas da mais recente para a mais antiga. |
| `GET /api/v1/admin/orders/:orderId/payments` | Admin | `200`, histórico de pagamentos. |
| `POST /api/v1/admin/payments/:paymentId/confirm` | Admin | `{ notes? }` ou body omitido → `200`; confirma transferência ou simula webhook de referência. |
| `POST /api/v1/admin/payments/:paymentId/reject` | Admin | `{ notes? }` ou body omitido → `200`; rejeita pagamento pendente. |

Exemplos dos bodies:

```json
{ "methodType": "multicaixa_express", "customerPhone": "923111111" }
{ "methodType": "multicaixa_reference" }
{ "methodType": "bank_transfer" }
```

Uma tentativa pendente ou confirmada bloqueia outra tentativa. Uma tentativa Express falhada permite
nova tentativa. O gateway é invocado antes da transacção da base de dados.

### Wishlist e notificações

Todas as rotas exigem utilizador autenticado e isolam dados por utilizador.

| Método e URL | Body e resultado |
|---|---|
| `GET /api/v1/wishlist` | `200`, produtos guardados, mais recentes primeiro. |
| `POST /api/v1/wishlist` | `{ productId }` → `201` se novo, `200` se já existia. |
| `DELETE /api/v1/wishlist/:productId` | `204`, mesmo que não estivesse guardado. |
| `GET /api/v1/notifications?page=1&limit=20&unreadOnly=false` | `200`, lista paginada. |
| `GET /api/v1/notifications/unread-count` | `200`, `{ data: { count } }`. |
| `PATCH /api/v1/notifications/:id/read` | `200`; 404 para notificação alheia/inexistente. |
| `PATCH /api/v1/notifications/read-all` | `200`, `{ data: { updated } }`. |

`unreadOnly` aceita literalmente `true` ou `false`.

### Admin e infraestrutura

| Método e URL | Acesso | Resultado |
|---|---|---|
| `GET /api/v1/admin/companies` | Admin | `200`, empresas com utilizadores. |
| `GET /health` | Público | `200` com `database: "connected"` ou `503` quando a base de dados falha. |
| `GET /api-docs` | Fora de produção | Interface Scalar. |
| `GET /openapi.json` | Fora de produção | OpenAPI gerado das rotas. |

## 4. Checkout passo a passo

Use o prefixo de desenvolvimento `http://localhost:3000/api/v1` (ou altere para o host/porta
configurados). Os exemplos assumem um access token válido.

1. `GET /products?limit=5` → escolher um produto activo.
2. `POST /cart/items`:

   ```json
   { "productId": "UUID_DO_PRODUTO", "quantity": 2 }
   ```

3. `GET /cart` → mostrar itens, preço actual e total.
4. `GET /delivery-types` → escolher entrega activa.
5. `GET /payment-methods` → escolher método activo.
6. `GET /addresses` (ou `POST /addresses` para criar endereço) → seleccionar o endereço padrão ou
   outro endereço próprio.
7. `POST /orders`:

   ```json
   {
     "deliveryTypeId": "UUID_DA_ENTREGA",
     "paymentMethodId": "UUID_DO_METODO",
     "addressId": "UUID_DO_ENDERECO",
     "notes": "Entregar durante o horário comercial"
   }
   ```

   Exemplo de resposta resumida:

   ```json
   {
     "status": "success",
     "data": {
       "id": "UUID_DA_ENCOMENDA",
       "reference": "QD-20261101-A1B2C3",
       "status": "processing",
       "total": 702500,
       "items": [],
       "payment": null
     }
   }
   ```

8. `POST /orders/:id/payments` com o método escolhido:
   - Express: mostrar sucesso quando `status` é `confirmed`; mostrar a recusa simulada quando
     `failed`.
   - Referência: mostrar `details.entity`, `details.reference`, `amount` e `details.expiresAt`.
   - Transferência: mostrar `details.destinationIban`, `destinationBank`, `destinationHolder` e
     `amount`.
9. `GET /orders/:id` para acompanhar estado, histórico e resumo do pagamento.

## 5. Testar falhas da simulação

- Para forçar recusa do Multicaixa Express, enviar o telefone configurado em
  `PAYMENT_MOCK_FAIL_PHONE` (por defeito `900000000`). Uma nova tentativa com outro número é
  permitida depois da falha.
- Referência e transferência ficam `pending`. Um administrador pode confirmar em
  `POST /api/v1/admin/payments/:paymentId/confirm`; para referência, isto simula a confirmação do
  banco. Também é possível rejeitar com `POST /api/v1/admin/payments/:paymentId/reject`.
- Não são feitas cobranças, transferências nem chamadas a um gateway bancário real.

## 6. Variáveis de ambiente

| Variável | Descrição | Valor por defeito |
|---|---|---|
| `NODE_ENV` | Ambiente; a documentação Scalar não é servida em produção. | `development` |
| `PORT` | Porta HTTP da aplicação. | `3000` |
| `DATABASE_URL` | URL PostgreSQL obrigatória. | — |
| `CORS_ORIGIN` | Origens autorizadas, obrigatória. | — |
| `CORS_ALLOW_LOCALHOST` | Permite qualquer porta em origens de loopback, apenas em `development`. | `false` |
| `TRUST_PROXY` | Saltos de proxy confiáveis; `0` local, `1` para um proxy na cloud. | `0` |
| `RATE_LIMIT_WINDOW_MS` | Janela do limitador global da API em milissegundos. | `900000` |
| `RATE_LIMIT_MAX` | Pedidos por janela e IP. | `100` |
| `JWT_SECRET` | Segredo de assinatura JWT, mínimo 32 caracteres. | — |
| `JWT_ACCESS_EXPIRES_IN` | Duração do access token (formato `jsonwebtoken`). | `15m` |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | Duração do refresh token em dias. | `7` |
| `BCRYPT_SALT_ROUNDS` | Custo do hash da palavra-passe (10–15). | `12` |
| `PAYMENT_GATEWAY` | Gateway activo; actualmente apenas `mock`. | `mock` |
| `PAYMENT_MOCK_FAIL_PHONE` | Telefone que simula recusa Express. | `900000000` |
| `PAYMENT_REFERENCE_TTL_HOURS` | Validade da referência em horas. | `72` |
| `PAYMENT_MULTICAIXA_ENTITY` | Entidade de referência fictícia. | `00000` |
| `BANK_TRANSFER_IBAN` | IBAN fictício para a simulação. | `AO06000000000000000000000` |
| `BANK_TRANSFER_BANK` | Banco fictício para a simulação. | `Banco Exemplo` |
| `BANK_TRANSFER_HOLDER` | Titular fictício para a simulação. | `QD Solutions (DADOS FICTÍCIOS)` |

Os dados bancários e a entidade acima são fictícios e não devem ser usados em produção.

## 7. Credenciais de seed

Depois de `npm run seed`, a palavra-passe de teste é `Teste1234`:

- Admin: `admin@qd.co.ao`
- Cliente João: `joao.silva@example.com`
- Cliente Maria: `maria.santos@example.com`
- Conta empresarial: `empresa.tech@example.com`

## 8. Smoke test automático

Com a API em execução e a base de dados migrada/semeada:

```bash
npm run smoke
```

Por defeito, o script chama `http://localhost:3000`. Para outra origem:

```bash
API_URL=http://localhost:1914 npm run smoke
```

O teste verifica health check, login, catálogo, carrinho, checkout, Express, referência, confirmação
admin, autenticação, autorização e isolamento de encomendas entre utilizadores. Pode ser executado
repetidamente; limpa o carrinho antes de criar os fluxos de encomenda.
