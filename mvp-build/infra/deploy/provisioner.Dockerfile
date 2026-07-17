FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package*.json ./
COPY apps/manager/package.json apps/manager/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/agent-template/package.json packages/agent-template/package.json
RUN npm ci

COPY . .
RUN npm run build --workspace @amtech/shared \
  && npm run build --workspace @amtech/db \
  && npm run build --workspace @amtech/manager

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates docker.io \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/manager ./apps/manager
COPY --from=build /app/packages ./packages
COPY --from=build /app/infra ./infra

CMD ["node", "apps/manager/dist/provisioner-host.js"]
