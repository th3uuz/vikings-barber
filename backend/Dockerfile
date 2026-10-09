# syntax=docker/dockerfile:1

# Imagem de produção da API. Ao subir, o container aplica as migrations,
# roda o seed (que só cria o que falta) e inicia a API. Veja docker-entrypoint.sh.

FROM node:24-slim AS base
# O motor de migrations do Prisma precisa do OpenSSL.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Sem consulta de atualização do Prisma CLI.
ENV CHECKPOINT_DISABLE=1

FROM base AS build
COPY package.json package-lock.json prisma7.config.ts ./
COPY prisma ./prisma
# O postinstall roda "prisma generate" com o schema copiado acima.
RUN npm ci
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3333
COPY --from=build --chown=node:node /app/package.json /app/prisma7.config.ts ./
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node --chmod=755 docker-entrypoint.sh ./
USER node
EXPOSE 3333
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3333/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
ENTRYPOINT ["./docker-entrypoint.sh"]
