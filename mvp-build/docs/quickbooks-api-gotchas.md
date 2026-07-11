# QuickBooks Online API Gotchas Ledger

Status: source-wired (encoded as validated logic + unit tests 2026-07-10; live verification pending)

Purpose: carry forward hard-won, production-tested QuickBooks Online (QBO) API limitations so
they are encoded as validated business logic in the connector (`qbo.stub.ts`/`qbo-client.ts`) and
covered by unit tests — not re-discovered the hard way, and not left as raw API faults an owner or
the model has to interpret. Adapted from
[`laf-rge/quickbooks-mcp`'s `docs/quickbooks-api-limitations.md`](https://github.com/laf-rge/quickbooks-mcp/blob/master/docs/quickbooks-api-limitations.md),
a real production bookkeeping-tool team's findings, plus Intuit's own current developer docs.
Companion doc: [`quickbooks-connector-architecture.md`](quickbooks-connector-architecture.md).

**`[VERIFY AT IMPLEMENTATION]`** markers below flag facts that are either time-sensitive (Intuit
policy currently in flux) or were only confirmed against a single downstream source — re-check
against [developer.intuit.com](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account)
before relying on them in code.

## OAuth / token lifecycle

- Access tokens expire in **1 hour**. Refresh proactively (e.g. at ~50 minutes), not reactively on
  a 401.
- Refresh tokens rotate on every use — the old refresh token is invalidated the moment a new one
  is issued. Persist the new refresh token on **every** refresh call, not just at initial connect,
  and guard the refresh path with connector-level locking so two concurrent requests never race on
  the same rotating token (a lost race silently invalidates a token that looked valid a moment
  earlier).
- **`[VERIFY AT IMPLEMENTATION]`** current refresh-token validity window and rotation cadence —
  research surfaced a 100-day rotating window as the long-standing model, with Intuit having
  announced a policy shift toward more frequent rotation (communicated Nov 2025). Confirm against
  Intuit's current [OAuth 2.0 FAQ](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/faq)
  before implementation, since this has changed recently and may change again.
- The OAuth callback redirect includes `realmId` (the QBO company id) in the query string — unlike
  Gmail's OAuth callback, capture and persist it at `complete_quickbooks_oauth` time; every
  subsequent API call is scoped to a `realmId`, and mixing realm IDs across tenants is a
  data-integrity bug with real financial consequences, not just a cosmetic one.
- Sandbox companies support `http://localhost` redirect URIs for the initial handshake; production
  requires a public HTTPS callback. AMTECH's Manager already has a public HTTPS callback pattern
  from the Gmail connector (`gmailRedirectUri()`) — mirror it for QuickBooks
  (`qboRedirectUri()`), do not assume localhost works outside sandbox testing.

## Optimistic concurrency (`SyncToken`)

Every update operation requires the entity's current `SyncToken`; QBO rejects an update carrying a
stale token. Translate this into an owner-safe message ("this was changed in QuickBooks since we
last looked — refreshing and retrying") rather than surfacing the raw API fault, and re-fetch the
current entity + retry once before giving up.

## Sparse updates require extra fields beyond `Id`/`SyncToken`

QBO's "sparse update" mode (update only the fields you send) still silently *requires* certain
additional fields per entity, or the API 400s:

| Entity | Required beyond `Id`/`SyncToken` | Note |
|---|---|---|
| JournalEntry | (none extra) | Minimal requirements. |
| Bill | `VendorRef` | Must include the vendor reference even on an unrelated-field update. |
| Purchase (Expense) | `PaymentType` | `PaymentType` cannot itself be changed via sparse update, but must be included or the call 400s with `"Required parameter PaymentType is missing"`. |

Implementation rule: before any sparse update, fetch the current entity and merge the
config-driven required-field set (a small per-entity table, extendable as more entities are
added in Phase B) into the update payload automatically — never leave it to the caller (model or
otherwise) to remember.

## Expense (Purchase) department limitation

QBO expenses support **only one department at the header level**. The API schema includes
`DepartmentRef` on line-level `AccountBasedExpenseLineDetail`, but QBO rejects attempts to set a
line-level department when lines are added or modified (error: `"failed to parse json object; a
property specified is unsupported or invalid"`). A single vendor charge covering multiple
locations/departments **cannot** be represented as one expense with department-tagged lines.

Implementation rule: if a caller asks for a multi-department expense, reject with a clear
explanation and one of the two real workarounds, rather than silently collapsing to a single
department or a confusing partial failure:

1. **Split bills** (preferred for recurring cases): create separate expenses per department from
   one vendor charge, each with its own header-level department.
2. **Reclassification journal entry** (for corrections after the fact): debit the expense account
   in the correct department, credit it in the incorrect one.

## Known upstream bug: editing expense lines can strip department/vendor

When an expense (`Purchase`) edit modifies lines, a full (non-sparse) update is required — but if
the update payload doesn't explicitly re-copy `DepartmentRef` (location) and `EntityRef`
(vendor/payee) from the current entity, QBO's full-update semantics silently drop them. Any
line-editing tool must fetch the current entity first and always re-include `DepartmentRef` and
`EntityRef` in the update payload, even when neither field is being changed.

## Query / filtering limitations (the QBO "SQL-like" query language)

From [Intuit's Data Queries documentation](https://developer.intuit.com/app/developer/qbo/docs/learn/explore-the-quickbooks-online-api/data-queries):

- **Only "filterable" fields are queryable** in a `WHERE` clause, and this is per-entity, not
  universal. Filtering on a non-filterable field produces an opaque
  `QueryValidationError: property 'X' is not queryable`, not a helpful message.
- `DepartmentRef` and `AccountRef` are **not filterable** on transaction entities (SalesReceipt,
  JournalEntry, Purchase, Invoice, Deposit) even though the fields exist on those entities — use
  the department/class parameters on report endpoints (P&L, Balance Sheet) instead, since those use
  a different API surface that does support that filtering.
- No `OR` operator, no `GROUP BY`, no `JOIN`, no field projection (every property comes back on
  every returned object).
- Comparison values must use **single quotes**, not double quotes.
- `LIKE '%pattern%'` is the only supported wildcard form.
- Max 1000 results per query; page with `STARTPOSITION`.

Implementation rule: the connector's generic query tool must carry a **per-entity
filterable-fields whitelist** (adapted from `laf-rge/quickbooks-mcp`'s `filterable-fields.ts`) and
reject/redirect queries against non-filterable fields with a helpful message and a report-endpoint
suggestion where one exists, rather than passing the query straight through to QBO and returning
its opaque fault. The same whitelist boundary is also the injection-safety control for this
surface: string literals inserted into the generated QBO query must be validated/escaped for
single quotes before being interpolated, so a QBO-query-injection attempt (e.g. via a
vendor/customer name containing a crafted string) cannot alter the query's WHERE-clause structure.

## Webhooks and real-time sync

- QBO webhooks are **notification-only** — the payload does not include the changed record, only
  a trigger (realm + entity + operation) to go fetch it via a subsequent API call.
- **`[VERIFY AT IMPLEMENTATION]`** Intuit is migrating webhook payloads to the **CloudEvents**
  envelope format (a CNCF standard), with a **mandatory cutover of 2026-07-31**. Under CloudEvents,
  the realm, entity type, and operation live in different envelope locations (subject/type/data)
  than the legacy format, and **one notification can contain events for multiple companies** — any
  new adapter must fan out per-company before matching a `connector_accounts` row. Build the
  webhook adapter against the CloudEvents shape from day one; do not build against the legacy
  format and migrate later, given how close the deadline is.
- Change Data Capture (`GET /cdc?entities=...&changedSince=...`) is capped at a **30-day lookback
  window** — useful as a scheduled reconciliation sweep (mirroring the existing
  `renew_expiring_watches` pattern), not as the primary delivery path.
- Supported entity operations via webhook: Create, Update, Delete, Merge, and Void for most
  entities (Account, Bill, Customer, Invoice, Item, Payment, Vendor, and more) — confirm the exact
  entity list against Intuit's current webhook docs at implementation time.

## Delete vs. inactive-only entities

Several entity types do not support hard delete via the API at all — only marking `Active: false`
(what the UI calls "make inactive"): Account, Item, Class, Department, Term, Payment Method, Tax
Code, Tax Rate, Tax Agency, and Company Info. A generic "delete" tool must branch by entity type
and use the inactive-toggle path for these, not assume every entity has a delete endpoint.

## Void is a distinct operation from delete on several transaction entities

Confirmed via `@apigrate/quickbooks`'s entity support table (the chosen Accounting-API client —
see `quickbooks-connector-implementation-plan.md`'s Client Library Decision): Invoice,
BillPayment, Payment, and SalesReceipt support an explicit **void** operation in addition to
delete. Voiding zeroes the transaction's financial amounts while keeping the record (and its
number/audit trail) in place; deleting removes the record entirely. These are not interchangeable
— a "cancel this invoice" request from an owner is very likely a void, not a delete, especially
once a payment has been applied against it. Any Phase B write tooling for these four entities
should expose void as its own action, not silently map "cancel"/"remove" language onto delete.

## Rate limiting (HTTP 429)

QBO enforces per-realm request-rate limits; exceeding them returns HTTP 429. The chosen
Accounting-API client (`@apigrate/quickbooks`) has built-in throttle detection with a configurable
backoff-and-retry (`throttle_backoff`, default 10s) — reuse this rather than adding a second,
competing retry layer in `qbo-client.ts`. Sandbox companies are commonly on tighter or shared
limits than production; expect 429s to surface more often during acceptance-harness testing
against a sandbox company than in a real customer's production connection.
