# QuickBooks connector: deep research + architecture plan (docs only, no source changes)

Date: 2026-07-10 15:00
Status: planned (docs only — no `mvp-build` application source/schema/tests changed)
Scope: architecture research and decision-complete Phase A plan for a native QuickBooks Online
connector; three new docs + CODEGRAPH/wiki updates.

## What changed

Added three new docs under `mvp-build/docs/`, mirroring the existing
`admin-system-architecture.md`/`admin-system-implementation-plan.md` pairing:

- `docs/quickbooks-connector-architecture.md` — the full architecture: connector lifecycle
  (mirrors `gmail.stub.ts`), entity-resolution-with-disambiguation layer (`qbo-lookup.ts`,
  new pattern beyond either reference repo), approval-gate extension for all writes (extends
  `approval-policy.ts`'s `SEND_GATE_ACTION_KEY_GROUPS` pattern with `QBO_WRITE_ACTION_KEY_GROUPS`),
  CloudEvents-native event mesh, capability-registry/materialization wiring (zero new UI code),
  an MCP-security posture table mapping current research (lethal trifecta, tool poisoning, OAuth
  confused-deputy/audience validation) against what AMTECH already has, and an explicitly-future
  (not-MVP) "AMTECH Local Companion" two-agent computer-use design for QuickBooks Desktop/
  non-API workflows.
- `docs/quickbooks-connector-implementation-plan.md` — decision-complete Phase A build sequence
  (A0 shared contracts/schema through A6 capability-registry wiring), representative files to
  create, an acceptance-harness seam (`run9-quickbooks.mjs`), and pass/fail criteria per tool
  group.
- `docs/quickbooks-api-gotchas.md` — a carried-forward, AMTECH-adapted QBO API limitations ledger
  (SyncToken optimistic concurrency, sparse-update required-field quirks per entity, single-
  department-per-expense, a live upstream bug that strips department/vendor on expense line
  edits, per-entity filterable-fields whitelist for the query surface, and the CloudEvents webhook
  migration deadline), to be encoded as validated business logic + unit tests at implementation
  time, not re-derived.

Also updated: `mvp-build/CODEGRAPH.md` (docs table + a new "Next named connector (planned)" line
under Current status), and `wiki/offers/wedge-offers.md` (promoted "+ Drive/Calendar/QBO" to a
concrete named "Employee · + QuickBooks" connector tier row, with a corrected framing — see Why).

## Why

Ben asked for a deep research/documentation/planning pass (explicitly not an implementation pass)
on native QuickBooks support, citing two reference repos
(`github.com/intuit/quickbooks-online-mcp-server`, `github.com/laf-rge/quickbooks-mcp`) and asking
for MCP-development/prompt-injection/agent-security research plus a future two-agent computer-use
idea for QBO Desktop and complex back-end setups. Both repos were fetched and read in full
(tree, README, architecture docs, and representative handler/tool source), plus current (2026)
web research on QBO's OAuth/webhook platform facts and MCP security landscape.

**Core architecture decision:** build QuickBooks as a new Manager tool family (`qbo.stub.ts`)
mirroring `gmail.stub.ts`/`stripe.stub.ts`, not a bolted-on MCP subprocess and not either reference
repo's runtime. This means QuickBooks inherits, for free, everything already proven: Manager-as-
MCP dispatch, secrets-by-reference, the owner-approval gate, audit logging, the capability
registry/materialization layer, the event mesh, and the per-employee scoped MCP credential
boundary (migration `0023`).

**The one correctness/security finding worth remembering across sessions:** both reference repos'
write-safety model is a model-controlled `draft`/`confirm` boolean with no binding between the
previewed payload and the commit call — a textbook confused-deputy / prompt-injection surface (a
poisoned vendor memo or an ambiguous instruction could talk the model into flipping the flag
itself). AMTECH's existing `request_approval`/`resolve_approval` + `approval-policy.ts` gate is
strictly stronger (out-of-band, owner-authenticated resolution the agent cannot self-grant) and
this design explicitly extends that gate rather than reproducing the weaker pattern.

**Correction mid-session:** an initial framing characterized "$1-20M contractors with 0-3 office
staff" as a distinct, more-mature tier that QuickBooks support would newly unlock. Ben corrected
this — QuickBooks is simply the default small-business accounting tool; sub-$500k owner-operators
already use it, so it's broadly relevant across the whole beachhead today, not a step above it.
Saved as a standing correction in cross-session memory (`quickbooks-adoption-not-size-gated` in
the `GTM-RESEARCH` memory project) and reflected in both the architecture doc's opening framing and
the `wedge-offers.md` update.

**Live, time-sensitive fact surfaced by research:** Intuit's QBO webhook payload format is
migrating to a CloudEvents envelope with a mandatory cutover of 2026-07-31 — three weeks from this
research date. Any QuickBooks webhook adapter must be built CloudEvents-native from day one; this
is called out with a `[VERIFY AT IMPLEMENTATION]` marker in both new docs since Intuit's exact
migration shape should be reconfirmed right before building it.

## Current status

`planned` — docs only. No `mvp-build` application source, schema, or test files were changed. No
QBO sandbox account, OAuth app, or credentials exist yet. Nothing in this pass claims
`source-wired` status.

## Files / seams touched

- `mvp-build/docs/quickbooks-connector-architecture.md` (new)
- `mvp-build/docs/quickbooks-connector-implementation-plan.md` (new)
- `mvp-build/docs/quickbooks-api-gotchas.md` (new)
- `mvp-build/CODEGRAPH.md` (docs table + current-status "Next named connector" line)
- `wiki/offers/wedge-offers.md` (connector-tiers table row + Rung-3 description + revision date)

Seams the next implementation phase plugs into (all existing, all reused rather than forked):
`apps/manager/src/tools/gmail.stub.ts` (the pattern being mirrored),
`apps/manager/src/lib/secrets.ts`, `apps/manager/src/lib/mcp-server.ts`,
`apps/manager/src/lib/capability-registry.ts`, `packages/shared/src/approval-policy.ts`,
`apps/manager/src/events/ingress.ts` + `events/adapters/*`, `connector_accounts` table.

## Carry-forward / next

- When implementation actually starts, follow `docs/quickbooks-connector-implementation-plan.md`
  Phase A0-A6 in order; it's already decision-complete (representative files, pass/fail criteria
  per tool group, migration/table decisions deferred only where they depend on confirming the
  CloudEvents envelope shape against Intuit's current docs).
- Before writing the webhook adapter, re-verify against Intuit's live docs: the CloudEvents
  migration deadline/shape (2026-07-31 per this research — may have since passed or changed) and
  the current refresh-token rotation policy (100-day window was the model at research time, with a
  Nov-2025-announced shift toward more frequent rotation).
- This pass did not touch `mvp-build`'s current in-flight uncommitted work (Phase 5 admin/ops —
  `capability-registry.ts`, `server.ts`, `ids.ts`, `routes.ts`, `index.ts`, admin.ts/app/admin/ new
  files, migration `0025`). That work is unrelated and untouched; do not conflate the two when
  reviewing `git status`.
- One-phase-per-plan convention: Phase B (breadth/hardening) and Phase C (future Local Companion)
  are named in the architecture doc but intentionally not planned in file-level detail — write
  their own plans separately when their turn comes, per standing guidance.

## Verification

No code verification applicable (docs-only pass). Verified instead: every reference-repo claim is
grounded in an actually-fetched file (tree listing + README + `docs/ARCHITECTURE.md` +
`auth-server.ts` for the Intuit repo; tree + README + `docs/quickbooks-api-limitations.md` +
`journal-entry.ts` + `filterable-fields.ts` + `delete.ts` + `auth/token-validator.ts` for
laf-rge's), not just README marketing framing. `git status`/`git diff` after this pass shows only
the new docs + this handoff + the two doc/wiki edits — no `mvp-build` application source touched.

## Same-session follow-ups (still docs only)

Three more additions landed in this same research/planning arc, all still docs-only:

1. **Fastest-path-to-first-write addendum** in
   `docs/quickbooks-connector-implementation-plan.md`: verified `intuit-oauth` (maintained
   directly by Intuit engineers) and `node-quickbooks` (the community standard both reference
   repos wrap) are both actively maintained on npm at research time, and confirmed
   `node-quickbooks`'s constructor (`QuickBooks(consumerKey, consumerSecret, token, tokenSecret,
   realmId, useSandbox, debug, minorversion, oauthversion, refreshToken)`) is cheap/stateless per
   call — exactly right for building a fresh client per call from a connector row rather than a
   singleton. Recommended vertical slice: OAuth lifecycle via `intuit-oauth` → `qbo-client.ts`
   wrapping `node-quickbooks` → minimal `qbo-lookup.ts` (Vendor+Account only) → one write tool,
   `create_expense`, all the way through the real approval gate — proves the whole pipeline before
   building full Phase A0-A6 breadth.
2. **Capabilities Summary and Example User Journeys** section added to
   `docs/quickbooks-connector-architecture.md`: a contractor journey and a small-bookkeeping-firm
   journey (grounded in `wiki/segments/bookkeeping.md`'s prep-only trust rule and
   `wiki/offers/skill-catalog.md`'s named tasks), plus two open gaps surfaced honestly rather than
   glossed over: (a) `connector_accounts` is one-QuickBooks-company-per-employee, mirroring
   Gmail's shape — a firm wanting one employee across many clients' QBO companies isn't supported
   yet; (b) the approval gate is proven one-item-at-a-time (one Gmail send, one Stripe invoice) —
   high-volume categorization needs a batch-review pattern not yet designed.
3. **`docs/quickbooks-connector-implementation-handoff-prompt.md`** — a copy-ready session-handoff
   prompt (mirroring `second-half-plan/phase-01-handoff-prompt.md`'s style) to actually run the
   Phase A0-A6 implementation plan in a fresh session, explicitly scoped apart from the current
   Phase 4/5 loose ends (live migrations `0022`-`0025`, platform-operator seeding, reprovision
   proof, live Hermes tool-execution gate, Phase 3/4/5 provider proof, egress control) so a fresh
   agent doesn't drift into that backlog instead. Read order, sequencing (vertical slice before
   breadth), non-negotiables, required tests per the pass/fail table, memory/codegraph update
   points, and definition of done are all specified.

Still `planned` — nothing beyond docs (now five: architecture, implementation plan, gotchas
ledger, this handoff prompt, plus the wedge-offers.md/CODEGRAPH.md edits) has changed. Next actual
implementation session should start from
`docs/quickbooks-connector-implementation-handoff-prompt.md`.

## Heavy critique pass + fixes (same session, continued)

Ben asked for a heavy critique of a draft Phase A plan he'd written independently at
`mvp-build/qucikbooks-full-implemetnation-plan-for-mvp-please-critique-heavily-before-implementing.md`.
The critique found, verified directly against the actual current source (not memory/assumption):

1. **The file itself was corrupted** — two overlapping drafts concatenated, one cut off mid-sentence.
2. **The approval↔pending-write binding was ambiguous** on the one property that matters: whether
   `commit_quickbooks_write` checks that the supplied `approval_id` is *the specific one* the
   pending write was granted against, or just "does some approval say approved" — the latter would
   allow replaying an unrelated already-approved approval against a different, unapproved write.
3. **`commit_quickbooks_write`'s schema needed a called-out exception** to this codebase's default
   zod `.passthrough()` convention (verified directly in `tool-schemas.ts` — every tool schema
   uses `.passthrough()` by documented design) — this is the one tool where extra fields must be
   structurally impossible, not just discouraged.
4. **The draft's own reversal of the earlier `node-quickbooks` recommendation had no stated
   reasoning** — it just said "will not be used," in favor of a hand-rolled direct-fetch client.
5. **"Fold `QBO_WRITE_ACTION_KEY_GROUPS` into `SEND_GATE_ACTION_KEY_GROUPS`" was a semantic
   mismatch** — verified directly in `approval-policy.ts`: that array's own doc comment scopes it
   to customer/money-facing **sends** (Gmail, Stripe); a QBO write commits to the books, it isn't
   a send. The file already has the right precedent for this (`RESERVED_OWNER_AUTH_ACTION_KEYS`)
   that the draft didn't use.
6. **`external_label` didn't fix, and didn't acknowledge, the one-connector-per-employee
   constraint** — verified directly in `packages/db/migrations/0001_init.sql`:
   `connector_accounts` has `unique (employee_id, connector_key)`. Cosmetic label only.
7. Medium findings: all four write entities were being built in parallel with no internal
   ordering (risk: one systemic design flaw gets replicated four times before being caught); rate
   limiting wasn't mentioned; the file didn't cross-reference or reconcile with the four docs
   already in `mvp-build/docs/`.

Ben then asked to apply all fixes and settle the library question in favor of official packages
with a documented extension escape hatch rather than hand-rolled fetch tooling. Researched live
(npm + GitHub, not assumed): **`intuit-oauth`** is confirmed genuinely Intuit-maintained (maintainer
accounts resolve to `@intuit.com`). There is no official Intuit Accounting-API SDK. Compared the
two community options directly against their actual source: `node-quickbooks` (367 stars, wide
adoption, but `oauth-1.0a` legacy dependency, callback-style, hardcoded sandbox/prod URLs, no
built-in retry) vs. `@apigrate/quickbooks` (21 stars, Apache-2.0, but read its 780-line `index.js`
directly: native promises, dynamic discovery-document URL resolution, **built-in HTTP 429
throttle/backoff**, automatic 401-triggered refresh via an `EventEmitter` hook, dedicated error
classes, complete entity coverage including **void** support on Invoice/BillPayment/Payment/
SalesReceipt as a distinct operation from delete, and 24 report types covering the entire Phase
A+B report wishlist — real weakness: no shipped TS types, no automated test suite of its own).

**Decision:** `intuit-oauth` owns the OAuth lifecycle (the security-sensitive, Intuit-owned part);
`@apigrate/quickbooks`'s `QboConnector` is used **only** for its Accounting-API methods (never its
own OAuth), so exactly one thing ever owns refresh-token rotation; `qbo-client.ts` exposes a
narrow typed surface with a documented `qboRawFetch` escape hatch for any future gap — not the
primary strategy, a deliberate fallback. All five findings above were fixed directly in
`docs/quickbooks-connector-implementation-plan.md` (now the single canonical Phase A doc, with a
"Client Library Decision" section and an explicit `quickbooks_pending_writes`/`commit_quickbooks_write`
binding design), with matching updates folded into `quickbooks-connector-architecture.md` (§1, §3,
Data Model Additions) and `quickbooks-api-gotchas.md` (added a void-vs-delete section and a
rate-limiting section, since `@apigrate/quickbooks`'s built-in throttle handling resolves the
gap the critique flagged). The malformed draft file was deleted after its useful ideas (the
dedicated pending-writes table concept) were merged in — per the living-brain rule, one canonical
doc, not a sixth diverging one.

Still `planned` — docs only, no `mvp-build` application source changed.
