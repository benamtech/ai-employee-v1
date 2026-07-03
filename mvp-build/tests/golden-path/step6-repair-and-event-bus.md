# Golden path — Step 6: Repair & Event Bus (Phase 1 acceptance §7)

Source: `wiki/MVP/build-plan-current/03-provider-runtime-acceptance-plan.md` §7,
`wiki/MVP/old-build-plan/09-event-mesh-v1.md`, `10-security-ops-observability.md` "Repair Commands".
Human-in-the-loop: an operator drives the repair tools; manually injected provider results are not acceptance.

## Env required
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MANAGER_INTERNAL_TOKEN`, `MANAGER_BASE_URL`
- For replays: the Gmail/Stripe env from steps 3–4.

## Flow
1. **Replay Gmail history** — `node infra/scripts/repair.mjs replay-gmail-history --account <a> --employee <e> --arg connector_id=<c> --arg start_history_id=<h>`. The Manager re-runs `history.list` and re-normalizes any missed reply.
2. **Replay a Stripe event** — `node infra/scripts/repair.mjs replay-stripe-event --arg stripe_event_id=<evt>`.
3. **Suppress a noisy source** — `node infra/scripts/repair.mjs suppress-source --arg source=gmail --arg reason="loop"`.
4. **Redeliver an employee event** — `node infra/scripts/repair.mjs redeliver-event --arg event_id=<evt>`.
5. Confirm a literal event takes `deliver_only` (zero-token) and a judgment event flags `wake_employee`.
6. Verify: `node infra/scripts/acceptance/run7-repair-eventbus.mjs`.

## Pass criteria
- [ ] An `event_repair_queue` row exists from a replay/redeliver.
- [ ] An `event_source_suppressions` row exists.
- [ ] `inbound_events` shows provider events normalized through one lifecycle (safe facts, no raw payloads).
- [ ] Each operator repair action wrote an `audit_log` row (no raw secrets in `details`).
- [ ] (runtime-accepted, separate) A `wake_employee` event returns a validated runtime structured-event response — Phase 4 live wake path.

## Proof ids to capture
- Repair: `event_repair_queue.id`, replayed provider event id / history range
- Suppression: `event_source_suppressions.id`
- Redelivery: redelivered `event_id`
- Audit: `audit_log.id` per operator action
