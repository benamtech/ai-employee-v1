# Phase 4 hardening closure + next-session handoff

Date: 2026-07-10 00:12 EDT
Status: source-wired + targeted-test-green; live tool-loop still bridge-blocked
Scope: Closed/test-locked the deferred 4a-4d hardening items and prepared the next session for full production Phase 4 implementation plus Phase 5 groundwork where it shares event/materialization seams.

## What changed

- Added unit coverage for artifact signed-link auth: expired and revoked correctly scoped artifact links return `410 { error:"artifact_link_expired", expired:true }`; forged/wrong-scope links stay `403`; no access counter/audit row is written on denial.
- Added Stripe webhook coverage for unresolved invoice context: invoice events are stored with `processed=false`, do not emit `inbound_events`, and remain replayable/repairable instead of being finalized as benign duplicates.
- Added signed-link coverage for `decodeSignedToken`: expired-but-valid tokens return an `expired` flag, while `mintSignedToken` emits unique 24-hex-character CSPRNG `jti` values.
- Added Gmail Pub/Sub route coverage: a throwing `handle_gmail_pubsub` still returns `204` to avoid Pub/Sub retry storms and writes an `audit_log` failure row (`gmail_pubsub:handler_failed`).

The production code paths were already present in the dirty tree from the previous hardening pass: `server.ts`, `webhooks/stripe.ts`, `signed-links.ts`, and `webhooks/gmail.ts`. This pass locked them with tests rather than reworking the implementation.

## Why

These are owner/security correctness edges on the Phase 4 provider loop. External docs align with the implementation: Node `crypto.randomBytes` is appropriate for server-side token entropy; JWT-style decode should distinguish expired from malformed; Pub/Sub push endpoints should ack successful receipt with 2xx to avoid retry storms; Stripe webhooks are duplicate/out-of-order and need durable event IDs plus replayable unresolved rows.

## Current status

- 4a artifact expired/revoked `410`: source-wired + unit-covered.
- 4b Stripe unresolved invoice context `processed=false`: source-wired + unit-covered.
- 4c signed-link `jti` CSPRNG: source-wired + unit-covered.
- 4d Gmail Pub/Sub failure row while acking `204`: source-wired + unit-covered.
- Live Hermes employee tool loop remains blocked by the temporary model bridge; do not claim runtime/provider acceptance.

## Files / seams touched

- Tests: `tests/unit/artifact-resolve.test.ts`, `tests/unit/stripe-webhook.test.ts`, `tests/unit/signed-links.test.ts`, `tests/unit/gmail-pubsub.test.ts`.
- Memory: this file + `memory/MEMORY.md`.
- Relevant production seams already present: artifact resolve route, Stripe webhook recorder, signed-link token helpers, Gmail Pub/Sub route.

## Carry-forward / next

Next session should do a **full production implementation of Phase 4** from the actual code state, then lay **Phase 5 groundwork** where it naturally touches the same systems:

- Close the real Hermes tool-execution gate first: funded/usable model path, employee MCP tool calls executing as tool calls rather than JSON text, proof rows for artifact/approval/tool audit.
- Productionize Phase 4 around the real provider loop: Stripe test-mode invoice sent/paid webhook proof, Gmail reply-to-wake proof, approval gates, idempotent replay/repair, and owner-visible Work Surface/SMS behavior.
- Lay Phase 5 only at the shared seams: live `EmployeeEventStream`/SSE correctness, event batching/triage materialization, `WorkResource`/`WorkAction` consistency, and admin/repair observability for provider failures.
- Keep deliberately deferred items deferred unless Phase 4/5 work makes them load-bearing: SSE cursor same-ms skew, SSE unawaited progress writes, turn ping-pong-to-drain, secret-ref select-policy tightening, full atomic-counter RPC.

## Verification

Targeted local gate passed:

`npm run test:unit -- tests/unit/artifact-resolve.test.ts tests/unit/stripe-webhook.test.ts tests/unit/signed-links.test.ts tests/unit/gmail-pubsub.test.ts`

Result: 4 files / 30 tests passing.

Full local gates passed:

- `npm run typecheck`
- `npm run test:unit` — 59 files / 363 tests passing.
- `npm run lint`
- `npm run build`
