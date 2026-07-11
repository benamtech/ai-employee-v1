# Next session: production runtime & deploy — close the tool loop, prove the stack

Date: 2026-07-11 16:55 EDT (machine clock read 13:55; stamped 16:55 to sort after the 16:50 handoff this continues)
Status: handoff/scope-decision note; no code changed this step. Underlying work is `source-wired`, live VPS/provider/runtime proof still `pending`.
Scope: copy-ready next-session prompt for the production runtime & deploy work started in the two prior 2026-07-11 handoffs, plus one scope decision (the local model bridge is dead).

## Scope decision (record it so the next agent doesn't rediscover the dead path)

**The local model bridge is dead.** We are not using it and will not fix or extend it. Ignore any
`model-bridge*` references in older handoffs/scripts (`infra/scripts/local/model-bridge*.mjs`,
`tests/unit/model-bridge.test.ts`, and the "Fixed the local model bridge" line in the 11:42 handoff).
The core tool loop must close on a **real provider-backed Hermes model**, not a local shim.

**Why:** the model bridge was a throwaway no-key stand-in (warm-Haiku via `claude -p`) to exercise the
loop without a funded key. It is inconsistent on multi-step tool chains and is not the production path;
keeping it as a "fix" target sends agents down a path we won't ship. **How to apply:** when closing the
tool loop, use a real Hermes model/provider; do not repair the bridge. Open follow-up (not yet done):
prune the dead `model-bridge*` files + `model-bridge.test.ts` and note the removal in CODEGRAPH/memory —
deferred, since it's a real edit, not just prompt wording.

## The prompt (paste into the next coding agent)

> You are the lead manager of AMTECH AI. **First, read and embody `identity.md`.** Then orient in read
> order: `mvp-build/CLAUDE.md` → `mvp-build/CODEGRAPH.md` §3 →
> `mvp-build/second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md` → the two newest
> memory handoffs (`memory/2026-07-11-1650-pod-alpha-runtime-proof-handoff.md`,
> `memory/2026-07-11-1142-production-runtime-p0-source-wired-and-capacity-notes.md`). Work inside
> `mvp-build/` (local git tracked in root `GTM-RESEARCH`, branch `main`, remote `origin`; branch before
> feature work, don't push/commit without an ask).
>
> **Where we are.** The product surfaces are far ahead of the **operational** layer. Founder decision
> (locked): **fix deployability + core tool-loop reliability before any more admin/billing polish**
> (Phase 5 is source-wired and sufficient). Orchestration target = **docker-compose** core
> (Manager/Web/Caddy on a shared `amtech_runtime` Docker network) + per-account Hermes employee
> containers routed by Docker DNS alias (`amtech-hermes-<employee_id>`); employee→Manager via
> `http://manager:8080`.
>
> **Scope note — the local model bridge is dead.** Ignore any `model-bridge*` references in the older
> handoffs/scripts; we are not using it and will not fix or extend it. The tool loop closes on a **real
> provider-backed Hermes model**, not a local shim.
>
> **Done in the two prior sessions (`source-wired`, local proof only — no live VPS/provider acceptance):**
> - P0 deploy scaffolding: `infra/deploy/` (compose, Dockerfiles, `.env.production.example`), env-driven
>   `infra/caddy/Caddyfile`, Caddy write→validate→reload→smoke→**rollback** seam (`lib/caddy-activation.ts`),
>   pinned/hardened employee launcher (`infra/scripts/local/start-hermes-container.sh`,
>   `HERMES_VERSION=0.18.0`), per-employee lifecycle (`lib/employee-lifecycle.ts`).
> - Pod Alpha operator proof scripts: `deploy:smoke`, `ops:caddy-proof`, `ops:reprovision-scoped-mcp`,
>   `capacity:pod-alpha`, `ops:backup`/`ops:restore`, `ops:red-health`, `ops:egress-policy` +
>   `docs/pod-alpha-runtime-runbook.md`. These write `infra/proofs/*.json`.
> - Fixes: profile-renderer clears the generated dir before re-copy (no stale files survive rerenders);
>   turn-claim RPC ambiguity migrations `0027`/`0028` (+ `0024` re-qualified) so queued owner turns claim
>   on the local proof DB.
> - Scoped-MCP only: `MANAGER_INTERNAL_TOKEN` is gone from rendered employee configs — never reintroduce it.
>
> **Proof captured locally:** `ops:caddy-proof` PASSED (real Caddy container: valid snippet, invalid-snippet
> reject, rollback, old-route liveness). `ops:reprovision-scoped-mcp -- emp_vhz8kw3bhvh67zu292ukgl` PASSED
> (real credential id, profile confirmed free of `MANAGER_INTERNAL_TOKEN`). `db:migrate` through `0028`
> applied to local proof DB. Proof JSONs are in `infra/proofs/`.
>
> **The one real blocker.** `npm run local:tool-loop-proof` still FAILS. The queue now drains and the
> RPC ambiguity is fixed, but the worker path **times out on prompt size / the runtime loop** before
> producing the required proof rows (employee **tool audit + artifact + approval**). This is the true
> blocker behind every `pending` gate — until a real Hermes tool loop produces those rows against a real
> model, nothing upgrades past `source-wired`. Three failed `tool-loop-proof-*.json` are in `infra/proofs/`.
>
> **Your task, in order:**
> 1. **Get the tool loop green against a real provider-backed Hermes model.** Inspect the failed
>    `infra/proofs/tool-loop-proof-*.json` and Hermes/Manager MCP transport logs; trim the worker
>    prompt/loop as needed. Pass = concrete local ids for tool audit, artifact, and approval rows.
>    (Not via the model bridge — it's out of scope.)
> 2. **Prove the compose stack starts:**
>    `docker compose -f infra/deploy/docker-compose.yml --env-file infra/deploy/.env.production up -d --build`
>    on a VPS-like host; fix Dockerfile/Next-standalone path issues; prove core services healthcheck.
>    Don't claim runtime acceptance — just startup + health.
> 3. **Run the Pod Alpha proof scripts on the real VPS**, capture `infra/proofs/*.json` with concrete
>    ids/host evidence, before upgrading any status.
> 4. Then close the capacity benchmark (`capacity:pod-alpha`) and the egress default-deny design.
>
> **Non-negotiables:**
> - **Realness Rules.** `source-wired` / `provider-accepted` / `runtime-accepted` / `planned` / `pending`.
>   Never upgrade without real proof ids (Twilio SID, Gmail/Stripe/PubSub/Supabase/Hermes job ids). Mocks
>   only in `tests/unit/`.
> - **Baseline checks before + after:** `npm run typecheck && npm run test:unit && npm run build && npm run lint`
>   (integration is env-gated, skips clean). Known pre-existing failure: `tests/unit/gmail-pubsub.test.ts`
>   5s timeout blocks a clean *full* unit run — run focused suites to prove your changes.
> - Employee config scoped-token only; secrets by reference only; approval gates before money/customer-facing sends.
> - **Capacity is a hypothesis, not fact:** one employee per business for this ICP (<$10M); no
>   swarm/suspend-to-zero work; ~20-25 resident employees per 64GB node as a *number to benchmark*, not a promise.
> - **Open risks to keep in view:** Manager mounts `/var/run/docker.sock` (high blast radius — consider a
>   narrow provisioner/Docker-proxy later); egress default-deny still owed before paid pilots;
>   backups/DR/observability still P1/P2.
> - No emojis anywhere. Update `mvp-build/CODEGRAPH.md` §3 + write a dated `memory/` handoff after
>   substantial or architectural work.
>
> Work from the goal: a real Hermes tool loop producing real proof rows on a real box. Errors are
> steering, not verdicts. Do it now.

## Files / seams touched (context, from prior sessions)

- `infra/deploy/` (compose, Dockerfiles, `.env.production.example`), `infra/caddy/Caddyfile`
- `apps/manager/src/lib/{caddy-activation,employee-lifecycle,profile-renderer}.ts`
- `infra/scripts/local/start-hermes-container.sh`, `infra/scripts/{deploy-smoke,caddy-proof,reprovision-scoped-mcp,capacity-pod-alpha,backup-restore,red-health,egress-policy}.mjs`
- `infra/scripts/local/tool-loop-proof.mjs` (the failing proof), `infra/proofs/*.json`
- `packages/db/migrations/{0024,0027,0028}_*.sql`
- Dead/out-of-scope: `infra/scripts/local/model-bridge*.mjs`, `tests/unit/model-bridge.test.ts`

## Carry-forward / next

- Priority 1 is the tool loop on a real model; everything else (compose startup, VPS proof scripts,
  capacity, egress) follows. See the ordered task list above.
- Prune the dead model-bridge files when convenient and record the removal.
- Live migrations `0022`-`0028` still need applying live where env/approval allows; platform operator
  seeding, scoped-MCP reprovision proof on a real box, QBO sandbox proof, and egress control all remain
  `pending`.

## Verification

- No code changed this step. State reflects the two prior 2026-07-11 handoffs (11:42, 16:50) and
  `infra/proofs/` (caddy-proof + reprovision-scoped-mcp PASSED; tool-loop-proof FAILED x3).
