# Golden path — Step 7: Security forged-request denial (Phase 1 acceptance §8)

Source: `wiki/MVP/build-plan-current/03-provider-runtime-acceptance-plan.md` §8,
`wiki/MVP/old-build-plan/10-security-ops-observability.md` "Acceptance".
Two layers: a deterministic offline boundary proof, and live forged requests against the deployed Manager.

## Layer 1 — deterministic (no creds, always run)
- `npm run test:unit` → `tests/unit/forged-requests.test.ts`: forged/missing Twilio + Stripe signatures are
  rejected at the HTTP boundary; signature verifiers discriminate valid vs tampered; signed tokens reject
  tamper/wrong-purpose. This proves the boundary logic offline.

## Layer 2 — live probe (deployed Manager)
Env: `MANAGER_BASE_URL` reachable; the server has `TWILIO_AUTH_TOKEN` + `STRIPE_WEBHOOK_SECRET` configured.
- `node infra/scripts/acceptance/run8-security.mjs` sends genuinely forged requests and asserts denial.

## Manual matrix (doc 03 §8) — confirm each is DENIED
- [ ] Invalid Twilio signature → 403.
- [ ] Invalid Stripe signature → 4xx (never 200).
- [ ] Invalid Pub/Sub / OIDC authorization → rejected (`PUBSUB_REQUIRE_AUTH=true`).
- [ ] Invalid owner session → 401.
- [ ] Invalid signed artifact token → 403.
- [ ] Cross-account owner access attempt → denied (RLS; `tests/integration/security-live.test.ts` + `rls-cross-account.test.ts`).

## No-secret-logging check
- [ ] Under the above traffic, logs and `audit_log.details` contain **no** raw tokens, signatures, email bodies,
  webhook bodies, or secret values — only ids and safe summaries.

## Proof ids to capture
- HTTP status per forged request (403/4xx), the run8 report line, and the passing `forged-requests` unit run.
