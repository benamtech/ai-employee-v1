# Production Runtime Implementation Research

Status: implementation-grounding - 2026-07-11

This note grounds the production-runtime implementation in the packages and infrastructure already
used by `mvp-build/`. It is a design guardrail for the P0/P1 deployability pass, not a live
acceptance record.

## Current stack inventory

- **Docker / Docker Compose** - required tenant isolation for employees and the chosen core-service
  supervisor for Caddy, Web, and Manager.
- **Caddy** - public reverse proxy for owner web, Manager webhooks/API, and per-employee gateway
  subdomains.
- **Hono + `@hono/node-server`** - Manager HTTP server, webhook surface, internal admin/API routes,
  SSE streaming, and testable `app.request()` route contracts.
- **Next.js 15** - owner/admin web app, API proxies, Work Surface SSE relay, and signed preview routes.
- **MCP SDK + MCP-UI** - Manager-as-MCP server for employee tools/resources and rich generated
  `ui://` resources rendered by the Work Surface.
- **Supabase / `pg`** - hosted Postgres, migrations, RLS, storage, runtime health, and proof ledgers.
- **Node fetch / Web Streams** - Manager runtime calls, provider calls, SSE parsing, and local model
  bridge OpenAI-compatible responses.

## Source-grounded design rules

- Docker Compose startup order: Compose only guarantees dependency containers have started unless a
  health condition is configured, so core dependencies use healthchecks and `condition:
  service_healthy`. Source: <https://docs.docker.com/compose/how-tos/startup-order/>.
- Docker restart and reboot recovery: fixed core services and dynamic employee runtimes use Docker
  restart policies, with `unless-stopped` as the first VPS default. Source:
  <https://docs.docker.com/engine/containers/start-containers-automatically/>.
- Docker logs: production containers must not grow logs without bound; use the `local` driver or
  explicit rotation options. Source: <https://docs.docker.com/engine/logging/configure/>.
- Docker networking: Caddy and dynamic employee containers share a user-defined bridge network so
  Caddy can resolve employee containers by DNS alias. Host-only localhost ports stay available for
  local smoke scripts. Source: <https://docs.docker.com/engine/network/drivers/bridge/>.
- Caddy reload: write snippets as candidates, validate the composed config, reload, and rollback on
  validation/reload/smoke failure so the old config remains active. Source:
  <https://caddyserver.com/docs/command-line#caddy-reload>.
- Hono streaming: Manager SSE routes should keep explicit stream error/abort handling and should not
  be wrapped by generic request timeouts that would break long-lived streams. Source:
  <https://hono.dev/docs/helpers/streaming>.
- Hono route design: keep `buildApp()` as the test boundary and use Hono route composition only where
  it reduces risk; avoid broad route refactors during deploy work. Source:
  <https://hono.dev/docs/api/hono>.
- Next deploy: prefer `output: "standalone"` for the Web production image so the runtime container can
  run the traced app without shipping the whole monorepo. Source:
  <https://nextjs.org/docs/app/api-reference/config/next-config-js/output>.
- MCP transport: Manager MCP remains authenticated Streamable HTTP on `/manager/mcp`; no employee
  container receives the global Manager bearer. Source:
  <https://modelcontextprotocol.io/specification/2025-06-18/basic/transports>.
- OpenAI-compatible tool calls: the local bridge must emit real `tool_calls`, including stream deltas
  with indexes, rather than JSON-as-text. Source:
  <https://platform.openai.com/docs/guides/function-calling>.

## Pass/fail gates

- **Research gate:** every selected package capability has a repo use case, source link, and explicit
  rejected alternative. Fail if implementation relies on folklore or hidden host state.
- **Networking gate:** public ingress is Caddy only; core services share a named Compose network;
  employees join the same runtime network with DNS aliases; host port publishing is loopback-only.
- **Caddy gate:** a bad snippet fails closed, restores the prior snippet state, attempts a rollback
  reload, and leaves provisioning failed with logs.
- **Lifecycle gate:** employee start/restart/stop/inspect/GC are idempotent and label-driven.
- **Tool-loop gate:** local proof records concrete local IDs for employee, Manager tool/audit,
  artifact, and approval. This is local proof only, not provider/runtime acceptance.
