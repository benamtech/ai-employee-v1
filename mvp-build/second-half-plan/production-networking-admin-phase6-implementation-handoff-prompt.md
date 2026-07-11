# Production Networking, Test Environments, Admin Infra, and Phase 6 Handoff Prompt

Status: active handoff prompt

Date: 2026-07-11

Use this prompt to start an implementation session for the next production-infra run. This run should turn
the DNS/TLS/networking design and the new two-way-surface review into buildable, testable production
infrastructure, while keeping delegated roles as a deferred design unless explicitly re-scoped.

```text
You are Codex working in `/home/georgej/AMTECH/GTM-RESEARCH`.

Goal: implement the production networking / DNS-TLS / environment-verification / admin-infra slice that
follows from:

- `mvp-build/docs/inbound-two-way-surface-map.md`
- `mvp-build/docs/production-networking-and-dns.md`
- `mvp-build/docs/roles-and-delegated-permissions-design.md`
- `mvp-build/second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md`
- `mvp-build/second-half-plan/phase-06-free-trial-and-paid-pilot-readiness.md`

This is a full implementation run for the production-environment foundation, not another docs-only pass.
Add or update tests as needed. Carry the work through implementation, local proof, limited live-infra proof
where available, and a durable memory handoff.

Important scope line:

- Implement the Cloudflare/Caddy/DNS/TLS/test-environment/admin-readiness slice.
- Read the roles/delegated-permissions design now so the identity, approval, audit, and admin changes do not
  block it later.
- Do NOT implement account-member roles/delegation unless the user explicitly expands scope. Roles are still
  designed-now/build-last after live provider/runtime and limited real-VPS proof.

## Working rule: research first, then edit

Do not tunnel into the first obvious code path. Before changing files, produce a short research brief in your
working notes, then let it drive the implementation plan. The brief must include:

1. Repo research:
   - Read `CODEGRAPH.md`, `mvp-build/CODEGRAPH.md`, `mvp-build/CLAUDE.md`, `mvp-build/AGENTS.md`.
   - Read `mvp-build/memory/MEMORY.md`, then the newest relevant dated memories, especially:
     - `2026-07-11-1705-inbound-two-way-surface-production-dns-roles-docs-complete.md`
     - `2026-07-11-1900-pod-alpha-lifecycle-dns-routing-proven-on-host.md`
     - `2026-07-11-1142-production-runtime-p0-source-wired-and-capacity-notes.md`
     - `2026-07-11-0100-wiki-refresh-and-production-deploy-review.md`
   - Use `rg` to map existing infra/admin/proof seams before deciding on edits:
     - `infra/deploy`, `infra/caddy`, `infra/scripts`
     - `apps/manager/src/lib/caddy-activation.ts`
     - `apps/manager/src/lib/admin.ts`
     - `apps/web/app/admin`
     - `apps/manager/src/lib/runtime-health.ts`
     - `apps/manager/src/lib/channel-router.ts`
     - `apps/manager/src/webhooks`
     - `packages/shared/src/admin*` / admin contracts
     - existing tests under `tests/unit`, `tests/integration`, and `infra/scripts`
2. External research from primary or high-quality sources:
   - Caddy Automatic HTTPS, Caddyfile `tls`, and Caddy Cloudflare DNS plugin docs.
   - Cloudflare DNS records, wildcard records, TTL, API token scoping, and API behavior.
   - Let's Encrypt rate limits and ACME DNS-01 behavior. Prefer official docs/RFC 8555 over blogs.
   - Docker networking/IPv6 docs and Docker Compose production guidance.
   - SRE/DevOps reliability references: health checks, rollback, alerting, backup/restore, limited-production
     tests, failure-mode testing, and environment parity.
   - Security guidance for webhook ingress, secret handling, API tokens, least privilege, and multi-tenant
     container/network isolation (OWASP/NIST/vendor docs where relevant).
   - Testing research: test pyramid/contract tests/hermetic integration tests/production smoke tests/chaos or
     failure-injection methods where relevant.
3. A decision log:
   - For each meaningful design choice, cite the repo file(s) or external source(s) that justify it.
   - Prefer primary sources and local code over assumptions.
   - Call out uncertainty explicitly instead of silently choosing.

If web or provider research is unavailable, do not fake it. Record the missing research and implement only
the parts that can be grounded in local code and already-cited docs.

## Product / infra mental model

AMTECH packages Nous Research Hermes Agent into a small-business AI employee. Production is one fixed core
plus a dynamic fleet on one Docker network:

- Fixed core: `manager`, `web`, `caddy`, owned by docker-compose.
- Dynamic fleet: one Hermes employee container per customer, launched by Manager with `docker run`.
- Shared discovery plane: `amtech_runtime`, a host-owned user-defined Docker bridge. Caddy, Manager, Web,
  and every employee attach to it. Caddy routes public names to employee container aliases; Manager launches
  and retires employees as tenant data.

The inbound/two-way surface is already source-wired:

- Owner web turn -> Manager -> `owner-session.ts` -> `deliverOwnerTurnToRuntime` -> `turn-queue.ts` ->
  Hermes -> MCP tools -> `employee-stream.ts`.
- Owner inbound SMS goes directly from Twilio to `deliverOwnerTurnToRuntime`; it does not go through
  `events/ingress.ts`. `channel-router.ts` decides outbound delivery for employee/provider intents.
- Provider webhooks go through `events/ingress.ts` + adapters, then `deliverEmployeeEvent`.

Do not break those boundaries while adding production networking or tests.

## Implementation targets

Build the smallest complete slice that makes the production networking plan executable and observable.
Prefer narrow, composable scripts/config over a broad new platform layer.

### 1. Cloudflare/DNS desired-state tooling

Add a safe desired-state path for Pod Alpha DNS:

- Desired records:
  - apex `amtechai.com` A
  - `www` A/CNAME as chosen after research
  - `api` A
  - `agent` A
  - static wildcard `*.agents` A
  - optional AAAA records only behind an explicit opt-in and only when Docker/host dual-stack is verified
- Cloudflare mode:
  - DNS-only by default for `api` and `*.agents`
  - proxied mode must be opt-in and documented with SSE/webhook/TLS tradeoffs
- Behavior:
  - dry-run prints a diff and never mutates Cloudflare
  - apply requires explicit env/flag confirmation
  - tokens must be scoped to the single zone; never log token values
  - record ids and changes should be captured as proof JSON under `infra/proofs/`

Implementation shape is open. Likely candidates:

- `infra/scripts/cloudflare-dns.mjs` or similar
- package script aliases in `package.json`
- env inventory in `.env.example`
- docs/runbook update

### 2. Caddy wildcard DNS-01 production path

Make the Caddy wildcard DNS-01 path buildable/testable:

- Add a plugin-built Caddy image path using `caddy-dns/cloudflare` or another well-supported build method.
- Keep the stock/local Caddy path available for local tests that do not need DNS-01.
- Add production Caddy config or templating for `*.agents.amtechai.com` using DNS-01.
- Keep owner surfaces (`amtechai.com`, `www`, `api`, `agent`) on normal Caddy automatic HTTPS unless research
  shows a better low-risk path.
- Ensure `caddy_data` remains a named/backup-covered volume.
- Add validation scripts that run without real domains when possible (`caddy validate`, config render checks,
  container image/plugin presence checks).

### 3. Local mirror of production

The local environment must continue to mirror production topology even without real domains or a real LLM:

- Compose core + dynamic employee containers on `amtech_runtime`.
- Caddy can route by Host header / local hostnames / local Caddy config.
- No real public DNS required.
- No real LLM provider required; use existing local bridge/fake runtime paths where appropriate, but do not
  claim runtime/provider acceptance.
- DNS/TLS tooling can run in dry-run or mocked mode.
- Tests must distinguish:
  - static/unit proof,
  - local production-mirror proof,
  - limited live-infra proof,
  - full provider/runtime proof.

### 4. Limited live-infra proof mode

Support a limited production-style proof mode on this box even if there are no real domains and no real LLM:

- It may use real Cloudflare API credentials against the chosen zone, but apply must be explicitly gated.
- It may prove Cloudflare token scope, zone lookup, desired-record diff, and possibly DNS record create/update
  in a controlled way if the user allows it.
- It may prove the plugin-built Caddy image and config validation locally.
- It may prove compose/core/employee/Caddy routing on `amtech_runtime`.
- It must not claim public DNS propagation, Let's Encrypt issuance, provider webhook reachability, or real
  runtime/model acceptance unless those actually happened.

Add scripts and proof JSON fields so an operator can see exactly which tier ran.

### 5. Admin infra must understand production environments

The admin/operator surface was built before this more production-level environment existed. Update it so
operators can reason about and support the new infra, without overbuilding billing/polish.

Required admin implications to inspect and likely implement:

- Admin readiness should expose production-environment health:
  - core compose status if available or last proof status;
  - Caddy config/proof status;
  - Cloudflare desired-state/dry-run status;
  - DNS wildcard configured/applied status where proof exists;
  - Caddy wildcard DNS-01 config/image/token readiness;
  - `amtech_runtime` network status;
  - employee fleet count and routing readiness;
  - backup/restore/red-health/egress proof status.
- Admin diagnostics should distinguish local mirror vs limited live infra vs real production proof.
- Admin support actions should avoid destructive infra operations by default. Any Cloudflare apply, egress
  apply, or production deploy action must require explicit operator intent/audit.
- Admin copy should remain owner-safe where owner-facing; internal admin copy can be precise.
- Audit every operator-triggered infrastructure action.

Relevant seams:

- `apps/manager/src/lib/admin.ts`
- Manager `/manager/admin/*` routes in `apps/manager/src/server.ts`
- shared admin contracts
- `apps/web/app/admin/*`
- existing proof files under `infra/proofs/`

### 6. Phase 6 integration

Tie this into `phase-06-free-trial-and-paid-pilot-readiness.md`.

The Phase 6 release gate now needs an explicit production-environment section. Add or update docs/tests so
Phase 6 can answer:

- Is the fixed core healthy?
- Is the dynamic fleet routable?
- Are DNS/TLS desired state and proof status visible?
- Is Cloudflare configured safely?
- Can we run local production-mirror acceptance without public DNS?
- Can we run limited live-infra proof without LLM/provider credentials?
- Are backup/restore/red-health/egress proofs visible?
- Can admin diagnose and support the environment before a real trial owner is added?

Do not let this displace the existing Phase 6 product gates: SMS/web reachability, tool use, approval gates,
artifacts/previews, connectors, usage/cost, support, and paid conversion still matter.

## Tests to add or update

Use the repo's existing patterns. Add focused unit tests for deterministic logic; add script-level tests where
scripts are the behavior; add env-gated integration tests for live Cloudflare/Docker/prod-mirror proof.

Expected test coverage, adjusted to final implementation:

- Cloudflare desired-state planner:
  - computes apex/api/agent/wildcard records correctly;
  - keeps `*.agents` static and DNS-only by default;
  - omits AAAA unless dual-stack opt-in is set;
  - redacts token values;
  - dry-run produces a deterministic diff.
- Cloudflare API wrapper:
  - refuses apply without explicit confirmation;
  - handles missing zone/token cleanly;
  - records proof JSON with no secrets.
- Caddy config/image:
  - renders/validates wildcard DNS-01 config;
  - keeps local/stock Caddy config path working;
  - proves plugin image or build metadata when possible.
- Production-mirror scripts:
  - prove compose core + `amtech_runtime` + employee alias routing without real public DNS;
  - label proof tier correctly.
- Admin:
  - readiness model includes DNS/TLS/Caddy/Cloudflare/runtime-network/proof status;
  - admin UI renders the new fields without owner-facing leakage;
  - support/action audit covers any new infra action.
- Phase 6 docs/checks:
  - launch checklist includes production-environment gates;
  - local mirror and limited live-infra verification are separately named.

## Verification requirements for the plan itself

Before implementation, verify the plan is grounded:

- `git status -sb` and inspect any dirty/untracked files. Do not revert user/previous-agent work.
- Re-read all three docs from the two-way pass and the production roadmap.
- Produce the research brief described above.
- List the exact files/scripts/tests you intend to touch.
- Confirm the implementation order keeps roles deferred unless explicitly re-scoped.
- Confirm no step requires real domains, real provider webhooks, or a real LLM unless marked as optional/live.

## Verification requirements for the implementation

Run the strongest checks that fit the final scope. At minimum:

- `npm run typecheck`
- focused unit tests for new code
- relevant existing unit suites for admin/provisioning/runtime/caddy/proof changes
- `npm run lint`
- `npm run build`
- script syntax checks for any new `infra/scripts/*.mjs`
- `npm run local:check` if still relevant
- `npm run deploy:smoke` or the current production-mirror smoke command if Docker is available
- any new Cloudflare DNS script in dry-run mode
- any new Caddy image/config validation command

If Docker, Cloudflare credentials, root privileges, DNS, or model/provider credentials are unavailable, record
the exact blocker and leave the proof tier as pending. Do not overclaim.

## Proof artifacts

Any prod-mirror or limited-live script should emit proof JSON under `mvp-build/infra/proofs/` with:

- timestamp;
- proof kind;
- proof tier: `static`, `local_mirror`, `limited_live_infra`, `provider_runtime_live`;
- git commit/dirty status if available;
- environment name;
- core service status;
- network name/status;
- Caddy image/config status;
- Cloudflare zone/record diff status, with no secrets;
- DNS/TLS status and whether it is real or simulated;
- employee fleet/routing status if tested;
- admin readiness status if tested;
- pass/fail/skipped items with reasons.

## Handoff requirements

Write a dated memory handoff under `mvp-build/memory/` and update `mvp-build/memory/MEMORY.md`.

The handoff must include:

- the research brief summary and sources;
- what was implemented;
- what tests were added/changed;
- exact commands run and results;
- proof JSON paths and summary;
- remaining blockers by proof tier;
- Phase 6 checklist changes;
- admin infra changes and any operator workflow impacts;
- explicit status boundaries: source-wired vs local mirror proof vs limited live-infra proof vs provider/runtime proof.

Update `mvp-build/CODEGRAPH.md` if source layout/status changes materially. Update root `CODEGRAPH.md` only
if the workspace-level orientation changes materially.

Definition of done:

- Production DNS/TLS desired state is executable in dry-run and safe to apply only with explicit approval.
- Caddy wildcard DNS-01 path is buildable and locally validated.
- Local production-mirror proof remains usable without real domains or LLM provider credentials.
- Limited live-infra proof path exists for Cloudflare/Caddy/Docker where credentials/host allow.
- Admin/readiness surfaces reflect the production environment instead of only product/account state.
- Phase 6 release gate explicitly includes production-environment verification.
- Tests cover the new deterministic behavior and proof tiers.
- No live provider/runtime/DNS/cert claim is made without real proof.
```
