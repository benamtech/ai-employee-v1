ARG AMTECH_GIT_SHA=unknown
FROM node:22-bookworm-slim AS build
ARG AMTECH_GIT_SHA
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
  && npm run build --workspace @amtech/manager \
  && test -f apps/manager/dist/provisioner-host.js \
  && test -f apps/manager/dist/server.generated.js

FROM node:22-bookworm-slim AS runtime
ARG AMTECH_GIT_SHA
LABEL org.opencontainers.image.title="AMTECH Host Provisioner" \
      org.opencontainers.image.revision="${AMTECH_GIT_SHA}" \
      ai.amtech.runtime="host-provisioner"
WORKDIR /app
ENV NODE_ENV=production
ENV AMTECH_GIT_SHA=${AMTECH_GIT_SHA}

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates docker.io \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/manager ./apps/manager
COPY --from=build /app/packages ./packages
COPY --from=build /app/infra ./infra

RUN test -f apps/manager/dist/provisioner-host.js \
  && test -f apps/manager/dist/server.generated.js

CMD ["node", "apps/manager/dist/provisioner-host.js"]
