# QuickBooks Connector Implementation — Session Handoff Prompt

Status: active handoff prompt

Date: 2026-07-10

Use this prompt to start an implementation session whose only job is the full QuickBooks
connector build (`docs/quickbooks-connector-architecture.md` +
`docs/quickbooks-connector-implementation-plan.md` + `docs/quickbooks-api-gotchas.md`), ahead of
returning to the current Phase 4/5 loose ends. This session does **not** touch the Phase 4/5
backlog — it is named explicitly below so a fresh agent doesn't get pulled into it.

```text
You are an implementation agent working in `/home/georgej/AMTECH/GTM-RESEARCH`.

Goal: implement the QuickBooks Online connector end to end, per the three planning docs already
written under `mvp-build/docs/`. This is its own self-contained workstream — do not also attempt
to close the current Phase 4/5 loose ends in this session (named explicitly below); they stay
exactly as documented and pending.

Read first, in this order:

1. `identity.md`
2. `CODEGRAPH.md`
3. `mvp-build/CODEGRAPH.md` (note the "Next named connector (planned, 2026-07-10)" line and the
   docs table entries for the three QuickBooks docs)
4. `mvp-build/CLAUDE.md` / `mvp-build/AGENTS.md`
5. `mvp-build/memory/MEMORY.md`, then at minimum the two newest relevant dated handoffs:
   `2026-07-10-1500-quickbooks-connector-research-and-architecture-plan.md` (the research/decision
   record for this exact workstream) and `2026-07-10-1153-phase-5-admin-ops-source-wired.md`
   (context for what NOT to touch this session)
6. `mvp-build/docs/quickbooks-connector-architecture.md` — full architecture, including the
   Capabilities Summary/Example User Journeys section and its two named open gaps
   (multi-client-per-employee connections; batch approval)
7. `mvp-build/docs/quickbooks-connector-implementation-plan.md` — the decision-complete Phase
   A0-A6 build sequence, including the "Fastest path to first live write" vertical-slice section
8. `mvp-build/docs/quickbooks-api-gotchas.md` — QBO API limitations to encode as validated logic,
   not documentation
9. `wiki/offers/wedge-offers.md` connector-tiers table (the "Employee · + QuickBooks" row this
   work is building toward)
10. The pattern being mirrored, read in full before writing anything new:
    `mvp-build/apps/manager/src/tools/gmail.stub.ts`, `mvp-build/apps/manager/src/tools/stripe.stub.ts`,
    `mvp-build/apps/manager/src/lib/secrets.ts`, `mvp-build/apps/manager/src/lib/oauth-state.ts`,
    `mvp-build/apps/manager/src/lib/gmail-tokens.ts`, `mvp-build/apps/manager/src/lib/mcp-server.ts`,
    `mvp-build/apps/manager/src/lib/run-tool.ts`, `mvp-build/apps/manager/src/lib/capability-registry.ts`,
    `mvp-build/packages/shared/src/approval-policy.ts`, `mvp-build/packages/shared/src/tool-schemas.ts`,
    `mvp-build/apps/manager/src/events/ingress.ts` and one adapter under `events/adapters/`

Context:

QuickBooks Online (QBO) is the default small-business accounting tool across the whole beachhead
(painting/landscaping contractors of every size, not just larger shops) and is Beachhead #2
bookkeepers' entire world. The architecture decision, already made and documented: build
QuickBooks as a new Manager tool family (`qbo.stub.ts`) mirroring `gmail.stub.ts`/`stripe.stub.ts`
exactly — not a bolted-on MCP subprocess, not either reference repo's runtime
(`intuit/quickbooks-online-mcp-server`, `laf-rge/quickbooks-mcp`). Every QBO write goes through
the existing `request_approval`/`resolve_approval` gate — never a model-controlled draft/confirm
boolean (both reference repos' weaker pattern, deliberately not adopted). Entity references are by
name with disambiguation, never by raw QBO id. The webhook adapter must be built CloudEvents-native
given Intuit's mandatory cutover deadline (2026-07-31 at research time — re-verify this hasn't
already passed or shifted before building it).

Explicitly out of scope for this session (already documented, already pending, do not touch):

- Phase 4/5 loose ends: applying live migrations `0022`-`0025`, seeding a real platform operator
  row, reprovisioning an employee to prove scoped MCP auth, closing the live Hermes
  tool-execution gate with a real model loop, provider-proving Phase 3 SMS previews and Phase 4/5
  materialization/admin readiness, egress control.
- Phase B breadth (remaining QBO entity types beyond Phase A's core set, `/cdc` reconciliation
  sweep, sandbox↔production per-connector switch) and Phase C (the future Local Companion/
  computer-use bridge) — named in the architecture doc but out of scope here; only plan them in
  file-level detail once this session's Phase A actually lands.

Sequencing (do not skip the vertical slice to jump straight to full breadth):

1. Phase A0 shared contracts/schema: new `ToolName`s + zod schemas in
   `packages/shared/src/tool-contracts.ts`/`tool-schemas.ts`; `QBO_WRITE_ACTION_KEY_GROUPS` as its
   own peer array in `packages/shared/src/approval-policy.ts` (spread directly into
   `OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS` — do **not** fold into `SEND_GATE_ACTION_KEY_GROUPS`,
   which is scoped by its own doc comment to customer/money-facing sends, not QBO writes); additive
   `connector_accounts` columns (`environment`, `realm_id`, `external_label`) plus the new
   Manager-only `quickbooks_pending_writes` (the approval-binding source of truth) and
   `inbound_qbo_events` (webhook/CDC dedupe) tables, via a new migration
   (`packages/db/migrations/00NN_quickbooks_connector.sql` — check the current highest migration
   number first, it may be past `0025` by the time this runs).
2. The vertical slice from `quickbooks-connector-implementation-plan.md`'s "Fastest path to first
   live write" section: `intuit-oauth`-based connector lifecycle
   (`connect_quickbooks`/`complete_quickbooks_oauth`/`run_quickbooks_connector_test`), a
   `qbo-client.ts` wrapping `@apigrate/quickbooks`'s `QboConnector` for its Accounting-API methods
   only (per the plan's Client Library Decision — `intuit-oauth` owns OAuth/refresh, this library
   is used only for entity/query/report calls, one instance built per call from the connector's
   sealed token — never a long-lived singleton), a minimal `qbo-lookup.ts` scoped to Vendor+Account
   only, and ONE write tool end to end through the real approval gate and the
   `quickbooks_pending_writes` binding: `create_expense` (QBO `Purchase`). Prove this slice with
   real unit tests before widening scope.
3. Then Phase A1-A6 in full per the implementation plan: remaining core write tools (Bill,
   Invoice, Payment, Deposit, Journal Entry, Bill Payment), full `qbo-lookup.ts` (Customer, Item,
   Class, Department), the generic whitelisted `query_quickbooks` tool + core reports (P&L,
   Balance Sheet, Aged Receivables/Payables), the CloudEvents webhook adapter + dedupe table if
   needed, and capability-registry/materialization wiring (verify via `npm run ui:test` that no
   new UI component code is needed).

Non-negotiables (carry over from every existing connector):

- Secrets by reference only (`lib/secrets.ts`) — no raw QBO token/realm anywhere but a sealed
  `token_secret_ref`.
- No write tool may reach the QBO client without a prior `approved` resolution tied to *that
  specific* `quickbooks_pending_writes` row — verify `pending_write.approval_id === approval_id`
  supplied to `commit_quickbooks_write`, not merely "some approval says approved." This is the one
  property to test hardest, since it's the exact confused-deputy gap both reference repos leave
  open with their model-flippable draft/confirm boolean.
- `commit_quickbooks_write`'s zod schema is `.strict()` (a deliberate, commented exception to this
  codebase's default `.passthrough()` convention) — it accepts only
  `pending_write_id`/`approval_id`/identity, no entity payload fields at all.
- Every gotchas-ledger rule (`quickbooks-api-gotchas.md`) is a dedicated unit test, not a comment:
  stale SyncToken, unbalanced JE, missing sparse-update required fields, multi-department expense
  rejection, non-filterable query field rejection, query string-literal escaping.
- Neither `intuit-oauth` nor `@apigrate/quickbooks` ships usable TypeScript types for how thinly
  they're used here — hand-roll a narrow `.d.ts` for exactly the methods called, contained
  entirely inside `qbo-client.ts`; don't let `any` leak further than that one file.
  `@apigrate/quickbooks` also has no automated test suite of its own, so `qbo-client.ts`'s unit
  tests (against a mocked HTTP layer) are the real correctness coverage for this integration.
- Do not fabricate provider proof. Building this without a real Intuit developer sandbox
  account/app is expected and fine — build and unit-test the full connector against a mocked QBO
  client (matching the existing "work out the project before env" convention already used for
  Gmail/Stripe/Twilio), and leave provider/runtime acceptance explicitly `pending`. If a sandbox
  account does exist or gets provisioned this session, real proof ids are welcome but not required
  to consider Phase A "source-wired."
- No new browser-readable Supabase table/view without reviewing Data API exposure + RLS + grants
  (the new migration's additive columns and any new dedupe table).

Required local checks from `mvp-build/`:

- `npm run typecheck`
- `npm run test:unit`
- `npm run lint`
- `npm run build`
- `npm run test:integration` (env-gated; should skip cleanly without live Supabase/QBO creds)

Required targeted tests (from the implementation plan's pass/fail table — treat each row as a
concrete test, not a suggestion):

- Connector lifecycle: OAuth state can't be forged into an owned connector; connector test fails
  without a valid, refreshed token.
- Entity resolution: no code path resolves an ambiguous name to a single id without an exact
  match; ambiguous/zero matches return a structured `needs_disambiguation` result.
- Write tools: preview-without-approval never calls the QBO client; commit is denied when the
  supplied `approval_id` doesn't match the pending write's own stored `approval_id` (the specific
  confused-deputy/approval-reuse test — not just "commit without any approval"); commit is denied
  when the matched approval isn't `approved`; two concurrent commit attempts against one approved
  row produce exactly one QBO call (proves the compare-and-swap claim).
- Gotchas-ledger rules: each one individually tested (see above).
- Query tool: a non-filterable-field filter is rejected client-side before any API call; a crafted
  string-literal filter value cannot alter query structure.
- Event mesh (if reached this session): a webhook event is never trusted without HMAC
  verification; a multi-company CloudEvents notification is matched to the correct realm only;
  QBO text-field content (Memo/PrivateNote/DocNumber) is treated as data to summarize, never as an
  instruction to follow, in both the adapter and the employee workspace policy prose.
- Capability registry: QuickBooks capabilities render in the existing Work Surface
  "Abilities"/"Connected" views (`npm run ui:test`) with zero new UI component code.

Proof note requirements:

Write a dated memory handoff under `mvp-build/memory/` and update `mvp-build/memory/MEMORY.md`.
Include: which of Phase A0-A6 actually landed this session vs. deferred; exact file list touched;
unit test count delta; whether a real Intuit sandbox connection was exercised (with proof ids) or
everything stayed mocked (explicitly say so — do not imply live proof that didn't happen);
concurrency-safe refresh-token locking approach chosen; whether the additive migration number
collided with anything landed after `0025`; and the honest current status of both open gaps named
in the architecture doc (multi-client-per-employee, batch approval) — still open, or did this
session's design choices narrow/resolve either one.

Also update:

- `mvp-build/CODEGRAPH.md` — new source files in the authored source map, phase-map status
  (`planned` → `source-wired` for whatever actually lands), and the "Next named connector" line in
  Current status.
- `wiki/offers/wedge-offers.md` — the "Employee · + QuickBooks" row's status language, if this
  session takes it from "planned" to something real.
- Root `CODEGRAPH.md` only if the canonical facts table or node registry meaningfully changes.

Definition of done:

- The vertical slice (OAuth connect/test → one real write through the approval gate) is proven
  with real unit tests, whether or not a live Intuit sandbox exists.
- Every write tool actually built has a corresponding "denied without approval" test.
- Every gotchas-ledger rule actually reachable by the tools built this session has a dedicated
  test.
- Local static gates (`typecheck`/`test:unit`/`lint`/`build`) pass, or failures are concrete and
  documented, not hidden.
- A dated memory handoff exists and is indexed, stating plainly what's `source-wired` vs. still
  `planned`/`pending` — no status is claimed without the proof behind it.
- The Phase 4/5 loose ends named above are untouched and still accurately described as pending —
  confirm via `git status`/`git diff` that unrelated in-flight work isn't disturbed.
```
