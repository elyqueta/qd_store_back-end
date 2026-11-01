# QD Store Backend

API REST do QD Solutions — e-commerce de tecnologia para Angola.

- **Stack:** Node.js 20 + Express + TypeScript + PostgreSQL 16
- **Porta da API:** `1914` (host) → `1914` (container)
- **Porta do Postgres:** `5433` (host) → `5432` (container)
- Ambas publicadas em **dual-stack** (`127.0.0.1` e `[::1]`) para
  clientes que resolvem `localhost` para IPv6

## Pré-requisitos

- Docker 20.10+ e o plugin Compose v2 (`docker compose version`)
- Node.js 20 ou superior e npm (para executar a API localmente)

## Arranque rápido

1. Instalar dependências e preparar o ficheiro de ambiente:

   ```bash
   npm install
   cp .env.example .env
   ```

   Revê `DATABASE_URL`, `CORS_ORIGIN`, `CORS_ALLOW_LOCALHOST` e `JWT_SECRET`
   no `.env`. O exemplo destina-se a desenvolvimento local.
2. Iniciar o PostgreSQL:

   ```bash
   docker compose up -d
   ```

3. Aplicar migrations e carregar dados de teste:

   ```bash
   npm run migrate:up
   npm run seed
   ```

4. Iniciar a API:

   ```bash
   npm run dev
   ```

5. Noutro terminal, executar o smoke test:

   ```bash
   npm run smoke
   ```

   Para testar a API servida pelo Docker Compose, configura
   `API_URL=http://localhost:1914 npm run smoke`. O padrão do smoke test é
   `http://localhost:3000`.

Swagger/Scalar: `http://localhost:3000/api-docs` em desenvolvimento local ou
`http://localhost:1914/api-docs` no Docker Compose. O contrato detalhado para integração do
front-end está em [docs/API-CONTRACT.md](./docs/API-CONTRACT.md).

## Como subir os containers

Na raiz do projecto:

### Primeira vez (ou após alterar código/migrations)

```bash
docker compose up -d --build
```

### Arranque normal (imagem já construída)

```bash
docker compose up -d
```

### Parar

```bash
docker compose down
```

> Os dados do Postgres persistem no volume `qd_store_postgres_data` — o `down` não apaga a base de dados.

### Reiniciar após um `down`

```bash
docker compose start
```

## Verificar

```bash
docker compose ps
curl http://localhost:1914/health
```

Resposta esperada do health check:

```json
{ "status": "ok", "service": "qd-store-backend", "database": "connected" }
```

Endpoints úteis:

- `GET /api/v1/categories`
- `GET /api/v1/locations`

## Versionamento da API

Todas as rotas de domínio vivem sob o prefixo **`/api/v1`**:

| Recurso | Prefixo |
|---|---|
| Auth | `/api/v1/auth` |
| Categorias | `/api/v1/categories` |
| Empresas | `/api/v1/companies` |
| Admin | `/api/v1/admin` |
| Localidades | `/api/v1/locations` |
| Endereços | `/api/v1/addresses` |
| Produtos | `/api/v1/products` |
| Tipos de entrega | `/api/v1/delivery-types` |
| Métodos de pagamento | `/api/v1/payment-methods` |
| Carrinho | `/api/v1/cart` |
| Encomendas | `/api/v1/orders` |
| Wishlist | `/api/v1/wishlist` |
| Notificações | `/api/v1/notifications` |

A estrutura de pastas espelha a versão:

```
src/routes/
└── v1/
    ├── index.ts        # router agregador da v1 (monta os domínios)
    ├── auth.routes.ts
    └── ...
```

Em `app.ts`, a montagem é uma única linha — `app.use('/api/v1', v1Routes)`.
Uma futura v2 encaixa-se criando `src/routes/v2/` no mesmo formato e
montando sob `/api/v2`, sem tocar na v1. `/health` fica fora do prefixo
versionado de propósito (health check de orquestrador não deve quebrar
entre versões). Routers aninhados (`/products/:productId/images`,
`/companies/:companyId/users`) continuam montados dentro dos routers
pai, herdando o prefixo.

## Documentação

- **Local (dev):** `http://localhost:1914/api-docs` (com `npm run dev`)
- **No container:** `http://localhost:1914/api-docs` também está
  activo — o compose corre a API com `NODE_ENV: development` de
  propósito, para a doc ficar disponível sem parar o container. O
  spec está em `/openapi.json`.

> A documentação é gerada a partir dos comentários JSDoc das rotas.
> Para tal funcionar dentro do container, o `swagger-jsdoc` usa dois
> globs (`*.routes.ts` para dev e `*.routes.js` para a imagem
> compilada) — alterar o caminho dos ficheiros de rotas exige
> actualizar `src/config/swagger.ts`.
>
> **Tela branca ao abrir a docs:** o HTML da docs carrega o Scalar UI
> de um CDN (`cdn.jsdelivr.net`). Se não houver internet ou um proxy
> bloquear esse domínio, a tela fica branca — o spec em
> `/openapi.json` continua a funcionar normalmente. Abra o console do
> navegador (F12) para confirmar se há erro de carregamento do CDN.

## Notas de arquitetura do setup Docker

- **Migrations automáticas:** ao arrancar, o container da API executa
  `npm run migrate:up` antes de iniciar o servidor — o schema fica
  sempre actualizado sem passos manuais.
- **Rede interna:** a API liga-se ao Postgres pelo hostname
  `postgres:5432` (rede do Compose), não pelo `localhost:5433` do host.
  A porta 5433 existe apenas para clientes externos (psql, DBeaver).
- **Variáveis de ambiente:** a API recebe tudo via `environment:` do
  `docker-compose.yml`. O `.env` local **não** é copiado para a imagem
  (ver `.dockerignore`).
- **CORS local:** `CORS_ALLOW_LOCALHOST=true` permite qualquer porta em
  origens `localhost`, `127.0.0.1` e `[::1]` apenas em `development`.
  Mantém-se `false` por omissão; o Compose publica a API apenas em loopback.
- **JWT_SECRET:** o compose tem um default de desenvolvimento. Em
  produção, exporte antes de subir:

  ```bash
  export JWT_SECRET=$(openssl rand -base64 48)
  docker compose up -d
  ```
- **Build multi-stage:** o `Dockerfile` instala a toolchain de
  compilação apenas para o `bcrypt` (módulo nativo) num stage
  separado; a imagem final é Alpine sem compiladores e corre com o
  utilizador sem privilégios `node`.
- **`--build`** reconstrói a imagem — necessário quando muda código,
  `package.json` ou adiciona migrations. Sem ele, o compose reutiliza
  a imagem existente e arranca em segundos.

### `ECONNREFUSED ::1:1914` no API client, mas o browser funciona?

É IPv6. O Docker publica as portas em IPv4 por omissão, e clientes que
resolvem `localhost` para `::1` (Node 17+, WSL, Windows, clientes
containerizados) não encontram nada a escutar lá — daí o
`ECONNREFUSED ::1:1914`. O browser funciona porque implementa Happy
Eyeballs: tenta IPv6, falha, e cai imediatamente para IPv4.

O compose já publica em dual-stack para os dois serviços
(`127.0.0.1:1914:1914` + `[::1]:1914:1914`), o que resolve a maioria
dos casos. Se o teu cliente insistir, use o IP literal na URL:

```
http://127.0.0.1:1914/api/v1/categories
```

## Logs

```bash
docker compose logs -f api
docker compose logs -f postgres
```

## Logs

A aplicação usa **Pino**. Em desenvolvimento emite texto colorido e
legível no terminal; em produção emite JSON numa única linha, pronto
para ingestão por sistemas de log (Datadog, CloudWatch, ELK).

```bash
docker compose logs -f api
docker compose logs -f postgres
```

## Testes

Usa **Vitest**. Executar:

```bash
npm run test          # corre os testes uma vez
npm run test:watch    # modo watch
npm run test:coverage # com cobertura de código
```

## Desenvolvimento local sem Docker

```bash
cp .env.example .env
npm install
npm run dev
```

Requer um Postgres acessível em `localhost:5433` (por exemplo, subindo
apenas o serviço de base de dados: `docker compose up -d postgres`).
