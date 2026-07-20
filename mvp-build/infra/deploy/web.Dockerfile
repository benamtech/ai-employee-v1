ARG AMTECH_GIT_SHA=unknown
FROM node:22-bookworm-slim AS build
ARG AMTECH_GIT_SHA
WORKDIR /app
ENV MANAGER_API_ORIGIN=http://manager:8080

COPY package*.json ./
COPY apps/manager/package.json apps/manager/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/agent-template/package.json packages/agent-template/package.json
RUN npm ci

COPY . .
RUN npm run build --workspace @amtech/shared \
  && npm run build --workspace @amtech/web

FROM node:22-bookworm-slim AS runtime
ARG AMTECH_GIT_SHA
LABEL org.opencontainers.image.title="AMTECH Web" \
      org.opencontainers.image.revision="${AMTECH_GIT_SHA}" \
      ai.amtech.runtime="web"
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV MANAGER_API_ORIGIN=http://manager:8080
ENV AMTECH_GIT_SHA=${AMTECH_GIT_SHA}

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
