ARG AMTECH_GIT_SHA=unknown
FROM node:22-bookworm-slim
ARG AMTECH_GIT_SHA
LABEL org.opencontainers.image.title="AMTECH Model Gateway" org.opencontainers.image.revision="${AMTECH_GIT_SHA}" ai.amtech.runtime="model-gateway"
WORKDIR /app
ENV NODE_ENV=production
ENV AMTECH_GIT_SHA=${AMTECH_GIT_SHA}
COPY . .
RUN npm ci && npm run build --workspace @amtech/shared && npm run build --workspace @amtech/db && npm run build --workspace @amtech/manager && test -f apps/manager/dist/model-gateway-server.js
EXPOSE 8092
CMD ["node", "apps/manager/dist/model-gateway-server.js"]
