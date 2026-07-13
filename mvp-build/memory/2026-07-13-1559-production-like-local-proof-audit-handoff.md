# 2026-07-13 15:59 - Production-Like Local Proof Audit Handoff

Worktree: `/home/georgej/AMTECH/GTM-RESEARCH/.claude/worktrees/ce2-ce3-production`

Primary deliverable created:

- `mvp-build/docs/production-like-local-proof-audit-2026-07-13.md`

No code changes were made. This pass produced a comprehensive audit document for six production-like proof issues and incorporated the corrected requirement that the Anthropic key is AMTECH-side but still required by both Manager orchestration and Hermes employee runtimes.

Key conclusions:

1. The Anthropic key finding was reframed. Hermes needs a runtime provider key, so the issue is not "employee should never see a key." The issue is that the repo mixes language around employee-owned keys, Manager secret refs, and direct `ANTHROPIC_API_KEY` profile env rendering. The fix is to document and test an AMTECH-owned runtime/provider key contract.
2. Manager Docker socket access is probably intentional for this application. Manager is acting as a host orchestrator for resident Hermes employee containers. The issue is blast-radius clarity and guardrails, not an automatic mandate to remove Docker access before Pod Alpha.
3. Consequential Supabase writes still bypass `mustWrite` in provisioning and multiple tools. The project already has the right helper and comments; implementation discipline has drifted.
4. The Work Surface SSE proxy forwards the owner session token to Manager in a query string. Browser `EventSource` constraints explain why this happened, but the Next server proxy can avoid URL-token transport.
5. Local proof tooling is split between live provider assumptions and stale bridge/UI assumptions. `status.sh` does not load `.env`; the old browser acceptance script waits for removed UI text; the new headed proof runner is better but does not yet capture run/artifact IDs.
6. Deploy docs reference `infra/deploy/.env.production.example`, but that file does not exist. This blocks a clean reproduction path for another operator.

External research used:

- Docker official docs on daemon/socket access and rootless mode.
- Supabase JavaScript docs confirming `{ data, error }` response handling.
- WHATWG/MDN EventSource docs confirming the browser API is URL-based with only `withCredentials`, no arbitrary headers.
- Nous Research Hermes agent docs/source confirming Hermes uses config plus `.env` provider credentials under `$HERMES_HOME`.

Verification run:

- Targeted unit suite: 7 files, 60 tests passed.
- `npm run typecheck`: passed across workspaces.

Suggested next implementation order:

1. Clean up provider-key comments/templates/docs and add redacted runtime key presence proof.
2. Fix `live:status` to load `.env`; update/deprecate stale browser acceptance; promote the new Work Surface proof runner and capture `turn_job_id`, `run_id`, and artifact IDs.
3. Convert provisioning consequential writes to `mustWrite` and add failure regression tests.
4. Replace SSE query-token forwarding with internal header or short-lived stream ticket.
5. Add `infra/deploy/.env.production.example` and a redacted env preflight.
6. Document Manager as the trusted host orchestrator now; evaluate rootless Docker or a constrained host-side supervisor after Pod Alpha unless threat-model review makes it launch-blocking.

