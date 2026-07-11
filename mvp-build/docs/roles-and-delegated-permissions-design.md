# Roles & Delegated Permissions — Design (deferred build)

Status: design · 2026-07-11 · author: source audit + design (no live host) · scope = Part C of the two-way-surface pass

> **Explicitly deferred.** This is a design to build AFTER live provider proof, admin/billing, and the
> limited real-VPS tests (see [Part D](#part-d--sequence)). Nothing here is built this pass. The point of
> designing it now is to name the seams so the base we harden in the meantime already fits multi-user.

Companion docs: [`inbound-two-way-surface-map.md`](inbound-two-way-surface-map.md) (Part A),
[`production-networking-and-dns.md`](production-networking-and-dns.md) (Part B).

## The need (worked example)

Today the model is **single-owner**: one account, one owner, one verified phone. Real small businesses have a
**secretary/admin** who does daily back-office work. The target behavior:

> A secretary may tell the employee to `send_invoice` or `mark a deposit in QuickBooks` and the employee does
> it directly (within the secretary's scope). But if the secretary asks the employee to place an **online
> order**, add a **new vendor**, or otherwise **spend money / act outside scope**, the employee pauses and
> raises an **approval to the OWNER's phone** — the secretary is the requester, the owner is the approver —
> and only proceeds once the owner approves by SMS.

Two invariants fall out: (1) **requester ≠ approver** — a delegated user's risky action is authorized by
someone else; (2) **the employee must know who is talking and what they may authorize** on each turn.

## What already exists to reuse (do NOT reinvent)

| Seam | File | What it gives us |
|---|---|---|
| Membership table | `packages/db/migrations/0001_init.sql:42` `account_memberships` | Already has `role text default 'owner'` + a literal "admin roles later" comment and `unique(account_id,user_id)`. **This is the multi-user seam** — only `owner` is used today. |
| Approval gate policy | `packages/shared/src/approval-policy.ts` | `OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS` (derived from send/QBO-write groups) + `requiresOwnerAuthenticatedResolution({action_key,risk_level})`. The single extension point for per-role gating tiers. |
| Approval binding | `apps/manager/src/lib/employee-events.ts:74-110` `bindApprovalIfNeeded` | Creates the `approvals` row with `risk_level`, `action_key`, `refs`. Where a `requested_by` gets stamped. |
| Route-to-owner | `apps/manager/src/lib/channel-router.ts:39-45` `loadOwnerPhone` | Already resolves the OWNER's most-recent verified phone regardless of who triggered the intent — the seam to send a secretary-triggered approval to the owner. |
| Resolve gate | `apps/manager/src/server.ts:171` (`actor: "owner"` for `resolve_approval`) + signed preview action (`apps/web/app/api/employee/[employeeId]/preview/action/route.ts`) | Owner-authenticated resolution paths. Extend with a requester≠approver binding. |
| Identity | `apps/manager/src/lib/owner-session.ts` (`owner_web_sessions`: `account_id`+`user_id`, **no role**) | Add a role claim resolved from `account_memberships`. |
| Phone identity | `verified_phones` (per-account) + `SMS_ALLOWED_USERS` (single owner phone, `packages/agent-template/.env.tpl`) | Extend to per-user phone identity (which number = which member). |
| Audit | `apps/manager/src/lib/audit.ts` `writeAudit` (actor enum, auto-sanitized details) | Record who requested + who approved. |
| Per-turn identity | `apps/manager/src/lib/hermes-client.ts:270-275` `createRun` | Already injects per-turn `system_message`/`instructions` + `metadata` — the mechanism to tell the employee who is talking (see [Hermes angle](#hermes-angle)). |

**Do NOT conflate with migration `0025` `platform_user_roles`.** That table
(`platform_owner`/`platform_operator`/`support_readonly`/`billing_operator`/`security_reviewer`) is the
**AMTECH-staff** admin audience for the internal `/admin` console — a different subject entirely. Account
member roles (owner/secretary) are a **new** schema on the `account_memberships` base.

## The model

### Members and roles
Extend `account_memberships` (or add `account_members` as the product-facing name over it) so an account has
multiple users, each with a `role`:
- `owner` — full authority; the only role that can approve owner-auth-required actions and manage members.
- `secretary` (first delegated role) — a **capability scope**: a set of `action_key`s the user may trigger
  directly, everything else routes to owner approval.

Roles map to **capability scopes**, not a bespoke per-user ACL. A scope is "which `action_key` groups this
role may execute without owner approval." Seed scopes (illustrative; final list set at build):
- `secretary` direct-allow: `send_invoice`, QBO deposit/payment marking (`commit_quickbooks_payment`),
  routine sends already gated today but safe for a trusted admin.
- `secretary` always-to-owner: any spend / new-vendor / new-payee action, `delete_customer_data`, connector
  changes, anything with `risk_level: "high"` or `leaves_business`.

### The per-role gating tier (extend `approval-policy.ts`)
Today `requiresOwnerAuthenticatedResolution` is role-blind (owner is the only user). Generalize it to a
**two-argument policy**: `resolutionRequirementFor(approval, requesterRole)` →
`"self" | "owner_approval"`. Rules:
- If `requesterRole === "owner"`: unchanged — the existing derived set applies (owner still confirms
  money/send via their own authenticated path; that is a self-confirmation, not a second person).
- If `requesterRole === "secretary"`: return `"owner_approval"` whenever the action is **outside the
  secretary direct-allow scope** OR is in the existing `OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS` set at a
  tier the role can't self-clear. Keep the derived-set discipline: a new money/send `action_key` is
  owner-approval-required for a secretary **by default**, opt-out only by explicitly adding it to the
  secretary scope.

This preserves the current invariant (a new gated action can't silently become un-gated) and layers roles on
top without a parallel policy.

### Requester ≠ approver binding
- `bindApprovalIfNeeded` stamps `requested_by` (member user_id + role) on the `approvals` row.
- The approval notification routes to the **owner's** number via `loadOwnerPhone` (already owner-scoped), not
  the requester's — so the secretary's risky ask pings the owner.
- `resolve_approval` (and the signed preview action) must verify the resolver is an **owner** of that account
  and record `approved_by`. A secretary resolving their own request is rejected. The signed-preview path is
  the natural owner-approval channel: the link is minted for and delivered to the owner; the token already
  binds account/employee (`preview-links.ts`) — add an **approver-role assertion** so only an owner token can
  clear an owner-approval-required action.
- `audit_log` records both sides: `requested_by`, `approved_by`, `role`, `action_key`, outcome — via the
  existing `writeAudit` (details auto-sanitized).

### Phone / SMS identity (per-user)
- Generalize `SMS_ALLOWED_USERS` from "the one owner phone" to a **per-number identity map** (number → member
  user_id + role). Inbound SMS (`webhooks/twilio.ts:155-161`) resolves `From` to a member, not just
  "is this the account's verified phone." An unknown number stays 403.
- Owner-approval SMS always goes to an **owner** number (there may be several members but the approver set is
  the owners). If an account has multiple owners, any owner may approve (define the quorum at build; default
  = any single owner).
- Consent/TCPA: each delegated number is its own verified-consent record in `verified_phones` (the table
  already carries `consent_channel`/`consent_text`/`verification_method`). A secretary must opt in like an
  owner does — owner-directed/inbound is fine; no cold outbound.

### Web identity (role claim on the session)
- `owner_web_sessions` gains a `role` (resolved from `account_memberships` at mint time), or the resolver
  `requireOwnerSession` returns `{account_id, user_id, role}`. Web routes then gate on role the same way the
  SMS path does. (Rename is optional; the table is fine as the session store for all member roles.)

## Hermes angle

The employee must know, per turn, **who is talking and what they may authorize** — and this must be per-turn
context, **not baked into the profile** (the profile is the employee's stable identity/memory, shared across
all the account's users). The mechanism already exists:

- `hermes-client.ts createRun` (`:270-275`) already sets per-turn `instructions`/`system_message` and
  `metadata`. Manager stamps a per-turn identity block into `system_message` — e.g. "This message is from
  {name}, role: secretary. They may: {scope}. For anything outside that, produce an approval deliverable for
  the owner; do not act." — and mirrors machine-readable `{ requester_user_id, requester_role }` into
  `metadata`. The employee never invents authority; Manager asserts it per turn, exactly like it already
  stamps `account_id`/`employee_id`/proof and refuses model-invented identity (`wake.ts:37` system prompt).
- `X-Hermes-Session-Key` (`docs/hermes-agent-authoritative-record.md:157-166`,
  `gateway_session_key`) gives multi-user frontends a stable memory scope. Decision for build: keep **one
  employee session-key scope per account** (the employee is one coworker the whole office shares) and carry
  the acting user in per-turn `system_message`/`metadata`, rather than forking a session per member — the
  secretary and owner talk to the *same* employee with the *same* memory, just with different authority. (If
  a per-user memory boundary is ever wanted, `X-Hermes-Session-Key` is the lever.) This is a **design**
  against the local authoritative record plus `hermes-client.ts`'s current `createRun` body shape, not runtime
  acceptance. Build gate: before implementing roles, query the running Hermes version's `/v1/capabilities`
  and re-check Sessions/Runs metadata + session-key behavior.

The approval gate stays a **Manager** control-plane decision (policy + who-can-resolve), not something the
model is trusted to enforce — the model only *produces* the approval deliverable; Manager decides it needs an
owner and to whom it routes. This matches the existing trust boundary (`architecture-and-security-review`,
agent-boundary hardening `0023`).

## Seams to touch at build (checklist)

- `packages/shared/src/approval-policy.ts` — add `resolutionRequirementFor(approval, requesterRole)` +
  per-role direct-allow scope sets (derived-set discipline preserved).
- `apps/manager/src/lib/owner-session.ts` / identity — role claim from `account_memberships`.
- `packages/agent-template/.env.tpl` `SMS_ALLOWED_USERS` — per-number identity map.
- `apps/manager/src/webhooks/twilio.ts` — resolve `From` → member+role, not just account phone.
- `apps/manager/src/lib/employee-events.ts` `bindApprovalIfNeeded` + `apps/manager/src/lib/wake.ts` — carry
  `requested_by`/`requester_role` through the wake + approval binding; add the per-turn identity block.
- `resolve_approval` (`server.ts`) + signed preview action — approver-role assertion + `approved_by`.
- `apps/manager/src/lib/channel-router.ts` — already owner-scoped for approval routing; confirm the intent
  carries requester so the audit is complete.
- `apps/manager/src/lib/audit.ts` usage — log `requested_by` + `approved_by` + `role`.
- **New migration** — `account_members`/roles + capability scopes + approval `requested_by`/`approved_by`
  columns. Follow the `0025`/`0018` posture: **RLS Manager-only, browser grants revoked, service-role
  authority** (never authorize off `user_metadata`). New browser-readable tables get a Data-API/RLS review.

## Part D — sequence

Roles are designed now, built **last**, on a proven base. Reconciled with
[`../second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md`](../second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md):

1. **This review/design** (now, no creds): Parts A–C.
2. **Finish remaining MVP surface features + live provider acceptance** (on creds): close the employee LLM
   tool loop on a real provider-backed Hermes model, run the Phase 1 harness.
3. **Finish admin + real billing** (Phase 5 → real collection/paywall state, not just scaffold).
4. **Limited real-VPS production tests**: 5–100 employees per pod, one employee per business, NOT blitzscale;
   prove reboot recovery, backups/DR, observability, egress `--apply`, and a real capacity number (~20–25 per
   64GB node, honest).
5. **THEN build roles/delegation** on the proven base.

Designing it now costs nothing and keeps the hardening we do in steps 2–4 (identity, approval binding, audit,
per-turn Hermes context) already shaped for multi-user, so step 5 is additive, not a refactor.
