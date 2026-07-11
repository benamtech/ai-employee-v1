# QuickBooks Connector Architecture

Status: source-wired (Phase A landed 2026-07-10; live provider/runtime proof pending)

Purpose: define how the AI Employee gets native, non-technical-owner-safe access to QuickBooks
Online (QBO) — full CRUD, reports, and real-time sync — without introducing a second tool
runtime, a model-flippable commit path, or a bespoke QBO subsystem. This is a product and
architecture design, not a source-level implementation record. QuickBooks is not a feature
reserved for a "more mature" tier of customer: it is the default small-business accounting tool,
used by owner-operators well under $500k/year alongside larger shops and by Beachhead #2
(bookkeepers) as their whole world. It belongs in the same connector-tier ladder as Gmail and
Stripe, described in [`../../wiki/offers/wedge-offers.md`](../../wiki/offers/wedge-offers.md).

Companion docs:

- [`quickbooks-connector-implementation-plan.md`](quickbooks-connector-implementation-plan.md) —
  decision-complete Phase A build sequence.
- [`quickbooks-api-gotchas.md`](quickbooks-api-gotchas.md) — carried-forward QBO API limitations
  ledger, encoded as validated business rules, not just documentation.

## Current Reality

`mvp-build` already has a proven, twice-repeated connector pattern (Gmail, Stripe) that this
design extends rather than replaces:

- `connector_accounts` (generic `connector_key`/`provider` columns) backs every external
  connection; OAuth tokens are sealed by reference via `apps/manager/src/lib/secrets.ts`
  (AES-256-GCM envelope, `SECRET_REF_MASTER_KEY`) — raw tokens never touch a domain table, a log,
  or the model.
- Every Manager tool is dispatched through one shared path (`apps/manager/src/lib/run-tool.ts`
  `runManagerTool`), validated against a zod schema in `packages/shared/src/tool-schemas.ts`, and
  exposed to the employee as native MCP tools by `apps/manager/src/lib/mcp-server.ts` — a
  **transport over the existing tool registry**, not a second implementation. Tool descriptions are
  Manager-authored server-side (`TOOL_DESCRIPTIONS`); the employee never sees a third-party tool
  description, closing the most common MCP tool-poisoning vector before it can start.
  Account/employee identity is injected server-side from the employee's bound, per-employee scoped
  MCP credential (migration `0023_agent_boundary_hardening.sql`, `apps/manager/src/lib/mcp-auth.ts`)
  — the model neither sees nor supplies `account_id`/`employee_id`.
  See [`../CODEGRAPH.md`](../CODEGRAPH.md) §6 for the full authored source map.
- Money- and customer-facing actions are approval-gated: `request_approval`/`resolve_approval` plus
  `packages/shared/src/approval-policy.ts` (`SEND_GATE_ACTION_KEY_GROUPS` → derived
  `OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS`), resolved out-of-band by the owner over SMS/web
  (signed preview links, `apps/manager/src/lib/preview-links.ts`), never by the agent itself.
- The capability registry (`apps/manager/src/lib/capability-registry.ts`) auto-derives an
  owner-facing capability graph from `TOOL_NAMES` + connector/runtime status; the generic
  materialization layer (`packages/shared/src/materialization.ts`,
  `apps/manager/src/lib/materialization.ts`) renders it across Work Surface, SMS signed previews,
  and MCP `resources/*` with **zero new UI code per tool**.
  See [`../CODEGRAPH.md`](../CODEGRAPH.md) node registry entries for `capability-registry.ts` and
  `materialization.ts`.
- The event mesh has a two-door architecture: external/untrusted sources enter through
  `EventSourceAdapter` + `ingestEvent` (`apps/manager/src/events/ingress.ts`,
  `apps/manager/src/events/adapters/*`); internal Manager-authored events call
  `deliverEmployeeEvent` directly. This split is intentional and QuickBooks follows the external
  door, exactly like Gmail and Stripe.

The missing piece is a `quickbooks` connector that plugs into every one of these seams the same
way Gmail and Stripe already do.

## Design Goals

- An owner connects QuickBooks the same way they connect Gmail: one consent link, one approval
  screen, done. No API key, client ID, realm ID, or developer-portal concept ever reaches them.
- Every QBO write is approval-gated through the existing owner-approval primitive — never a
  model-controlled boolean flag the agent can flip on its own reasoning.
- The employee refers to QuickBooks entities by name ("the truck payment to Sherwin-Williams"),
  never by internal ID, and never guesses on an ambiguous name — it asks.
- QuickBooks' own well-documented API quirks (SyncToken concurrency, sparse-update required
  fields, single-department-per-expense, non-filterable fields) are encoded as validated business
  logic in the connector, not left as opaque QBO 400s the owner or the model has to interpret.
  See [`quickbooks-api-gotchas.md`](quickbooks-api-gotchas.md).
- The connector is multi-tenant from the start: environment (sandbox/production), realm ID, and
  tokens are all per-`connector_accounts`-row, never a process-level `.env` value.
- QuickBooks is "just another connector" in the capability registry and materialization layer —
  no new owner-surface code, no new SMS rendering path, no new admin console code.
- Real-time sync is built against QBO's **CloudEvents** webhook envelope from day one (Intuit's
  mandatory cutover is 2026-07-31 — see Research Inputs), not the legacy envelope.

## Research Inputs

Reference implementations studied in full (not adopted as runtimes — see Architecture Decision):

- [`github.com/intuit/quickbooks-online-mcp-server`](https://github.com/intuit/quickbooks-online-mcp-server)
  — 144 tools across 29 entity types (full CRUD where QBO supports it; several entities such as
  Account/Item/Class/Department/Term/PaymentMethod support update-to-inactive but not hard delete)
  and 11 financial reports. Its own `docs/ARCHITECTURE.md` documents a `node-quickbooks`-wrapped
  client, one handler file per operation, and a **local stdio MCP server with single-tenant `.env`
  config** (`QUICKBOOKS_REFRESH_TOKEN`, `QUICKBOOKS_REALM_ID`) and a one-time browser OAuth
  handshake (`src/auth-server.ts`, `npm run auth`) — built for one developer's one company, not a
  hosted multi-tenant backend. Treat this repo as the **tool-taxonomy reference** (which entities,
  which operations QBO actually supports), not as adoptable runtime code. Note its README still
  contains unreplaced template boilerplate (`git clone .../your-username/mcp-quickbooks-online`),
  a sign it is closer to a scaffold than a hardened product.
- [`github.com/laf-rge/quickbooks-mcp`](https://github.com/laf-rge/quickbooks-mcp) — built
  explicitly for "bookkeepers, CFOs, and accountants," and the source of the three ideas this
  design borrows, plus one flaw it deliberately does not:
  1. **Name resolution** (`src/query/index.ts` account/department TTL cache) so the caller never
     handles a QBO internal ID.
  2. **A single SQL-like `query` tool** across all entities instead of ~40 `search_*` tools
     (`src/query/filterable-fields.ts` documents which fields QBO actually allows in a `WHERE`
     clause per entity — `DepartmentRef`/`AccountRef`/`Line.*` are rejected on transaction
     entities with an opaque `QueryValidationError`).
  3. **`docs/quickbooks-api-limitations.md`** — a hard-won gotchas ledger (SyncToken/sparse-update
     quirks, single-department-per-expense, a live bug where editing an expense's lines strips
     `DepartmentRef`/`EntityRef`) carried forward almost verbatim into
     [`quickbooks-api-gotchas.md`](quickbooks-api-gotchas.md).
  4. **The flaw not to repeat:** every write tool (e.g. `src/tools/handlers/journal-entry.ts`)
     defaults to `draft: true` (preview text only) and commits when called again with
     `draft: false` — but there is **no cryptographic or session binding between the previewed
     payload and the commit call**. The model decides when to flip the flag and regenerates the
     args fresh each time. That is a textbook confused-deputy / prompt-injection surface: a
     poisoned vendor memo, an ambiguous instruction, or a subtly wrong re-derivation of the
     "confirmed" amount could all reach `draft: false` with nothing external stopping it. Its own
     `delete.ts` handler repeats the same `confirm: boolean` pattern. AMTECH's existing
     `request_approval`/`resolve_approval` gate is strictly stronger because it requires an
     **out-of-band, owner-authenticated resolution** the agent cannot self-grant — see Architecture
     Decision §3, below, for how this design closes the gap instead of reproducing it.
  Also read: `src/auth/token-validator.ts` (JWKS/audience/issuer/scope validation for inbound
  Bearer JWTs — a clean pattern for MCP resource-server token validation if Manager's MCP endpoint
  is ever exposed to a third-party client; not needed today since the employee-bound scoped
  credential model already closes that gap) and its credential modes (`src/credentials/`: local
  file vs. AWS Secrets Manager) — AMTECH's own `secrets.ts` + `connector_accounts.token_secret_ref`
  is already the multi-tenant-correct version of the same idea; no AWS dependency needed.
- Intuit OAuth/token-lifetime facts: access tokens expire in 1 hour; refresh tokens are on a
  **100-day rotating window** as of this research, with Intuit having announced a policy shift
  toward more frequent rotation (Nov 2025) — **`[VERIFY AT IMPLEMENTATION]`** against
  [developer.intuit.com's OAuth 2.0 FAQ](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/faq)
  before building, since Intuit's own policy has been in flux. Refresh tokens rotate on every use
  (the old token is invalidated), so persistence must happen on every refresh, with
  concurrency-safe locking so parallel requests never race on the same rotating token.
- Webhooks: QBO webhooks are **notification-only** — the payload does not include the changed
  data, only a trigger to fetch it — and are **migrating to a CloudEvents envelope with a
  mandatory cutover of 2026-07-31** (three weeks from this research date). Under CloudEvents, one
  notification can carry events for multiple companies, and realm/entity/operation live in
  different envelope fields than the legacy format. `GET /cdc?entities=...&changedSince=...`
  (Change Data Capture) is capped at a 30-day lookback window and is a reconciliation-sweep tool,
  not a primary delivery path. **`[VERIFY AT IMPLEMENTATION]`** against Intuit's migration guide
  before building the webhook adapter, since this is a live, near-term deadline.
- MCP security landscape (2026): the "lethal trifecta" (Simon Willison) — untrusted content +
  access to sensitive data + ability to act externally — the OWASP MCP Top 10, documented tool
  poisoning via tool-description metadata, and the MCP spec's OAuth confused-deputy / audience
  requirement (RFC 8707 resource indicators: an MCP server must reject tokens not issued
  specifically for it). See Architecture Decision §7 for how each maps onto this design.
- Computer-use/local-companion pattern (2026): the emerging hybrid architecture pairs a cloud
  reasoning agent with a narrow local execution surface (e.g. Manus "My Computer," Perplexity's
  desktop companion) rather than giving a cloud model direct, open-ended desktop control. This
  informs the explicitly-future Phase C design in §8, below.

## Architecture Decision

**Build QuickBooks as a new first-class Manager tool family — `qbo.stub.ts` — mirroring
`gmail.stub.ts`/`stripe.stub.ts`.** Do not run a separate MCP subprocess per employee, and do not
adopt either reference repo's runtime or draft/confirm safety model. This is the single most
important call in this design: QuickBooks inherits, for free, everything already proven —
Manager-as-MCP dispatch, secrets-by-reference, the owner-approval gate, audit logging, the
capability registry / materialization layer, the event mesh, and the per-employee scoped MCP
credential boundary. QuickBooks becomes "just another connector," which is the tool-agnostic,
small-business-productivity posture CLAUDE.md asks for — not a bespoke QBO subsystem, and not a
second, competing tool-serving mechanism alongside Manager's own MCP server.

### 1. Connector lifecycle (mirrors Gmail exactly)

- `connect_quickbooks` — creates/reuses a `connector_accounts` row (`connector_key: "accounting"`,
  `provider: "quickbooks"`), mints an OAuth `state` (reuse `apps/manager/src/lib/oauth-state.ts`),
  returns Intuit's consent URL (`appcenter.intuit.com/connect/oauth2`, scope
  `com.intuit.quickbooks.accounting`). Per-connector `environment` (`sandbox`|`production`) is a
  **column on `connector_accounts`**, not a process env var — both reference repos assume
  single-tenant `.env` config, which does not work multi-tenant.
- `complete_quickbooks_oauth` — the OAuth callback route exchanges the code, captures `realmId`
  from the redirect query (QBO-specific: the callback URL includes `realmId`, unlike Gmail),
  seals the token bundle (access + refresh + realm_id) via `sealSecret`, stores `token_expiry`.
  Refresh-token rotation-on-use must be persisted on **every** refresh, not just at connect time —
  mirror `gmail-tokens.ts`'s `getFreshAccessToken` with a `qbo-tokens.ts` twin, adding
  concurrency-safe locking so parallel requests never race the same rotating refresh token.
- OAuth itself (consent URL, code exchange, refresh, revoke) uses `intuit-oauth` — Intuit's own
  maintained OAuth2 client, verified as genuinely Intuit-published (not a third-party package) —
  rather than hand-rolling the OAuth HTTP calls or leaning on a community Accounting-API library's
  bundled OAuth methods. See `quickbooks-connector-implementation-plan.md`'s Client Library
  Decision for the full package evaluation (OAuth vs. Accounting-API-client are deliberately two
  different libraries, so only one of them ever owns refresh-token rotation).
- `run_quickbooks_connector_test` — refresh + `CompanyInfo` GET as the health check (mirrors
  `run_email_connector_test`'s profile fetch).

### 2. Entity resolution layer

New `lib/qbo-lookup.ts`: a TTL-cached (e.g. 5 min), per-connector lookup for Customer, Vendor,
Account, Item, Class, and Department, built lazily and refreshed on cache miss. Unlike laf-rge's
implementation — which falls through to a partial `FullyQualifiedName`-includes match and can
silently pick a wrong entity — **ambiguous or zero matches return a structured
`needs_disambiguation` result** (a candidate list) rather than guessing. The employee then asks the
owner, exactly like any other information gap. This is the difference between "an owner can say
'the truck payment to Sherwin-Williams' and it works" and "an owner can say that and it silently
posts to the wrong vendor" — a correctness property neither reference repo fully guarantees.

### 3. Write-tool safety: extend the existing approval gate, don't reinvent one

Every QBO write tool (`create_bill`, `create_invoice`, `create_payment`, `create_expense`,
`create_deposit`, `create_journal_entry`, `create_bill_payment`, and their updates/deletes) always:
(a) resolves names via `qbo-lookup.ts`, (b) validates QBO-specific business rules before ever
calling the API (§ below and `quickbooks-api-gotchas.md`), (c) stores a canonical payload in a
dedicated, Manager-only `quickbooks_pending_writes` row and calls `request_approval` — it never
calls the QuickBooks write API itself. A single generic `commit_quickbooks_write` tool performs
the actual QBO call, and only after verifying the *specific* pending-write row's own stored
`approval_id` matches the one supplied, and that approval is `resolved: approved` — not merely
"some approval exists and says approved," which would allow replaying an unrelated already-approved
approval against a different, unapproved write. `commit_quickbooks_write`'s schema is a deliberate,
documented exception to this codebase's default zod `.passthrough()` convention (`tool-schemas.ts`):
it is `.strict()` and accepts only `pending_write_id`/`approval_id`/identity — no entity payload
data can enter at commit time at all, so the QBO write always executes exactly the payload the
owner's approval was granted against. See `quickbooks-connector-implementation-plan.md`'s Phase A3
for the full binding design, including the compare-and-swap claim that makes concurrent commit
attempts safe. New `QBO_WRITE_ACTION_KEY_GROUPS` are added to `packages/shared/src/approval-policy.ts`
as their **own peer array**, spread directly into `OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS` —
**not** folded into the existing `SEND_GATE_ACTION_KEY_GROUPS`, whose own doc comment scopes it to
customer/money-facing *sends* (Gmail, Stripe); a QuickBooks write commits to the books, it doesn't
send anything externally, so it follows the `RESERVED_OWNER_AUTH_ACTION_KEYS` precedent already in
that file for non-send owner-auth-required actions instead. Either way, a new QBO write action_key
structurally cannot miss the owner-auth-required set — the same mechanism the 2026-07-10 audit-fix
pass built to close exactly this class of gap for Gmail/Stripe. This closes the confused-deputy
weakness present in both reference implementations' `draft`/`confirm` boolean pattern.
Read/search/report tools remain ungated, exactly like Gmail's connector-test/read path and
Stripe's `get_stripe_connection_status`.

### 4. QBO correctness rules as validated business logic

See [`quickbooks-api-gotchas.md`](quickbooks-api-gotchas.md) for the full ledger. In summary,
encoded as code + unit tests in `qbo.stub.ts`/`qbo-client.ts`, never left as documentation alone:
SyncToken optimistic-concurrency on every update (translated to an owner-safe retry message, not a
raw API fault); journal-entry debit/credit balance validated in integer cents before the API call;
a per-entity sparse-update required-field carry-over table (`Bill`→`VendorRef`,
`Purchase`→`PaymentType`) so a line edit never silently drops required fields; expense writes
reject a multi-department request with the split-bill workaround explained, rather than silently
collapsing to one department; the generic query tool enforces a per-entity filterable-fields
whitelist and escapes/rejects single-quoted string literals (also the injection-safety boundary
for the SQL-like query surface).

### 5. Event mesh: QuickBooks as a new `EventSourceAdapter`

`webhooks/quickbooks.ts` + `events/adapters/quickbooks.ts`, built **CloudEvents-native** given the
2026-07-31 mandatory cutover: verify Intuit's webhook HMAC signature, parse the CloudEvents
envelope (realm/entity/operation live in different envelope fields than the legacy format, and one
notification can carry events for multiple companies — the adapter must fan out per-`realmId`
before matching a `connector_accounts` row, exactly like `handle_gmail_pubsub` matches on
`external_email`). Because the webhook carries no data, follow up with a targeted GET (or a
scheduler-driven `/cdc` sweep, 30-day cap, mirroring `renew_expiring_watches`) to fetch the actual
changed record, normalize to a safe fact ("Invoice #1042 marked paid," "New uncategorized bill
from Sherwin-Williams, $412.60"), and deliver through the existing `ingestEvent` → dedupe → triage
→ Work Surface/SMS path, unchanged.

### 6. Capability registry / materialization: zero new UI code

Add QBO entries to `MANAGER_TOOL_META` in `capability-registry.ts` (extend the
`CapabilityCategory` union with `"accounting"`), and extend `connectorStatus()`'s provider
matching for `"quickbooks"`. The existing generic materialization projection, MCP
`resources/list`/`resources/read`, SMS signed previews, and Work Surface "Connected"/"Abilities"
views then render QuickBooks automatically — the direct payoff of the connector-tier pattern
already proven for Gmail/Stripe.

### 7. MCP security posture — mapped against current research

| Risk (from research) | AMTECH's existing answer | New for QBO |
|---|---|---|
| Tool poisoning via descriptions | Manager owns every tool description server-side (`TOOL_DESCRIPTIONS` in `mcp-server.ts`); no third-party tool descriptions ever reach the model | none — QBO tools are Manager-authored like every other tool |
| Confused deputy / self-approved writes | `approval-policy.ts` + owner-authenticated `resolve_approval` | extend action-key groups (§3) — do not use a model-flippable boolean, unlike both reference repos |
| OAuth token audience / confused deputy at the MCP layer | Per-employee scoped MCP credential (migration `0023`, `mcp-auth.ts`) — the model never sees Manager's internal bearer or another employee's identity | unchanged; QBO tokens live behind the same boundary, sealed via `secrets.ts`, never touch the model |
| Lethal trifecta (untrusted content + sensitive data + external action) | Gmail bodies are already treated as untrusted content, never instructions | QBO record fields (`Memo`, `PrivateNote`, `DocNumber`, custom fields) are frequently vendor- or bank-feed-populated — **treat every QBO read the same way**: content to summarize, never instructions to follow. State this explicitly in the employee workspace policy doc (`packages/agent-template/workspace/AGENTS.md`/`manager-tools.md`). |
| Least privilege / scope creep | Toolset safe-set policy (`platform-toolsets.ts`), `SCHEDULER_ONLY_TOOLS` split | QBO write tools join the owner-approval-gated set, not the scheduler-only or unrestricted sets |

### 8. Future / explicitly out of MVP scope — the two-agent computer-use extension

For QuickBooks Desktop (no modern REST API — QBXML/Windows-only), or REST-API-unreachable bespoke
setups (multi-entity consolidations, industry apps layered on QBO, UI-only settings): a future
**"AMTECH Local Companion"** — a narrow, code-signed local process on the office computer,
authenticated with a short-lived scoped credential from Manager (the same primitive as
`mcp-auth.ts`), exposing a small enumerated set of **Manager-issued jobs** (not open-ended
computer-use/vision autonomy) executed via deterministic browser automation (Playwright/CDP
against the QBO web UI) or a QBXML bridge for Desktop. The cloud Hermes employee remains the only
reasoning agent and the only point of owner contact; it queues a job, the Local Companion executes
it and returns a proof artifact (screenshot/recording) through the existing artifact/proof
envelope, and the owner sees the same approval-gated proof discipline as every other action. This
mirrors the 2026 industry pattern of pairing a cloud reasoning agent with a narrow local execution
surface rather than giving a cloud model direct desktop control. **Do not build this now** — the
REST-API-based native connector (§1-7) covers the QBO Online case, which is the large majority of
the beachhead and bookkeeper target regardless of revenue size; per the schlep-blindness/"don't
build for a hypothetical" discipline, scope the Local Companion only once a real customer's
workflow proves the REST API insufficient.

## Capabilities Summary and Example User Journeys (post Phase A+B, no Phase C computer-use)

Illustrative, not spec — grounds the architecture above in what an owner would actually
experience once Phase A and Phase B both land. Capabilities: connect via one consent link (no
API key/realm ID ever surfaced); read anything by name via `query_quickbooks` + the full report
set (P&L, Balance Sheet, Cash Flow, Trial Balance, General Ledger, Aged Receivables/Payables,
Customer/Vendor Sales/Balance/Expenses); write core transactions (Bill, Invoice, Payment,
Expense/Purchase, Deposit, Journal Entry, Bill Payment, Vendor Credit, Purchase Order, Time
Activity, Sales Receipt, Credit Memo, Refund Receipt) always through the owner-approval gate;
manage master data (Class/Department, and inactive-toggle instead of delete for entities QBO
itself only supports marking inactive); and receive proactive CloudEvents-driven notices
("Invoice #1042 marked paid") the same way a Gmail reply surfaces today. Ambiguity is a first-class
outcome — the employee asks rather than guesses on any unresolved name.

**Contractor example:** connect once → text "Sherwin-Williams charged $412 today, materials,
Miller job" → one approval card → posted. Job wraps → the existing Gmail/Stripe estimate/deposit
loop also books the matching QuickBooks Invoice, gated the same way. "How'd materials run this
month?" → `get_profit_and_loss`, plain language. An overdue invoice surfaces unprompted from Aged
Receivables in the daily brief. Two similarly-named vendors on "pay the truck bill" → the employee
asks which one.

**Small bookkeeping firm example (single client, prep-only per
[`../../wiki/segments/bookkeeping.md`](../../wiki/segments/bookkeeping.md)'s trust rule):** client
emails receipts to the firm's connected Gmail → the intake skill extracts vendor/amount/date →
each resolves against the client's QuickBooks, with an unrecognized vendor flagged rather than
silently created → a month-end close prep pack ("14 expenses ready, $3,840 total, 2 need input")
for one batch review, matching the "Bookkeeping handoff pack" / "month-end close prep" tasks
already named in [`../../wiki/offers/skill-catalog.md`](../../wiki/offers/skill-catalog.md) →
reconciliation/tax positions stay bookkeeper-only (flag, never auto-post) → a clean P&L/Balance
Sheet/aging pack at month-end.

**Two open gaps this design does not yet solve** (surface honestly rather than gloss over):

1. **One employee, one QuickBooks company.** `connector_accounts` mirrors Gmail's
   one-inbox-per-employee shape. That fits a contractor (one company file) or a bookkeeper serving
   one client per employee, but not a firm wanting **one employee across many clients' QuickBooks
   companies** — that needs a labeled multiple-connections-per-employee extension, not yet
   designed. Revisit if/when a bookkeeping-firm customer needs it.
2. **Batch approval.** `request_approval`/`resolve_approval` is proven for one Gmail send / one
   Stripe invoice at a time. High-volume categorization (a firm processing dozens of transactions)
   needs a batch-review pattern ("approve all 14 / flag 2") the current approval primitive doesn't
   explicitly cover. Design this as its own small extension when Phase B breadth is underway, not
   by overloading the single-item approval shape.

## Data Model Additions

`connector_accounts` is reused exactly as Gmail does it, with three additive columns:
`environment` (`sandbox`|`production`), `realm_id`, and `external_label` (a display-name
convenience — verified against `0001_init.sql`'s `unique (employee_id, connector_key)` constraint,
this does **not** lift the one-QuickBooks-company-per-employee limit named in gap 1 above; it only
labels the single connection an employee already has).

Two new Manager-only tables (RLS on, no anon/authenticated grants), decided in full in
`quickbooks-connector-implementation-plan.md` Phase A0:

- `quickbooks_pending_writes` — the approval-binding source of truth for every write: canonical
  payload, payload hash, the specific `approval_id` it was requested against (set once, never
  overwritten), status, and QBO proof ids once committed. This is what makes the
  `request_approval`/`resolve_approval` gate airtight for QBO specifically — see §3.
- `inbound_qbo_events` — webhook/CDC dedupe, mirroring `inbound_email_events`'s idempotency
  guarantee (`0010_phase3_inbound_event_dedupe.sql`) — confirm its exact shape once the CloudEvents
  envelope is verified against Intuit's migration guide at implementation time.

## Phasing

- **Phase A (MVP scope):** OAuth connect/test, entity resolution, core write tools (Bill, Invoice,
  Payment, Expense/Purchase, Deposit, Journal Entry) behind the approval gate, the generic
  whitelisted query tool plus core reports (P&L, Balance Sheet, Aged Receivables/Payables),
  CloudEvents webhook ingestion, capability-registry wiring. See
  [`quickbooks-connector-implementation-plan.md`](quickbooks-connector-implementation-plan.md).
- **Phase B (hardening/breadth):** remaining entity types (Vendor Credit, Purchase Order, Time
  Activity, Sales Receipt/Credit/Refund, Class/Department management), `/cdc` reconciliation sweep
  lane, sandbox↔production per-connector switch, QBO rate-limit-aware backoff.
- **Phase C (future, not MVP):** the Local Companion / computer-use bridge, §8.
