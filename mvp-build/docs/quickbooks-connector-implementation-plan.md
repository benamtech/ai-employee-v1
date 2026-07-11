# QuickBooks Connector Implementation Plan

Status: source-wired (Phase A0-A6 implemented 2026-07-10; live provider/runtime proof pending)

Companion to [`quickbooks-connector-architecture.md`](quickbooks-connector-architecture.md) and
[`quickbooks-api-gotchas.md`](quickbooks-api-gotchas.md). This maps the architecture onto the
current `mvp-build` codebase, mirroring the existing Gmail/Stripe connector build sequence. This
is Phase A only (MVP scope) — Phase B (breadth/hardening) and Phase C (future Local Companion) are
named in the architecture doc but not planned in file-level detail here; per the one-phase-per-plan
convention, write their detailed plans separately when their turn comes. A copy-ready session
handoff prompt to actually run this plan is at
[`quickbooks-connector-implementation-handoff-prompt.md`](quickbooks-connector-implementation-handoff-prompt.md).

**As-built note (2026-07-10, Phase A landed):** the connector is now source-wired. Files created:
`packages/db/migrations/0026_quickbooks_connector.sql`; `apps/manager/src/tools/qbo.stub.ts`;
`apps/manager/src/lib/{qbo-tokens,qbo-client,qbo-lookup,qbo-query,qbo-gotchas}.ts` +
`apigrate-quickbooks.d.ts`; `apps/manager/src/webhooks/quickbooks.ts` +
`apps/manager/src/events/adapters/quickbooks.ts`; contracts/schemas/policy in `packages/shared/src`;
capability-registry + MCP-descriptions wiring; `infra/scripts/acceptance/run10-quickbooks.mjs`. Unit
tests: `tests/unit/qbo-{gotchas,query,lookup,client,tools,webhook}.test.ts` (+ approval-policy /
run-tool / tool-contracts extensions). Three intentional deviations from the pre-build plan below,
all honest and documented: (1) the acceptance verifier is **`run10-quickbooks.mjs`**, not `run9`
— the `run9` slot was already taken by `run9-live-employee.mjs`. (2) The concurrency-safe refresh
lock is an **atomic conditional UPDATE on a `connector_accounts.token_refresh_lease_until` column**
(a single-row compare-and-swap), not a separate lock table — one connector row means one lock, so
the multi-row coordination that `employee_turn_locks` needs doesn't apply here. (3) `create_expense`'s
canonical payload sets the expense line `AccountRef` + vendor `EntityRef` + `PaymentType` but does
**not** yet set the header paid-from `AccountRef` (bank/credit-card account) — that is a second
account beyond the slice's Vendor+Account scope, deferred to Phase-A-live/Phase-B; live QBO
acceptance is `pending` regardless. The `@apigrate/quickbooks` `QboConnector` is constructed with
inert placeholder OAuth creds (it requires them structurally but its OAuth methods are never called
— `intuit-oauth` owns all token work). qbo-client unit tests mock the `QboConnector` boundary
(node-fetch is externalized by vitest and can't be intercepted without hitting live Intuit); the
mocked-HTTP correctness bar is met via that boundary plus the pending live harness.

**Post-build self-review fixes (same session):** an xhigh multi-angle review of the just-written code
found and fixed five real issues before commit — the most important a **production-breaker the unit
tests structurally could not catch**:
1. **`canonical_payload` is stored as `text`, not `jsonb`.** The commit-time tamper check re-hashes the
   stored payload; `jsonb` normalizes/reorders object keys on round-trip, so a jsonb hash would never
   match the hash taken at stage time and **every live commit would fail its integrity check**. It now
   stores the exact serialized string (byte-identical round-trip), hashes that string, and `JSON.parse`s
   it before the QBO call. (The fake supabase preserved JS key order, hiding this — the test now stores
   and re-hashes the serialized text, mirroring production.)
2. **Webhook fans out to EVERY connector on a realm.** `realm_id` is not unique across
   `connector_accounts`, so `.maybeSingle()` would error/return null when two accounts (e.g. a contractor
   and their bookkeeper) connect the same QuickBooks company, silently dropping the event for both. Now
   matches all connectors and delivers per-connector.
3. **The query filter guard rejects backslashes as well as single quotes.** QBO treats `\'` as an escaped
   quote, so a trailing/embedded backslash could escape the closing quote and alter the WHERE clause.
4. **A DB failure AFTER a successful QBO write no longer marks the row `failed`.** The commit is split:
   a `createEntity` failure marks `failed` (safe — nothing was written, and a `reqid` = pending-write-id
   makes any re-issue idempotent on Intuit's side); a persist failure after a real write returns `ok`
   with `persist_deferred` and leaves the row `committing` for reconciliation, never hiding a real write.
5. **Migration `0026` now REVOKEs anon/authenticated grants** on the two new tables (matching `0025`), so
   protection is defense-in-depth (RLS-no-policy AND no Data-API privilege), not RLS alone.

**Revision note (2026-07-10):** this revision resolves a heavy critique pass on a draft of this
plan. Five concrete things changed from the first version: (1) the QBO client library decision is
now settled (§ Client Library Decision) rather than left open; (2) the write-approval binding is
now a dedicated `quickbooks_pending_writes` table with an explicit, unambiguous binding rule (§
Write And Approval Flow) instead of an "extend approval refs, TBD" placeholder; (3) the
`commit_quickbooks_write` tool schema is called out as a deliberate, documented exception to the
codebase's default zod `.passthrough()` convention; (4) the approval-policy wiring no longer folds
QBO writes into the Gmail/Stripe-specific `SEND_GATE_ACTION_KEY_GROUPS` array (a real name
mismatch — QBO writes aren't "sends"); (5) the internal build order within Phase A is now
explicit — one entity fully proven before the other three are cloned from it.

## Client Library Decision

Neither Intuit nor the QBO ecosystem ships an official Node SDK for the Accounting API itself.
Only the OAuth layer is genuinely Intuit-maintained. Verified directly against npm/GitHub this
session (not assumed):

| Package | Maintainer | Scope | Verified facts |
|---|---|---|---|
| **`intuit-oauth`** (pin `4.2.3`) | Intuit engineers directly (maintainer accounts resolve to `@intuit.com`) | OAuth2/OIDC only: consent URL, code exchange, refresh, revoke | Actively published; this is the one genuinely "official" package in scope |
| **`@apigrate/quickbooks`** (pin `4.6.0`) | Community (Apache-2.0, single maintainer, `apigrate/quickbooks` on GitHub) | Full Accounting API: entity CRUD, query, reports, **and** its own OAuth handling | Read its `index.js` (780 lines) directly: dynamic discovery-document endpoint resolution (no hardcoded sandbox/prod URLs to maintain), **built-in HTTP 429 throttle/backoff with configurable wait**, automatic 401-triggered token refresh via an `EventEmitter` hook, dedicated error classes (`ApiError`/`ApiThrottlingError`/`ApiAuthError`/`CredentialsError`/`TokenRefreshError`), native promises (no callback wrapping needed), and complete coverage of all transactional entities (Bill, BillPayment, CreditMemo, Deposit, Estimate, Invoice, JournalEntry, Payment, Purchase, PurchaseOrder, RefundReceipt, SalesReceipt, TimeActivity, Transfer, VendorCredit — including explicit **void** support on Invoice/BillPayment/Payment/SalesReceipt, a distinct QBO operation from delete), named-list entities (Account, Class, Customer, Department, Item, Vendor, etc.), and 24 report types (covers every Phase A report plus Phase B's whole wishlist: Cash Flow, Trial Balance, General Ledger, Customer/Vendor Balance, Sales by Class/Customer/Department/Product, Tax Summary). Real weaknesses, weighed honestly: no shipped TypeScript types (plain `index.js`), and `package.json`'s test script is a placeholder (`"no test specified"`) — there is no automated test suite backing it. |
| **`node-quickbooks`** (evaluated, not used) | Community, `mcohen01`, 367 stars | Full Accounting API, callback-style | Wider adoption and the library both reference repos (`intuit/quickbooks-online-mcp-server`, `laf-rge/quickbooks-mcp`) build on, but carries real legacy surface: `oauth-1.0a` dependency, callback (not promise) API requiring hand-wrapping, hardcoded sandbox/prod URL swap, no built-in throttle/retry, and its shipped `index.d.ts` is a large hand-maintained type file that both reference repos still felt the need to duplicate/extend themselves. |

**Decision:** use `intuit-oauth` for the OAuth lifecycle (the security-sensitive, Intuit-owned
part — this tracks Intuit's own policy changes, like the refresh-token rotation shift noted in
the gotchas ledger, fastest) and `@apigrate/quickbooks`'s `QboConnector` **only for its Accounting
API surface** (entity CRUD, query, reports) — deliberately not its own OAuth methods, to avoid two
libraries independently believing they own refresh-token rotation. `qbo-tokens.ts` (below) is the
single source of truth for token refresh and persistence; `qbo-client.ts` constructs a fresh
`QboConnector` per call using the already-fresh access token/realm/environment from
`qbo-tokens.ts`, and only calls its entity/query/report methods.

**Extension escape hatch, since neither package is guaranteed to cover everything forever:**
`qbo-client.ts` exposes a narrow, typed function per operation AMTECH actually uses (not a
pass-through of the library's full surface). If a future need falls outside what
`@apigrate/quickbooks` supports (a brand-new entity, a report it hasn't added yet, an Intuit API
change it hasn't caught up to), add a small internal `qboRawFetch(path, method, body)` helper
inside `qbo-client.ts` that reuses the same discovered base URL and fresh access token — a
deliberate, narrow, documented fallback for genuine gaps, not the primary implementation strategy.
This directly avoids reinventing the whole REST client while still leaving room to grow beyond the
library.

Neither package ships usable TypeScript types for how thinly we use them, so `qbo-client.ts`
hand-rolls a narrow `.d.ts` for exactly the `@apigrate/quickbooks` methods called (a handful, not
the whole library) — the untyped/loosely-typed surface never leaks past that one file. Because
`@apigrate/quickbooks` has no automated test suite of its own, `qbo-client.ts`'s own unit tests
(against a mocked HTTP layer) are the real correctness coverage for this integration, not an
assumption that the upstream package is bug-free.

## Implementation Principles

- Mirror `gmail.stub.ts` file-for-file where the shape matches (connect → OAuth callback → connector
  test → draft/create → approval-gated commit); do not invent a new connector shape.
- Every write path goes through `request_approval`/`resolve_approval` — never a model-controlled
  boolean. See architecture doc §3, and the explicit binding rule below.
- Every QBO-specific correctness rule in `quickbooks-api-gotchas.md` is a unit-tested code path,
  not a comment.
- No new UI code: capability-registry + materialization wiring is the only owner-surface change.
- Reuse `connector_accounts`/`secrets.ts`/`oauth-state.ts`/`run-tool.ts`/`approval-policy.ts` as-is;
  extend, don't fork.
- Build one write tool completely before cloning the pattern to the next three (see Sequencing).

## Fastest path to first live write (vertical slice, before full Phase A breadth)

1. Connector lifecycle only (`connect_quickbooks`/`complete_quickbooks_oauth`/
   `run_quickbooks_connector_test`) via `intuit-oauth` — the unavoidable prerequisite for any
   write.
2. `qbo-client.ts` wrapping `@apigrate/quickbooks`'s `QboConnector` (Accounting API methods only,
   per the Client Library Decision above), one instance constructed per call from a fresh token.
3. `qbo-lookup.ts` scoped to just the two entities the first write needs (Vendor, Account) — not
   the full Customer/Item/Class/Department set yet.
4. One write tool, end to end, through the real approval gate and the `quickbooks_pending_writes`
   binding described below: **`create_expense`** (QBO `Purchase`) — the simplest QBO write (single
   vendor + account reference, no multi-line debit/credit balancing, no customer/item resolution).

This slice proves the entire pipeline (OAuth, token refresh, entity resolution, the approval gate,
the pending-write/approval binding, a real QBO write, audit) with the least code and the smallest
blast radius if something in the binding design is wrong. Only after `create_expense` is fully
proven (including the specific tests in Phase A3 below) should Bill/Invoice/Payment be cloned from
the same shape.

## Phase A0 — Shared contracts and schema

Deliver:

- New `ToolName`s in `packages/shared/src/tool-contracts.ts` (typed inputs) and
  `packages/shared/src/tool-schemas.ts` (zod runtime schemas): connector lifecycle
  (`connect_quickbooks`, `complete_quickbooks_oauth`, `run_quickbooks_connector_test`), write
  previews scoped to the accounting minimum (`create_expense`, `create_bill`, `create_invoice`,
  `create_payment`), one generic `commit_quickbooks_write`, the query tool (`query_quickbooks`),
  and report tools (`get_profit_and_loss`, `get_balance_sheet`, `get_aged_receivables`,
  `get_aged_payables`). Register but do not implement `update_expense`, `update_bill`,
  `update_invoice`, `create_deposit`, `create_journal_entry`, `update_journal_entry`,
  `create_bill_payment` — these return an explicit `not_supported_yet` envelope until Phase B, so
  the tool exists (discoverable, schema-validated) without a working handler behind it.
- **`commit_quickbooks_write`'s schema is a deliberate exception to house style.** Every other
  tool schema in `tool-schemas.ts` ends in `.passthrough()` by documented convention ("everything
  else falls back to a permissive passthrough schema"). `commit_quickbooks_write` must instead be
  `.strict()` and accept only `pending_write_id`, `approval_id`, and the standard identity fields
  — no entity payload data of any kind. Comment the schema explaining why it diverges: this is the
  one tool where "no extra fields accepted" is a hard security property (the entity payload that
  actually gets written to QuickBooks must come exclusively from the stored
  `quickbooks_pending_writes` row, never from anything the model supplies at commit time).
- `QBO_WRITE_ACTION_KEY_GROUPS` in `packages/shared/src/approval-policy.ts` as its **own peer
  array**, spread directly into `OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS`'s construction —
  **not** folded into `SEND_GATE_ACTION_KEY_GROUPS`. That array's own doc comment scopes it to
  "customer/money-facing **send**" actions (Gmail send, Stripe invoice send); a QuickBooks write
  commits to the books, it doesn't send anything externally, so folding it in would be a real name
  mismatch for future readers. Follow the precedent already in the file:
  `RESERVED_OWNER_AUTH_ACTION_KEYS` exists specifically for owner-auth-required actions that
  aren't sends. Concretely:
  ```ts
  export const QBO_WRITE_ACTION_KEY_GROUPS = [
    QBO_EXPENSE_WRITE_ACTION_KEYS,
    QBO_BILL_WRITE_ACTION_KEYS,
    QBO_INVOICE_WRITE_ACTION_KEYS,
    QBO_PAYMENT_WRITE_ACTION_KEYS,
  ] as const;

  export const OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS: ReadonlySet<string> = new Set<string>([
    ...SEND_GATE_ACTION_KEY_GROUPS.flat(),
    ...QBO_WRITE_ACTION_KEY_GROUPS.flat(),
    ...RESERVED_OWNER_AUTH_ACTION_KEYS,
  ]);
  ```
  so a new QBO write action_key is still structurally guaranteed to require owner-authenticated
  resolution, without misnaming what `SEND_GATE_ACTION_KEY_GROUPS` means.
- Migration `packages/db/migrations/00NN_quickbooks_connector.sql` (check the current highest
  migration number first — it may be past `0025` by the time this lands):
  - Additive `connector_accounts` columns: `environment` (`sandbox`|`production`), `realm_id`,
    `external_label`. **Note explicitly:** `connector_accounts` has `unique (employee_id,
    connector_key)` (verified in `0001_init.sql`) — one employee can have exactly one
    `connector_key: "accounting"` row. `external_label` is a display-name convenience only; it
    does **not** enable multiple QuickBooks companies per employee. That gap (a bookkeeping firm
    wanting one employee across many clients' QBO companies) is explicitly out of scope for Phase
    A, per the two open gaps already named in `quickbooks-connector-architecture.md`'s
    Capabilities section — do not attempt to solve it here.
  - New Manager-only `quickbooks_pending_writes` table (RLS on, no anon/authenticated grants):
    `id`, `account_id`, `employee_id`, `connector_id`, `action_key`, `entity_type`,
    `canonical_payload jsonb`, `payload_hash`, `approval_id` (nullable until
    `request_approval` returns one, then set once), `status` (`pending_approval` |
    `approved` | `committing` | `committed` | `failed` | `rejected`), `qbo_entity_id`,
    `qbo_sync_token`, `intuit_tid`, `committed_at`, timestamps. `approval_id` is a foreign key to
    `approvals(id)` and, once set, is never overwritten — this is the field the commit path
    checks against, not a freeform "does some approval say approved" query (see Write And
    Approval Flow).
  - New Manager-only `inbound_qbo_events` table (RLS on, no anon/authenticated grants) mirroring
    `inbound_email_events`, for webhook/CDC dedupe — confirm its exact shape once the CloudEvents
    envelope is verified against Intuit's current docs (Phase A5).

Acceptance: typecheck passes with new schemas registered; no runtime wiring yet; migration applies
cleanly against a scratch/local DB; RLS verified (no anon/authenticated grants) via the same
`get_advisors` check used for prior migrations.

## Phase A1 — Connector lifecycle

Deliver:

- `apps/manager/src/lib/qbo-client.ts` — the only QBO REST boundary. Constructs a fresh
  `@apigrate/quickbooks` `QboConnector` per call from `(realm_id, environment, access_token)`
  supplied by `qbo-tokens.ts`; exposes narrow typed functions per operation actually used (not the
  library's full surface); includes the `qboRawFetch` escape hatch described in the Client Library
  Decision, unused until an actual gap appears. No raw tokens/entity payloads/untrusted memo text
  in logs.
- `apps/manager/src/lib/qbo-tokens.ts` — the single owner of QBO token refresh: uses `intuit-oauth`
  for the actual refresh call, with connector-row-scoped locking (a `SELECT ... FOR UPDATE` or
  advisory-lock pattern, mirroring the concurrency-safety already proven in the turn-claim RPCs)
  so two concurrent requests never race the same rotating refresh token. Persists every rotated
  refresh token with `mustWrite` (fail closed on persistence failure — a lost refresh token is
  worse than a slow request) via `sealSecret`.
- `apps/manager/src/tools/qbo.stub.ts` — `connect_quickbooks`, `complete_quickbooks_oauth`
  (captures `realmId` from the callback query string, per the gotchas ledger), and
  `run_quickbooks_connector_test` (refresh + `CompanyInfo` GET), following `gmail.stub.ts`'s
  exact control flow (validate → check employee/account ownership → mutate `connector_accounts`
  → audit → `ok()`/`failed()` envelopes with `proof`/`next_suggested_action`).
- OAuth callback web route mirroring the Gmail callback.
- Register `qboTools` in `apps/manager/src/tools/registry.ts` alongside `gmailTools`/`stripeTools`.

Acceptance: unit tests cover connect → callback → test happy path and the validation/ownership/
denial paths, mirroring `gmail.stub.ts`'s existing test coverage shape. No live Intuit sandbox call
required for this acceptance tier (mock the HTTP layer), matching the "work out the project before
env" convention already used for Gmail/Stripe.

## Phase A2 — Entity resolution

Deliver:

- `apps/manager/src/lib/qbo-lookup.ts` — TTL-cached (e.g. 5 min) per-connector name→id maps for
  Customer, Vendor, Account, Item, Class, Department (built incrementally: Vendor+Account for the
  vertical slice, the rest once Bill/Invoice/Payment are underway). Exact match resolves; on
  multiple remaining candidates or zero candidates, return a structured `{ status:
  "needs_disambiguation", candidates: [...] }` result — never a best-guess pick.
- Unit tests proving: exact match resolves; ambiguous input returns candidates and does **not**
  silently pick the first/best match; zero matches returns a clear "not found" result; cache
  invalidates/refreshes past its TTL.

Acceptance: `qbo-lookup.ts` has no path that returns a single resolved id without either an exact
match or an explicit disambiguation escape hatch.

## Phase A3 — Core write tools + approval gate

**Build order: `create_expense` completely first — including every test in this section — before
starting Bill/Invoice/Payment.** This is the one entity where the pending-write/approval binding,
the payload-hash check, and the `.strict()` commit schema all get proven together; if any of
those three is wrong, it's much cheaper to find out on one entity than on four.

Write And Approval Flow:

- Every write-preview tool (`create_expense`, then `create_bill`, `create_invoice`,
  `create_payment`) resolves names via `qbo-lookup.ts`, validates the gotchas-ledger rules
  (`PaymentType` on Purchase, sparse-update required-field carry-over, single-department
  rejection, SyncToken presence on updates once those land in Phase B), builds a canonical
  payload, inserts a `quickbooks_pending_writes` row (`status: pending_approval`,
  `canonical_payload`, `payload_hash`), calls `request_approval` with a
  `QBO_WRITE_ACTION_KEY_GROUPS` member `action_key`, **writes the returned approval id back onto
  that same `quickbooks_pending_writes` row** (`approval_id`, set once, never overwritten), and
  returns without calling QBO.
- `commit_quickbooks_write` is the **only** path that calls the QBO client for a write. Its
  `.strict()` schema takes just `pending_write_id`/`approval_id`/identity. It must:
  1. Load the `quickbooks_pending_writes` row by `pending_write_id` scoped to
     `account_id`/`employee_id`.
  2. **Verify `row.approval_id === approval_id` supplied by the caller** (not merely "does
     `approval_id` exist and say approved") — this is the actual confused-deputy fix: an approval
     that was legitimately granted for a *different* pending write, or for an unrelated tool
     entirely, must be rejected here even if its own `resolution` column says `approved`.
  3. Load that approval and require `resolution === 'approved'`.
  4. Atomically claim the row (`UPDATE ... SET status = 'committing' WHERE id = $1 AND status =
     'approved' RETURNING *`, the same compare-and-swap shape already proven in
     `claim_employee_turn_job`/`complete_employee_turn_job`) so two concurrent commit attempts
     (e.g. a retried SMS action) can't double-post the same QBO write.
  5. Recompute the payload hash from the stored `canonical_payload` and compare to the stored
     `payload_hash` as a tamper-evidence check (defense in depth — the `.strict()` schema already
     means no new payload data can enter at commit time, so this catches a row mutated by some
     other bug, not a model resupplying different args).
  6. Execute the stored payload exactly once via `qbo-client.ts`, persist `qbo_entity_id`,
     `qbo_sync_token`, `intuit_tid` (the correlation id `@apigrate/quickbooks` exposes — store it
     for support/debugging), mark `status: committed`, write audit.
- Unit tests: preview-without-approval never calls the QBO client; commit denied when
  `approval_id` doesn't match the pending write's own stored `approval_id` (the specific
  confused-deputy test, not just "commit without any approval"); commit denied when the approval
  exists but isn't `approved`; commit with a tampered/mismatched payload hash is denied; two
  concurrent commit attempts against the same `approved` row result in exactly one QBO call
  (proves the compare-and-swap claim); each gotchas-ledger rule has a dedicated rejection test.

Acceptance: no write tool has any code path that reaches the QBO client without a prior `approved`
resolution tied to *that specific* pending write, and `commit_quickbooks_write`'s schema rejects
any payload field beyond `pending_write_id`/`approval_id`/identity.

## Phase A4 — Generic query tool + reports

Deliver:

- `apps/manager/src/lib/qbo-query.ts` — builds a QBO SQL-like query string from a structured
  `{ entity, filters, fields?, limit?, start_position? }` input, validating `filters` keys against
  a per-entity filterable-fields whitelist (adapted from the gotchas ledger) and escaping/rejecting
  unsafe string literals before interpolation.
- `query_quickbooks` tool exposing this to the employee as one read tool across all entities,
  instead of ~40 `search_*` tools — consistent with the schema-first, lean-tool-surface philosophy
  already used elsewhere in the registry.
- Report tools: `get_profit_and_loss`, `get_balance_sheet`, `get_aged_receivables`,
  `get_aged_payables` for Phase A, using `@apigrate/quickbooks`'s report methods (its 24-report
  coverage already includes everything Phase B will want later — Cash Flow, Trial Balance,
  General Ledger, Customer/Vendor Balance — so widening report coverage in Phase B is a thin
  wrapper addition, not new client work).
- QBO report responses are deeply nested/recursive (`Rows.Row[]`, with subtotal rows nesting
  further `Rows.Row[]`) — each report tool must normalize/flatten to a stable, owner-summarizable
  shape before returning to the employee; do not hand the employee raw report JSON to parse
  inline on every call (wastes tokens and is easy to get subtly wrong per-report).

Acceptance: unit tests prove a filter on a non-filterable field (e.g. `DepartmentRef` on
`JournalEntry`) is rejected client-side with a helpful message before any API call, a crafted
string-literal filter value cannot alter the generated query's structure, and each report tool
returns a flattened/normalized shape (not raw nested QBO JSON) covered by a fixture-based test.

## Phase A5 — Event mesh (CloudEvents webhook)

Deliver:

- `apps/manager/src/webhooks/quickbooks.ts` — verifies Intuit's webhook HMAC signature, parses the
  CloudEvents envelope (**re-verify the exact shape against Intuit's current migration guide right
  before writing this** — the gotchas ledger notes a 2026-07-31 mandatory cutover that may have
  already passed or shifted by implementation time), fans out per-`realmId`.
- `apps/manager/src/events/adapters/quickbooks.ts` — matches each fanned-out event to a
  `connector_accounts` row by `realm_id`, fetches the changed record via a targeted GET, normalizes
  to a safe fact, and calls `ingestEvent` — the same two-door shape Gmail/Stripe already use.
  Treat every QBO text field (`Memo`, `PrivateNote`, `DocNumber`) as untrusted content to
  summarize, never as an instruction — per the architecture doc's lethal-trifecta mapping.
- `inbound_qbo_events` (from Phase A0) for webhook/CDC dedupe and proof.
- A scheduler-driven `/cdc` reconciliation sweep (mirroring `renew_expiring_watches`) as a backstop
  for missed/failed webhook deliveries, capped at the 30-day CDC window.

Acceptance: unit tests cover signature verification failure, multi-company fan-out from one
notification, dedupe of a redelivered event, and normalization into a safe (non-instruction-laden)
fact.

## Phase A6 — Capability registry / materialization wiring

Deliver:

- `MANAGER_TOOL_META` entries in `apps/manager/src/lib/capability-registry.ts` for every new QBO
  tool, under a new `"accounting"` `CapabilityCategory`.
- `connectorStatus()` extended to recognize `provider === "quickbooks"`.
- No new Work Surface / SMS rendering code — verify by exercising the existing UI fixture flow
  (`npm run ui:test`) and confirming QuickBooks capabilities render through the existing generic
  materialization path with zero new component code.

Acceptance: a fixture employee with a `connected` QuickBooks connector row shows QuickBooks
abilities in the existing Work Surface "Abilities"/"Connected" views without any new UI component.

## Acceptance harness seam

Add `infra/scripts/acceptance/run9-quickbooks.mjs` alongside `run4-gmail.mjs`/`run5-stripe.mjs`,
wired into `acceptance:preflight`/`acceptance:report` the same way, writing to the same gitignored
reports directory — real Intuit sandbox company, real OAuth handshake, a real created-and-verified
Expense (then Bill/Invoice/Payment once those land), real webhook delivery proof. Do not mark
`provider-accepted` without a real proof id, per the Realness Rule already governing every other
connector; if no sandbox account exists yet, the harness should report `not_run` for lack of env,
exactly like the existing verifiers do.

## Pass/fail summary by tool group

| Tool group | Fails if... |
|---|---|
| Connector lifecycle | OAuth state can't be forged into an owned connector; connector test succeeds without a valid, refreshed token |
| Entity resolution | Any code path resolves an ambiguous name to a single id without an explicit exact match |
| Write tools | Any write reaches the QBO client without a prior `approved` resolution tied to *that specific* pending write; `commit_quickbooks_write`'s schema accepts any field beyond `pending_write_id`/`approval_id`/identity; two concurrent commits against one approved row produce more than one QBO call |
| Gotchas-ledger rules | Any of: stale SyncToken raw-faults the owner; unbalanced JE reaches the API; a sparse update silently drops a required field; a multi-department expense silently collapses instead of being rejected |
| Query tool | A non-filterable-field filter reaches the QBO API instead of being rejected client-side; a crafted string literal alters query structure |
| Reports | A report tool returns raw nested QBO JSON instead of a flattened, tested shape |
| Event mesh | A webhook event is trusted without HMAC verification; a multi-company CloudEvents notification is matched to the wrong realm; QBO text-field content is ever treated as an instruction rather than data |
| Capability registry | QuickBooks capabilities require new Work Surface/SMS component code to render |

## Wiki/codegraph update points

On landing Phase A: update `mvp-build/CODEGRAPH.md` node registry (new files, including
`quickbooks_pending_writes`/`inbound_qbo_events` migration), phase-map status (`planned` →
`source-wired`), current-status narrative, and current-priority section; update
`wiki/offers/wedge-offers.md` connector-tiers table from "planned" language to a concrete
"Employee · + QuickBooks" tier description; write a dated `mvp-build/memory/` handoff per the
standing memory protocol (full-phase-implementation trigger).
