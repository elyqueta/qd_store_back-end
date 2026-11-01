# syntax=docker/dockerfile:1

# ---------- Stage 1: dependências ----------
# bcrypt é um módulo nativo (compilado via node-gyp) e NÃO tem
# binário pré-compilado para Alpine/musl — precisa de toolchain de
# build. A toolchain vive SÓ neste stage; a imagem final não carrega
# compilador nenhum.
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
# Retries e timeouts acima do default: redes domésticas/intermitentes
# derrubam o npm ci com ETIMEDOUT (exit 146) no meio do download.
RUN npm ci \
  --fetch-retries=5 \
  --fetch-retry-mintimeout=10000 \
  --fetch-retry-maxtimeout=120000 \
  --fetch-timeout=600000

# ---------- Stage 2: build do TypeScript ----------
FROM node:20-alpine AS build
WORKDIR /app
# node_modules já compilado vem do stage deps (mesma base Alpine,
# binários compatíveis) — evita recompilar tudo de novo aqui.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# As migrations são JS puro (node-pg-migrate) e precisam existir no
# container para o entrypoint poder aplicá-las antes do boot.
COPY migrations ./migrations
COPY package.json ./

# Processo corre como utilizador sem privilégios.
USER node

EXPOSE 1914

CMD ["node", "dist/server.js"]
