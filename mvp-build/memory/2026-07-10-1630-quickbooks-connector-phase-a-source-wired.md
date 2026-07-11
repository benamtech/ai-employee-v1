# QuickBooks Online connector — Phase A0-A6 source-wired

Date: 2026-07-10 16:30
Status: `source-wired`; live provider/runtime proof `pending` (no Intuit sandbox exercised — all mocked)
Scope: full Phase A implementation of the native QuickBooks Online connector, per the three planning
docs written earlier this session (`docs/quickbooks-connector-*.md`). Application source + schema +
tests + docs/harness updates. Built end-to-end in one pass, in dependency order, vertical slice first.

## What changed

New Manager tool family `qbo.stub.ts` mirroring `gmail.stub.ts`/`stripe.stub.ts` — not a bolted-on MCP
subprocess. QuickBooks inherits everything already proven (Manager-as-MCP dispatch, secrets-by-
reference, the owner-approval gate, audit, capability registry/materialization, the event mesh, the
per-employee scoped MCP credential boundary).

**A0 — contracts/schema/policy** (`packages/shared/src`): 20 new `ToolName`s + `TOOL_PHASE` entries
(phase 6) + input types (`tool-contracts.ts`); zod schemas (`tool-schemas.ts`) — `commit_quickbooks_write`
is a deliberate `.strict()` exception to the file's default `.passthrough()` convention;
`QBO_WRITE_ACTION_KEY_GROUPS` as its own peer array in `approval-policy.ts` (spread into
`OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS`, **not** folded into the send-specific
`SEND_GATE_ACTION_KEY_GROUPS`); `"accounting"` added to `CapabilityCategory` (+ the `AbilitySummary`
category union). Migration `0026_quickbooks_connector.sql`: additive `connector_accounts` columns
(`environment`, `realm_id`, `external_label`, `token_refresh_lease_until`) + Manager-only RLS-on
`quickbooks_pending_writes` and `inbound_qbo_events`.

**A1 — connector lifecycle**: `qbo-tokens.ts` (`intuit-oauth` owns OAuth/refresh, sealed by reference,
concurrency-safe via an atomic `token_refresh_lease_until` compare-and-swap on the connector row — one
row, one lock, so no separate lock table needed); `qbo-client.ts` (the sole REST boundary over
`@apigrate/quickbooks`, Accounting-API methods only, fresh connector per call, `qboRawFetch` escape
hatch, `apigrate-quickbooks.d.ts` narrow ambient types since @apigrate ships none); `connect_quickbooks`
/`complete_quickbooks_oauth` (captures `realmId` from the callback) /`run_quickbooks_connector_test`;
OAuth callback + registry registration.

**A2 — entity resolution**: `qbo-lookup.ts` — TTL-cached per-connector name→id maps; exact match
resolves, ambiguous/zero returns `needs_disambiguation`/`not_found` (never a best-guess pick).

**A3 — write tools + the approval-binding security bar**: four write previews (`create_expense`→Purchase,
`create_bill`, `create_invoice`, `create_payment`) each stage a `quickbooks_pending_writes` row, open an
approval, and bind the returned `approval_id` onto the row (set once). `commit_quickbooks_write` is the
ONLY path that writes: it verifies `row.approval_id === supplied approval_id` (the confused-deputy fix —
not merely "some approval says approved"), requires `approval.resolution === 'approved'`, atomically
compare-and-swaps `pending_approval→committing`, recomputes a payload-hash tamper check, then executes
exactly once. Gotchas encoded as validated logic in `qbo-gotchas.ts` (PaymentType, single-department
expense, sparse-update required fields, expense-ref preservation, SyncToken staleness, JE balance).

**A4 — read surface**: `qbo-query.ts` (generic query builder with per-entity filterable-fields whitelist
+ single-quote rejection = injection boundary; report flattening) + `query_quickbooks` + four reports
(P&L, Balance Sheet, Aged Receivables/Payables).

**A5 — event mesh**: `webhooks/quickbooks.ts` (CloudEvents-native with legacy fallback; HMAC verify;
per-realm fan-out; dedupe via `inbound_qbo_events`) + `events/adapters/quickbooks.ts` (external-door
adapter; QBO record text treated as untrusted data — lethal-trifecta; stated in workspace
`AGENTS.md`/`manager-tools.md`).

**A6 — capability registry**: `MANAGER_TOOL_META` + `statusForTool` (QBO branch BEFORE the Stripe
`invoice`/`payment` substring branch, via a `QBO_TOOL_NAMES` set derived from the meta table) +
`setupFor` — zero new UI; renders through the existing generic materialization path.

**Harness + docs**: `infra/scripts/acceptance/run10-quickbooks.mjs` (+ `_env.mjs` RUN 10, `report.mjs`
module, `preflight.mjs` bucket); `.env.example` QBO block; `mcp-server.ts` `TOOL_DESCRIPTIONS`;
`CODEGRAPH.md` (source map + status + priority + migration/acceptance rows); `wiki/offers/wedge-offers.md`
(tier now "built — source-wired"); the three QBO docs flipped `planned`→`source-wired` with an as-built
deviation note.

## Why

Ben asked to actually build the connector (the prior session was docs-only) so the MVP is ready for the
next phase: extensive live testing with real API providers, onboarding, and AMTECH OAuth credentials.
QuickBooks is the default small-business accounting tool across the whole beachhead and the bookkeeper's
whole world — it belongs in the connector ladder alongside Gmail/Stripe.

## Deviations from the pre-build plan (all honest, documented in the impl-plan's as-built note)

1. Acceptance verifier is **`run10-quickbooks.mjs`**, not `run9` — `run9-live-employee.mjs` already
   existed.
2. Refresh-lock is an **atomic `connector_accounts.token_refresh_lease_until` CAS**, not a separate lock
   table (one connector row = one lock).
3. `create_expense`'s payload does **not** yet set the header paid-from `AccountRef` (bank/CC account) —
   a second account beyond the slice's Vendor+Account scope; Phase-A-live/Phase-B. Live acceptance is
   pending regardless.
4. `qbo-client.test.ts` mocks the `@apigrate` `QboConnector` boundary rather than node-fetch: node-fetch
   is externalized by vitest and can't be intercepted without hitting live Intuit; the mocked-HTTP
   correctness bar is met via that boundary + the pending live harness.

## Files / seams touched

New source: `apps/manager/src/tools/qbo.stub.ts`; `apps/manager/src/lib/{qbo-tokens,qbo-client,qbo-lookup,qbo-query,qbo-gotchas}.ts`
+ `apigrate-quickbooks.d.ts`; `apps/manager/src/webhooks/quickbooks.ts`; `apps/manager/src/events/adapters/quickbooks.ts`;
`packages/db/migrations/0026_quickbooks_connector.sql`; `infra/scripts/acceptance/run10-quickbooks.mjs`.
Edited: `packages/shared/src/{tool-contracts,tool-schemas,approval-policy,materialization,resource-payload,ids,routes,event-types}.ts`;
`apps/manager/src/{server.ts,lib/capability-registry.ts,lib/mcp-server.ts,lib/oauth-state.ts,tools/registry.ts,events/adapters/index.ts}`;
`apps/manager/package.json` (+`intuit-oauth@4.2.3`, `@apigrate/quickbooks@4.6.0`);
`packages/agent-template/workspace/{AGENTS.md,manager-tools.md}`; `.env.example`; acceptance `_env/report/preflight`.
New tests: `tests/unit/qbo-{gotchas,query,lookup,client,tools,webhook}.test.ts`; extended
`tests/unit/{approval-policy,run-tool,tool-contracts,event-adapters,event-bus}.test.ts`.

Seams the next (live) phase plugs into: the existing connector/secrets/oauth-state/run-tool/mcp seams
(reused, not forked); `run10-quickbooks.mjs` for provider proof; migration `0026` to apply live.

## Carry-forward / next (this is the live-testing phase Ben named)

- Register an Intuit developer app (developer.intuit.com), fill the `QBO_*` env from `.env.example`,
  apply migration `0026` live, then run the sandbox handshake → approved `create_expense` →
  `commit_quickbooks_write` → webhook path; capture real proof via `run10-quickbooks.mjs` to move QBO
  to `provider-accepted`.
- **Re-verify against Intuit's live docs before relying on them** (both are `[VERIFY AT IMPLEMENTATION]`
  in the gotchas ledger): the CloudEvents webhook envelope shape + the 2026-07-31 mandatory cutover
  (may have passed/shifted), and the current refresh-token rotation policy.
- Phase B (remaining entities incl. void-vs-delete, `/cdc` reconciliation sweep, sandbox↔prod per-
  connector switch) and Phase C (Local Companion / computer-use for QBO Desktop) remain `planned` —
  write their own plans when their turn comes (one-phase-per-plan).
- Two open gaps unchanged by this pass (named in the architecture doc): one-QuickBooks-company-per-
  employee (`connector_accounts` `unique(employee_id, connector_key)`), and no batch-approval pattern
  for high-volume categorization.

## Post-build self-review (xhigh multi-angle) + fixes

Ran a full `/code-review` on the just-written code before committing. It surfaced 8 findings; the top
one was a **production-breaker the unit tests structurally could not catch**. Fixed findings #1-#4 (and
#8) before commit:

1. **CRITICAL — jsonb key reordering broke the payload-hash gate.** `canonical_payload` was `jsonb`;
   the commit re-hashes the round-tripped value, but Postgres jsonb normalizes/reorders keys, so the
   recomputed hash would NEVER match → **every live QBO commit would fail its integrity check and mark
   the row `failed`.** The fake supabase preserved JS key order, so all commit tests passed while
   production would be 100% broken. Fix: store `canonical_payload` as `text` (exact serialized bytes,
   byte-identical round-trip), hash that string, `JSON.parse` it before the QBO call. Migration `0026`
   column changed `jsonb`→`text`; `payloadHash`→`sha256Hex(serialized)`; tests store/re-hash the string.
2. **Webhook dropped events when two accounts share one QuickBooks company.** `realm_id` is not unique
   across `connector_accounts`; `.maybeSingle()` would error on >1 match. Fix: match ALL connectors on
   the realm and deliver per-connector (new multi-connector test).
3. **Query filter guard rejected single quotes but not backslashes** → `\'` escape could break out of
   the literal. Fix: reject both (new backslash test).
4. **A DB failure AFTER a successful QBO write mislabeled the row `failed`.** Fix: split commit into
   "external write" (a failure here marks `failed`, with `reqid`=pending-write-id for Intuit-side
   idempotency) vs. "persist committed" (a failure here returns `ok` with `persist_deferred`, leaves the
   row `committing` for reconciliation — never hides a real write). New fault-injection test.
5. **Migration `0026` now REVOKEs anon/authenticated grants** on both new tables (matching `0025`), so
   protection is RLS-no-policy AND no Data-API privilege.

Findings #5-#7 (contended-refresh poll window shorter than a real refresh; `qbo-lookup` silent 1000-cap
with no paging/log; unbounded module-level lookup cache) were left as documented follow-ups — real but
lower-severity, and better addressed alongside Phase B breadth/reconciliation. See the review output.

## Verification

Local gates green after the fixes: `npm run typecheck` (clean across all workspaces),
`npm run test:unit` (**74 files / 478 tests** — 6 new QBO test files + extensions; +3 for the fix
regressions), `npm run build`, `npm run lint`. `npm run test:integration` skips cleanly (6 files / 11
env-gated). `npm run acceptance:preflight` shows Run 10 BLOCKED (no creds) and `acceptance:report`
shows it NOT-RUN — honest, no fabricated proof. Migration `0026` NOT yet applied live; no Intuit
sandbox exercised — everything mocked. Security bar proven by unit tests: the approval-reuse/
confused-deputy denial (`approval_id` mismatch rejected), the concurrent-commit compare-and-swap
(exactly one QBO write), the tampered-payload-hash denial, the `.strict()` commit-schema rejection of
extra fields, the serialized-text hash round-trip, the persist-after-success non-failure, the
multi-connector webhook fan-out, the backslash-injection rejection, and every gotchas rule.
