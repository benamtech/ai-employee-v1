# Phase 3 — SMS ambient inbox + signed previews/actions (source-wired); live tool-loop still bridge-blocked

Date: 2026-07-09 18:15
Status: Phase 1 preserved/static-green (live tool-exec still blocked by the bridge), Phase 2 source-wired + fixture-green, **Phase 3 source-wired** (signed previews/actions), Phase 4 contracts seeded
Scope: Implemented the second-half-plan Phase 3 to production shape, seeded the Phase 4 `WorkResource`/`WorkAction` contracts, applied migration 0017 to the live DB, and ran one honest live gate.

## What changed

Signed mobile preview/action surface — the SMS is now a real owner surface, not a bare text line.

Shared contracts (`packages/shared/src`):
- New `preview-links.ts`: `PreviewResourceType` (approval|artifact|work_event|task|connector|job), `PreviewActionType`, and the **first `WorkResource`/`WorkAction` contracts** (Phase 4 groundwork — Phase 3 previews are their first renderer). Pure helpers `defaultActionsFor` / `actionScopeFor`.
- `work-events.ts`: added `preview_url?` to `WorkEventDescriptor`; `renderWorkEventSms` is now **grammar-aware** (notify=Details / question=Open to answer / review=Review and approve here) and appends the signed link when present. Added `smsGrammarSuffix`. Kept pure to avoid a value-import cycle with `preview-links`.
- `routes.ts`: `MANAGER_API.previewResolve` (`/manager/preview/resolve`), `MANAGER_API.previewAction` (`/manager/preview/action`), web `reviewRoute(employeeId, token)`.
- `ids.ts`: `previewLink: "prev"`.

DB (`packages/db/migrations/0017_phase3_preview_links.sql`, **applied to live Supabase**):
- `preview_links` (id, account_id, employee_id, resource_type, resource_id, token_hash UNIQUE, actions text[], audience, expires_at, revoked_at, `consumed_at` single-use guard, access_count, run_id). Manager-only: RLS on, **no browser grants** (the `artifact_links` convention).

Manager libs (`apps/manager/src/lib`):
- `signed-links.ts`: extended `SignedPurpose` with `preview_link`; `mintPreviewToken`/`verifyPreviewToken` pack account/employee/resource_type/actions into `extra`, reuse the existing HMAC.
- New `preview-links.ts`: `createPreviewLink` (mints token + inserts row + builds review URL, mirrors `create_signed_artifact_link`) and `resolvePreviewLink` (the auth primitive — fails closed on invalid/not_found/expired/revoked/scope_mismatch; **cross-account tokens can't widen scope**).
- New `preview-render.ts`: `buildWorkResource` renders a `WorkResource` from the **same read model the web desk uses** (`buildEmployeeSnapshot`) + `renderArtifactHtml` for documents. **Artifacts are kind-agnostic, not PDF-only** (stored file → signed URL/media; payload-only → escaped HTML; media → media tier) — closes the Phase-1 `storage_ref`-only signed-link gap.

Manager routes (`server.ts`):
- `POST /manager/preview/resolve` — token IS the credential; decodes the scoped resource, renders the `WorkResource`, scopes offered actions to the token, increments access_count, audits `preview:access`.
- `POST /manager/preview/action` — `{signed_token, action, note}`. approve/reject reuse the idempotent `resolve_approval` state machine (actor=**owner**); respond/edit route the note into the same owner-turn pipeline (`deliverOwnerTurnToRuntime`); terminal actions set `consumed_at` (single-use → 409 on replay); audits `preview:action`.

SMS injection (`employee-events.ts`): new `attachPreviewLink`/`previewTargetForDescriptor` mint a link for a gated approval or a produced artifact and set `descriptor.preview_url` in **both** the wake and deliver paths, before `renderWorkEventSms`. The channel router re-renders from the same descriptor, so the persisted message and the outbound SMS carry the identical link — **no router change needed**. Mint failure falls back to a linkless message (never blocks the notification). `turn-drain.ts` left unchanged (bare text reply, no deliverable to link).

Inbound SMS (`webhooks/twilio.ts`): **no keyword parser** (founder decision — lean on the employee LLM, which already resolves approvals via its MCP `resolve_approval` tool). Added a signature-validated `/webhooks/twilio/status` delivery-status callback that updates `employee_messages.status` by `MessageSid` (static route ordered before `:employeeId`).

Web (`apps/web/app`):
- New `agent/[employeeId]/review/page.tsx` (server component; token-only, no owner login) + `ReviewClient.tsx` (mobile-first sticky Approve/Decline/Reply bar, document iframe with `sandbox=""`, structured fields, media, calm expired/reissue state). Fixture mode renders approval/estimate/report variants with no Manager/creds.
- New `api/employee/[employeeId]/preview/action/route.ts` proxy.
- `infra/scripts/ui/fixture-browser.mjs` now also screenshots the review surface (`review-mobile.png`).

## Why

The second-half plan needs SMS to stand alone. The delivery pipeline already existed; the missing piece was a signed, scoped, expiring link that renders the *same* work state on a phone and lets the owner act safely. Building the render contract as `WorkResource`/`WorkAction` makes Phase 3 the first slice of Phase 4 instead of throwaway. Keeping artifacts kind-agnostic matches the founder's "Claude/ChatGPT-style artifacts, not just PDFs" steer.

## Current status

- Phase 3: **source-wired**. Static + fixture proof green. Live SMS delivery not provider-proven (Twilio trial + bridge tool-loop).
- Phase 4: `WorkResource`/`WorkAction` + generic renderer tiers seeded; `SurfaceEnvelope`/`EmployeeEventStream`/capability registry deliberately **deferred**.
- Phase 1 live gate: **still blocked at end-to-end tool execution** — see below. Not `runtime-accepted`.

## Live gate (honest result — no faked proof)

Stack was already warm (bridge:8091, 1x Haiku worker, manager:8080). Brought web up (cleared a stale `.next` from a prior `npm run build`), applied migration 0017, reprovisioned a fresh MCP-wired employee, minted a dev owner session, and drove one estimate request.

- account: `acct_3t6yn02yc360oewyi2mvir`
- employee: `emp_fcm1977zc716277skjjzu4`
- runtime: container `amtech-hermes-emp_fcm1977zc716277skjjzu4`, `127.0.0.1:8771`, `/health` = 200, status `tools:MCP-wired`
- turn_job_id: `turn_vpthnn66760exmwwl8z8at`
- **Observed:** the employee (Haiku via bridge) produced the **correct** MCP tool call `mcp_amtech_manager_create_estimate_artifact` with a well-formed estimate payload... **as JSON text in the reply**, not an executed call.
- **DB truth after the turn:** artifacts=0, approvals=0, preview_links=0; `audit_log` has ONE row `manager | tool:provision_employee | ok` (`aud_n00ig6yun8bw8updddzjcu`) — **no `actor=employee` tool call, no artifact, no preview link**.
- **Blocker:** the temporary "you-are-the-LLM" model bridge returns tool-call JSON as text; it does not run Hermes's agentic tool-execution loop, so the MCP call never executes end-to-end. This is the known throwaway-bridge limitation (see the 2026-07-06 01:30 handoff, which *did* close this once but noted Haiku-via-bridge is inconsistent on multi-step chains). Real tool execution needs the actual Hermes runtime model loop or a funded provider — not the bridge. Did not burn tokens debugging the bridge (founder frugality steer).

Note: `/v1/toolsets` and `/v1/capabilities` on `:8771` returned empty — that port is the Hermes **gateway** (messaging+cron), not the API server; not investigated further this session.

## Files / seams touched

New: `packages/shared/src/preview-links.ts`, `apps/manager/src/lib/preview-links.ts`, `apps/manager/src/lib/preview-render.ts`, `packages/db/migrations/0017_phase3_preview_links.sql`, `apps/web/app/agent/[employeeId]/review/{page.tsx,ReviewClient.tsx}`, `apps/web/app/api/employee/[employeeId]/preview/action/route.ts`, and 5 unit files (`preview-links`, `preview-resolve`, `preview-action`, `sms-preview`, `twilio-status`).
Extended: `packages/shared/src/{work-events.ts,routes.ts,ids.ts,index.ts}`, `apps/manager/src/lib/{signed-links.ts,employee-events.ts}`, `apps/manager/src/server.ts`, `apps/manager/src/webhooks/twilio.ts`, `infra/scripts/ui/fixture-browser.mjs`.

## Carry-forward / next

- Close the live tool-exec gate with a real Hermes model loop (or funded provider); then re-run the estimate turn and confirm `actor=employee` audit + artifact + a minted `preview_links` row + the SMS link, and open the review link on a phone.
- Phase 3 provider proof: send a real Twilio status callback and confirm `employee_messages.status` updates; verify a signed review link end-to-end on mobile (Twilio trial recipient constraints apply).
- Phase 4 proper: promote `WorkResource`/`WorkAction` into `SurfaceEnvelope`/`EmployeeEventStream` + capability registry when a phase needs the seam; extend `previewTargetForDescriptor` to task/connector/job/work_event SMS links (resolve route already supports all six).
- Left running for inspection: web dev server (:3000) and employee container `emp_fcm1977…` (:8771). `npm run live:down` tears the whole stack down (kills the warm worker).

## Verification

From `mvp-build/` (all green):
- `npm run typecheck` — pass.
- `npm run test:unit` — **58 files / 346 tests** pass (was 53/315; +5 files / +31 tests, all Phase 3).
- `npm run lint` — pass.
- `npm run build` — pass.
- `npm run ui:test` — pass; wrote `infra/.local/ui-fixtures/{work-surface-desktop,work-surface-mobile,review-mobile}.png`. Review surface renders owner-language approval with amount/recipient/risk + sticky Approve/Decline/Reply.
- Live: migration 0017 applied to live Supabase; one owner turn driven end-to-end; **no tool executed** (bridge limitation, recorded above). No provider/runtime acceptance claimed.
