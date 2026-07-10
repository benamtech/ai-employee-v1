# MVP hardening pass — 5 review fixes + accumulated stragglers + CRITICAL RLS closure

Date: 2026-07-09 22:10
Status: source-wired + fixture-green; live DB migrated (0018-0021) and verified; live tool-loop still bridge-blocked
Scope: Fixed the 5 code-review findings on the Phase 3 signed-preview code, then swept and fixed accumulated security/concurrency/robustness stragglers flagged by two adversarial reviews and the Supabase advisor. Grounded the two non-obvious fixes in online research.

## What changed

### The 5 review findings (Phase 3 code)
1. **Dead "Open document" button** — added `WorkResource.open_url` (shared `preview-links.ts`); `preview-render.ts` sets it to the signed storage URL for stored-file artifacts; `ReviewClient.tsx` renders a `view` action as a real `<a href>` anchor.
2. **Expired vs invalid token** — new `decodeSignedToken(token, purpose): {payload, expired}|null` in `signed-links.ts` (verify signature+purpose, don't reject on expiry — the JWT-library pattern). `verifyPreviewToken` returns an `expired` flag; `resolvePreviewLink` maps an aged token to `reason:"expired"` → route 410 → the review page's reissue state. Artifact-resolve got the same 410 treatment.
3. **Approval preview amount** — `bindApprovalIfNeeded` now persists `amount_cents` (stringified) + `currency` into the approval `refs` when `deliverable.money.involved`; `money()` parses strings. (Test previously seeded an unrealistic number.)
4. **`createPreviewLink` false success** — insert wrapped in `mustWrite` so a persistence failure throws and `attachPreviewLink` falls back to a linkless SMS.
5. **Deliver-path orphan** — `bindApprovalIfNeeded` + `attachPreviewLink` moved AFTER the `inbound_events` dedupe claim in `employee-events.ts`; the enriched descriptor is folded into the existing `trace_update`, so a lost at-least-once race no longer orphans an approval/preview_link row.

### Security stragglers (the big one)
- **CRITICAL RLS closure.** `anonClient` is defined but never imported — the browser never reads Supabase directly, so RLS-no-policy is safe. 21 public tables had NO RLS (users, onboarding_sessions=chat+phone, claim_tokens, inbound_email_events=customer email bodies, audit_log, stripe_*, …), readable cross-tenant via the anon Data API. **Migration 0018** enables RLS (no policy = Manager-only) on all 21; **0019** does the same for the runner's `_migrations` table (owner bypass keeps migrate working). Verified: Supabase `get_advisors` shows zero `rls_disabled_in_public` ERRORs remain.
- **Turn-queue RPCs anon-exposed.** `claim/complete_employee_turn_job` are SECURITY DEFINER and were EXECUTE-able by anon via `/rest/v1/rpc` — an attacker with the public anon key could claim owner turns and read message bodies. **0020** (revoke from anon/authenticated) was insufficient because EXECUTE is granted to PUBLIC by default; **0021** revokes from `public` and grants `service_role`. Verified via `has_function_privilege`: anon/authenticated=false, service_role=true (Manager unaffected).
- **`mustWrite` false-success fixes** (`gmail-tokens.ts` refresh persist → silent Gmail disconnect + lost rotated refresh token; `owner-session.ts` mint → login that always 401s; front-door `onboarding_sessions` + `claim_tokens` inserts → dead claim link). Employee-message-history inserts left best-effort deliberately (mustWrite there would trade a rare hole for duplicate rows on Twilio retry, since there's no MessageSid dedupe index — deferred).
- **`denyInternal` hardened** to fail closed unless `ALLOW_UNAUTH_DEV=1` (+ non-production); the old guard keyed only on NODE_ENV, so a deploy with NODE_ENV unset left the control plane open.
- **jti** now uses `crypto.randomBytes` (not `Math.random`); **Gmail Pub/Sub** failures now leave an `audit_log` record instead of a silent 204 swallow.

### Concurrency / robustness stragglers
- **Stuck-`running`-turn reaper** (`turn-drain.ts` `reapStuckTurns` + `reap_stuck_turns` scheduler lane): a crashed worker used to leave a turn `running` forever with the owner's message silently lost. Requeues owner-chat turns under a 5-attempt budget (drain re-runs them), else fails + routes a "resend" notice.
- **Stripe webhook atomic dedupe** (`webhooks/stripe.ts`): check-then-insert → `insertDedup` on the UNIQUE `stripe_event_id`; also `processed=false` when invoice context can't be resolved yet (replayable). 
- **Retention GC** (`cleanup.ts` + `cleanup_expired` lane): best-effort prune of long-past `preview_links`/`claim_tokens`/`delivery_decisions`/`inbound_events` (env-tunable) so the VPS doesn't grow unbounded.
- **access_count** increments made best-effort (dropped `mustWrite`) so a counter write can't fail the owner's read.

## Why
The product is nearing a real owner's phone; the review + sweeps found genuine defects (a dead primary CTA, wrong expired-link UX, a missing money figure) and, more seriously, cross-tenant data exposure and owner-message exposure via the Supabase Data API. All are the "must fix at MVP" class.

## Deferred (documented, not fixed now)
Employee-message MessageSid dedupe index; SSE cursor same-ms skew + unawaited progress writes; turn ping-pong-to-drain; secret-ref column select-policy tightening (blob is AES-GCM sealed); full atomic-counter RPC; Supabase leaked-password-protection (an Auth dashboard toggle, ops task); `amtech_account_ids()` authenticated-executable is intended (RLS helper).

## Files / seams touched
Shared: `preview-links.ts` (`WorkResource.open_url`), unchanged elsewhere. Manager libs: `signed-links.ts` (`decodeSignedToken`), `preview-links.ts`, `preview-render.ts`, `employee-events.ts`, `turn-drain.ts` (`reapStuckTurns`), `cleanup.ts` (new), `scheduler-runner.ts`, `owner-session.ts`, `gmail-tokens.ts`, `twilio.ts`. Routes/webhooks: `server.ts` (410 + best-effort counters + denyInternal), `webhooks/{stripe,twilio,gmail}.ts`. Migrations `0018`-`0021`. Tests: `preview-links`, `preview-resolve`, `event-bus`, `turn-drain`, `cleanup`, `twilio-status`, `stripe-webhook`, `_helpers/fake-supabase` (added `stripe_webhook_events`/`preview_links` uniques).

## Verification
`npm run typecheck` pass · `npm run test:unit` **59 files / 356 tests** pass (+10 this pass) · `npm run lint` pass · `npm run build` pass · `npm run ui:test` pass. Live DB: migrations `0018`-`0021` applied (env-sourced `node packages/db/migrate.mjs`); `get_advisors` → no `rls_disabled_in_public` ERRORs; `has_function_privilege` confirms anon can't execute the turn RPCs and service_role can; `db:status` confirms the runner still reads `_migrations` after RLS. Live employee tool-loop still blocked by the throwaway model bridge (unchanged from the 18:15 handoff). No faked proof.
