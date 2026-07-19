# AMTECH AI Employee — Canonical Source-Backed Architecture

Status: **[VERIFIED] source map; [INCOMPLETE] live deployment acceptance**

This directory is the current human-readable architecture index for the AMTECH AI Employee product. It describes the behavior present in source on `employee-production-tuesday`, separates implemented behavior from intended behavior, and points to the exact files that establish each claim.

The architecture is not a single agent process. It is a governed distributed system in which:

- **Web** presents owner, review, onboarding, and operator experiences.
- **Manager** owns identity, assignments, authority, context resources, tools, approvals, event routing, work materialization, durable commands, receipts, metering, and repair.
- **Hermes** supplies the per-employee reasoning runtime, session continuity, runs, tool use, memory, and runtime-local execution.
- **Model Gateway** is the employee-scoped model and commercial boundary.
- **Host Provisioner** is the only service with Docker-host authority.
- **PostgreSQL/Supabase** is the durable authority, event, commercial, evidence, and reconciliation substrate.
- **Caddy** is the public network ingress and per-employee reverse-proxy surface.
- **Provider adapters and the ambient inbox** convert at-least-once external events into verified, deduplicated, ordered, retryable work.

## Reading order

1. [`01-product-business-and-system-context.md`](01-product-business-and-system-context.md) — product purpose, actors, authority, commercial model, and system planes.
2. [`02-network-container-and-runtime-topology.md`](02-network-container-and-runtime-topology.md) — Docker, Caddy, loopback bindings, Unix socket, employee networks, Manager/Hermes communication, and trust boundaries.
3. [`03-ingress-events-ambient-inbox-and-egress.md`](03-ingress-events-ambient-inbox-and-egress.md) — provider ingress, verification, normalization, event routing, ambient inbox, effect receipts, retries, dead letters, and outbound effects.
4. [`04-hermes-context-capabilities-and-power-user-operation.md`](04-hermes-context-capabilities-and-power-user-operation.md) — Hermes sessions/runs, Manager MCP, business brain, context engineering, capability discovery, and power-user boundaries.
5. [`05-web-client-work-surfaces-and-tool-agnostic-ag-ui.md`](05-web-client-work-surfaces-and-tool-agnostic-ag-ui.md) — operating surface, SSE, stable intents, materialization, generated UI, sandboxed intent protocol, and action authority.
6. [`06-effect-graphs-failure-semantics-and-observability.md`](06-effect-graphs-failure-semantics-and-observability.md) — main effect chains, idempotency, receipts, ambiguity, compensation/repair boundaries, and observability state.
7. [`07-emergent-product-capability-and-use-case-manifold.md`](07-emergent-product-capability-and-use-case-manifold.md) — forced-dream interaction matrix mapping implemented primitives to product experiences and commercial capabilities.
8. [`08-repository-archaeology-audit-and-cleanup.md`](08-repository-archaeology-audit-and-cleanup.md) — exhaustive tracked-file inventory, relationship/effect extraction, defect taxonomy, confirmed cleanup, and artifact reproduction.
9. [`09-current-bug-risk-and-production-gap-register.md`](09-current-bug-risk-and-production-gap-register.md) — source-confirmed defects, incomplete production boundaries, live-proof requirements, and non-findings.

## Source authority order

When two artifacts disagree, use this order:

1. applied migration sequence and source implementation;
2. generated production source and build/deploy configuration;
3. tests and acceptance scripts;
4. this architecture directory;
5. `CODEGRAPH.md` and newest memory handoffs;
6. historical wiki, plans, and archived packets.

`mvp-build/CODEGRAPH.md` remains the chronological lane/checkpoint record. This directory is the cross-sectional runtime and product map. Neither substitutes for live exact-SHA deployment evidence.

## Verification tags

- **[VERIFIED]** — directly established by current source, migration, configuration, or test.
- **[STALE]** — a retained historical artifact or claim that no longer describes current source.
- **[INCOMPLETE]** — a source-wired boundary that lacks required implementation or live acceptance for the stated production use.
- **[UNVERIFIED]** — a mechanically detected candidate or product inference not yet confirmed by source-level intent and live evidence.

## Canonical subsystem map

| Plane | Durable or executable authority | Primary source hubs | Current tag |
|---|---|---|---|
| Identity and assignment | users, principals, memberships, assignments, grants, policies | `packages/db/migrations/0039_*`, `0053_*`, `0064_*`–`0069_*`; `lib/owner-assignment-authority.ts` | [VERIFIED] |
| Owner session | Supabase Auth → Manager-minted authority-versioned HttpOnly session | `apps/web/app/api/auth/login/route.ts`; `lib/owner-session.ts`; `onboarding-identity-routes.ts` | [VERIFIED] |
| Command/effect | durable command registration, claim, execution, terminal receipt | `packages/db/migrations/0041_*`; `lib/owner-turn-command.ts`; `lib/owner-turn-repair.ts`; tool runtime | [VERIFIED] |
| Runtime provisioning | desired resource graph, reconciler, signed Unix-socket provisioner request | `lib/provisioning-reconciler.ts`; `provisioner.ts`; `provisioner-host.ts`; `profile-renderer.ts` | [VERIFIED] source; [INCOMPLETE] deployed proof |
| Employee runtime | one rendered profile/workspace and one Hermes container per employee | `profile-renderer.ts`; `infra/scripts/local/start-hermes-container.sh`; `hermes-client.ts` | [VERIFIED] source |
| Network ingress | public Caddy → host-loopback Web/Manager/employee gateways | `infra/deploy/docker-compose.production.yml`; `infra/caddy/production.Caddyfile`; `caddy-activation.ts` | [VERIFIED] source; [INCOMPLETE] target-host proof |
| Model/commercial | employee token, assignment/payer/beneficiary/price claims, provider proxy, usage receipt | `model-gateway.ts`; `model-gateway-http.ts`; commercial migrations | [VERIFIED] core; [INCOMPLETE] cumulative budget/fleet rate enforcement |
| Provider ingress | signature verification → ambient inbox or normalized event ingress | `webhooks/*`; `events/ingress.ts`; `ambient-inbox.ts` | [VERIFIED] source |
| Context | profile memory, business brain, live Manager resources, session recall | `profile-context.ts`; `business-brain.ts`; `mcp-server.ts`; `operating-surface.ts` | [VERIFIED] |
| Work materialization | snapshots → envelopes/resources/actions/capabilities/tasks/layout | `employee-stream-strict.ts`; `employee-stream.ts`; `materialization.ts`; `operating-surface.ts` | [VERIFIED] |
| Generated UI | typed WorkView → Manager-compiled `ui://` resource → sandboxed iframe intent | `ui-resources.ts`; `generated-view.ts`; `McpUiResource.tsx`; `WorkObjectRenderer.tsx` | [VERIFIED] source; [INCOMPLETE] provider-backed live proof |
| Evidence and audit | hashes, audit rows, effect/provider/accounting receipts, work-run correlation | migrations; `audit.ts`; `metering.ts`; `commercial-attribution.ts` | [VERIFIED] source |
| Repository evidence | exact-head tracked-object inventory and graph bundle | `scripts/repository-archaeology-v2.mjs`; `.github/workflows/repository-archaeology.yml` | [VERIFIED] |

## Non-negotiable invariants

1. **Manager owns authority.** Hermes can reason and call bound tools; it cannot choose account, employee, assignment, principal, payer, beneficiary, policy, or approval authority.
2. **Reads are not effects.** Owner-safe reads do not register durable commands. Authoritative read failures fail closed rather than becoming empty state.
3. **Consequential work uses command/effect and approval boundaries.** Customer-facing, monetary, destructive, credential, or broad external actions cannot be represented as successful without the required authority and durable receipt.
4. **Provider master credentials stay outside employee profiles.** Employees receive scoped Manager MCP and Model Gateway credentials.
5. **Generated UI is presentation, not authority.** The host intersects iframe intents with the bound `WorkResource.actions` and resolves the durable resource itself.
6. **External delivery is at least once; internal effects are idempotent and receipt-backed.** Dedupe keys, leases, retries, effect receipts, ambiguity, and dead letters are explicit.
7. **Documentation claims are exact-SHA claims.** CI success does not imply an approved staging migration, provider acceptance, target-host networking acceptance, or launch clearance.
