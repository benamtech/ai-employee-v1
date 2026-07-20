ARG AMTECH_GIT_SHA=unknown
FROM caddy:2.10-builder-alpine AS builder
ARG AMTECH_GIT_SHA

RUN xcaddy build v2.10.0 \
  --with github.com/caddy-dns/cloudflare@v0.2.4

FROM caddy:2.10-alpine
ARG AMTECH_GIT_SHA
LABEL org.opencontainers.image.title="AMTECH Caddy" \
      org.opencontainers.image.revision="${AMTECH_GIT_SHA}" \
      ai.amtech.runtime="edge"

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
