# Inbound two-way surface, production DNS/TLS, and roles design docs complete

Date: 2026-07-11 17:05 EDT
Status: docs-only completion; no live gates upgraded
Scope: Part A inbound/two-way surface map, Part B production networking/DNS/TLS design, Part C roles/delegated-permissions design, CODEGRAPH source-map update

## What changed

- Added `docs/inbound-two-way-surface-map.md` as the standalone Part A source audit of the as-built inbound
  surface:
  - web owner turn -> Manager -> owner session -> turn queue -> Hermes -> MCP tools -> employee stream;
  - owner inbound SMS through Twilio directly into `deliverOwnerTurnToRuntime`, not through `events/ingress.ts`;
  - provider webhooks through `events/ingress.ts` + adapters, preserving the two-door invariant.
- Rewrote `docs/production-networking-and-dns.md` as the cited Part B design:
  - Cloudflare DNS-only records for apex/`www`/`api`/`agent`/static `*.agents`;
  - recommended Caddy wildcard DNS-01 using the Cloudflare DNS plugin and scoped token;
  - IPv4-first for Pod Alpha, with IPv6/AAAA deferred until the VPS/provider requirement is real;
  - explicit webhook ingress vs employee/Manager egress-default-deny separation.
- Tightened `docs/roles-and-delegated-permissions-design.md` as the deferred Part C design:
  - roles build last, after live provider/runtime and limited real-VPS proof;
  - reuse `account_memberships`; do not use `platform_user_roles` for customer account roles;
  - secretary example keeps requester != approver, with owner-routed approval;
  - Hermes per-turn authority is documented as a design against the local authoritative record and
    `hermes-client.ts`, with a live `/v1/capabilities` check as the build gate.
- Updated `CODEGRAPH.md` §3, §5, and the docs/source-map table to point to the three docs.

## Why

The outbound substrate has proof on a real Docker host. This pass mapped the other direction — a person or
provider coming in through public/web/SMS/provider surfaces and getting safe work back out — and defined the
public DNS/TLS and future delegated-authority model needed before production pilots scale beyond a single
founder-operated owner.

## Current status

- Inbound spine: `source-wired` by existing code; this pass is a source audit only.
- Production DNS/TLS: `planned`; no Cloudflare, DNS, Caddy image, token, or live cert operation was performed.
- Roles/delegation: `planned`; explicitly deferred to post-live-proof build.
- Provider/runtime acceptance: unchanged; no live proof ids added.

## Files / seams touched

- `docs/inbound-two-way-surface-map.md`
- `docs/production-networking-and-dns.md`
- `docs/roles-and-delegated-permissions-design.md`
- `CODEGRAPH.md`
- `memory/MEMORY.md`
- `memory/2026-07-11-1705-inbound-two-way-surface-production-dns-roles-docs-complete.md`

Key seams named for future build: `webhooks/twilio.ts`, `events/ingress.ts`, `employee-events.ts`,
`turn-queue.ts`, `turn-drain.ts`, `channel-router.ts`, `owner-session.ts`, `approval-policy.ts`,
`account_memberships`, `verified_phones`, `preview-links.ts`, `server.ts` `resolve_approval`,
`hermes-client.ts` `createRun`, and `X-Hermes-Session-Key`.

## Carry-forward / next

- P0 deploy foundation should implement the Cloudflare zone, static `*.agents.amtechai.com` DNS-only record,
  plugin-built Caddy image, scoped Cloudflare DNS token, and wildcard DNS-01 Caddy config.
- Keep IPv6 deferred unless the real VPS/provider requirement changes; if enabled, prove Docker daemon
  dual-stack and firewall behavior rather than only adding AAAA records.
- Build roles only after live provider/runtime proof and limited real-VPS tests. Before that build, query the
  running Hermes `/v1/capabilities` and re-check session-key/metadata behavior.

## Verification

- `git status -sb` confirmed the active scope is docs/memory/source-map files only.
- `test -e` spot-checked all cited local repo paths used by the three docs.
- `rg "\\[UNVERIFIED\\]" mvp-build/docs/production-networking-and-dns.md mvp-build/docs/roles-and-delegated-permissions-design.md` returned no matches.
- `rg "platform_user_roles|account_memberships|SMS_ALLOWED_USERS|resolve_approval|X-Hermes-Session-Key" mvp-build/docs/roles-and-delegated-permissions-design.md` confirmed the role boundary remains explicit.
- Re-read the Part D sequence against `second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md`; no sequencing conflict found.
