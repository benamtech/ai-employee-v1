# 2026-07-04 14:55 — NEXT SESSION prompt: full local end-to-end test on the sibling-Docker stack

Status: handoff prompt (paste into the next Claude Code session started in `mvp-build/`).

---

## Prompt

You are in `mvp-build/`. Phase 5 (triage/batching, live Work Surface stream, MCP-UI generative UI) just
shipped and is `source-wired`; local gates are green (typecheck, 254 unit tests, build, lint) and the
Supabase side is proven live (migration `0016` + `event_batches` RLS, 4/4). **The one remaining Phase 5
gate is real Hermes runtime proof.** This session: stand up the whole thing **locally** on our
VPS-faithful no-SMS stack (live Supabase + local Manager/Web + Caddy + one **sibling** Dockerized Hermes
container per employee) and drive it **end to end** — onboarding → provisioning → interacting with the
agent via the browser and the exposed API — using the infra scripts and Claude Code. Capture real proof.

Read first: `infra/local/RUNBOOK.md`, `../wiki/MVP/implementation-records/2026-07-04-phase-05-record.md`,
and the newest `memory/` handoff. Follow the Realness Rules — a capability is only accepted with real
provider/runtime proof ids; no mocks outside `tests/unit/`.

### Prerequisites (host shell where `id -nG` includes `docker`)
The previous session was blocked by a **stale docker group** in its shell — fix that first (new login
shell / `newgrp docker`) or nothing containerized will run.
```
cd mvp-build
cp .env.local.example .env      # then paste the REAL SUPABASE_SERVICE_ROLE_KEY + DATABASE_URL (pooler URI)
set -a && source .env && set +a
npm run local:check             # env + docker + tool preflight
npm run local:build-hermes      # builds the hermes-agent image
npm run local:browser-install   # Playwright chromium for the browser acceptance step
```
(Values live in `.env`, which is gitignored — the committed `.env.local.example` is placeholders only.)

### Bring it up (separate shells, each with `set -a && source .env && set +a`)
```
npm run db:migrate && npm run db:status     # 0001–0016 applied
npm run manager:dev                         # Manager control plane :8080
npm run web:dev                             # Next.js front door + Work Surface :3000
caddy run --config infra/caddy/local.Caddyfile   # optional proxy parity
```

### Drive the full flow
```
npm run local:bootstrap     # provisions an account+employee, starts amtech-hermes-<id> sibling
                            # container, writes infra/.local/state.json (account/employee/session/route)
npm run local:chat -- "Can you help price a small interior repaint?"
```
Then the **Phase 5 surfaces** specifically:
1. **Live stream** — open the Work Surface at the route in `state.json` (`/agent/<employeeId>`, owner
   session cookie). Confirm the SSE stream (`/api/employee/<id>/events`) delivers the initial `snapshot`
   then `work_event`/`work_progress`/`approval_update` frames — not a one-shot poll. Watch the live
   "doing it now" verb line appear during a wake.
2. **MCP-UI** — drive a provider/manager event that produces a deliverable with a `view` (table/schedule/
   diff/form) and confirm the sandboxed `ui://` iframe renders and its Approve/Not-now/Send `postMessage`
   intents resolve through the approval gate (`audit_log` row written).
3. **Batching digest** — fire a burst of same-source events, then `npm run scheduler:tick` (or the
   `flush_event_batches` lane) and confirm the burst collapses into one `manager.digest` on the surface.
4. **CAPTURE THE HERMES PROOF (the open gate)** — from a real wake, capture the Hermes API Server
   `/health`, `/v1/capabilities`, and a `/v1/runs/{id}/events` **SSE** transcript. Record the exact event
   JSON field names so `hermes-client.ts` `streamRun` / `parseSseFrames` can stop being defensive and be
   pinned. Also try the exposed API directly (owner session → Manager routes) and browser-use.

### Acceptance harness (run alongside)
```
npm run local:acceptance          # full: env → services → runtime → chat → browser
# or step-wise: local:acceptance:env | :services | :runtime | :chat | :browser
```

### Definition of done for this session
- The onboarding→provision→chat→Work-Surface loop runs locally against live Supabase + a real sibling
  Hermes container, driven from scripts + browser + API.
- Real Hermes `/v1/runs/{id}/events` SSE proof captured → flip Phase 5 (and the Phase 3/4 runtime gates)
  toward `runtime-accepted`; pin the SSE field names in `hermes-client.ts`.
- Update `wiki/MVP/implementation-records/2026-07-04-phase-05-record.md` with the captured proof ids and
  write a dated `memory/` handoff. Do **not** claim runtime-accepted without the real proof ids.

Guardrails: `PROVISIONER_SKIP_SMS=1` skips only Twilio; it fails closed in production. Secrets by
reference — never print `.env` values or paste tokens into logs/models. Commit only when asked; branch
off `main`, don't push without an explicit ask.
