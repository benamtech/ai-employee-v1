# Wiki refresh + production deploy readiness review + re-sequencing

Date: 2026-07-11 ~01:00 EDT
Status: docs-only; no code changed; no live gates upgraded
Scope: brought the GTM wiki current with shipped capabilities, wrote a production-deploy readiness
review, and made a founder-level re-sequencing decision (deployability + core loop before admin/billing).

## Why this session happened

Two founder asks: (1) get the wiki completely up to date with the real product vision and capabilities;
(2) as exec/architect, decide the best next steps — with a strong prior that **production deploy
infrastructure has never had a real review** and that it matters more than the admin panel or billing
right now. Live provider creds are ~days out, so the near-term window is for work that needs no creds.
Constraint: no sub-agents.

## What I found

### Wiki was stale on capabilities (not vision-wrong, capability-blind)
Grep of `wiki/`: `Connector Center` 0 files, `resurfac*` 0, `capability graph` 0, `admin console` 0;
QuickBooks in only 5 files. `product-ai-employee-context.md` still called the product "a thin factory…
almost no custom code" and shipped `terminal.backend: local` as the first-pilot default. The wiki also
**underframed Hermes itself** — it read estimate-centric and did not convey that Hermes OOTB is a very
capable self-improving agent (terminal/file/web/browser/vision/image/tts/MCP tools, skill self-creation,
durable memory + session search, Runs/Sessions/Jobs/cron, subagent delegation, multi-provider).

### Production deploy infra is essentially unbuilt (evidence-backed)
- `apps/manager/src/lib/runtime-backend.ts:19-23` says verbatim there is "no Dockerfile/systemd/pm2
  config in this repo."
- No `start:prod`/supervision anywhere; every `package.json` run script is `local:*`/`live:*` dev/test.
  Caddy assumes `localhost:3000`/`:8080` are simply up.
- Employee launch = undefined env string `HERMES_RUNTIME_COMMAND` (`profile-renderer.ts:210`);
  `HERMES_VERSION = <fill at install>` never pinned (`infra/hermes/RUNBOOK.md`).
- `writeCaddySnippet` (`profile-renderer.ts:214`) writes `clients/<id>.caddy` but **nothing runs
  `caddy reload`** anywhere — a provisioned employee subdomain never routes until a manual reload.
- `repair.mjs:71` points at a `hermes@<id>` systemd unit that does not exist in the repo.
- No CI/deploy, no per-employee lifecycle/reboot recovery/GC, no backup/DR for on-VPS Hermes profiles +
  workspaces (Supabase is managed; the filesystem state is not), no observability/alerting, egress open.

## What I changed (docs only)

New docs:
- `docs/production-deploy-readiness-review-2026-07-11.md` — 10 gaps, severity-tagged (P0/P1/P2), each
  with evidence + "done" criteria, framed for the one-VPS factory.
- `second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md` — the re-sequencing decision:
  **P0 production deploy foundation** (docker-compose core services; a pinned, concrete employee
  `docker run`; wire `caddy reload`; per-employee lifecycle + reboot recovery; deploy path) → **P1 core
  loop working** (model bridge must emit real tool-calls, not JSON-as-text; reprovision old profiles onto
  scoped MCP creds) → **P2 backup/observability/egress** → **PARK admin polish + billing** → then Phase 1
  live gate (creds) → Phase 6 launch. Orchestration chosen: **docker-compose** for core, per-account
  Docker containers for employees (one container model everywhere; employees are dynamic data, not compose
  services).

Wiki (living-brain rewrite, no archiving):
- `wiki/MVP/second-half-current-and-future-state.md` — rewritten to current state: Phases 2–5 (second-half
  plan) are `source-wired`, not "future"; added Connector Center, resurfacing, QBO accounting, admin,
  MCP-UI; added a Production Readiness Gap section pointing at the two new docs; Phase Map + Next Move now
  say deploy-foundation-and-core-loop-first, admin/billing parked.
- `wiki/product-ai-employee-context.md` — replaced "almost no custom code / thin factory" with the real
  Manager-control-plane framing; fixed the `local`-default security line to the current docker-required
  policy; added a QuickBooks/accounting rung to the connector ladder; **added a new section "What Hermes
  already does out of the box (the real product ceiling)"** — estimate is the wedge, not the ceiling.
- `wiki/product-agent-platform-architecture.md` — materialization is now `source-wired` (was "future");
  named operability/deploy as the current risk.
- `wiki/README.md` — headline now names the **second-half plan as the current forward plan**, second-half
  index line updated, and added a **"phases are plan-specific" caveat** (second-half 0–6 vs build-plan-
  current 0–13 vs event-spine 3/3A/4 are not one sequence — a founder note this session).
- `CODEGRAPH.md` (root) — "production docs" clause now references the review + roadmap.

UI-handoff catch-up (Connector Center + resurfacing, requested earlier):
- `ui-handoff/data-catalog.md` — added `connection_surfaces`/`resurface_items` to the ResourcePayload
  table + a new §4.5 documenting both shapes and how the web surface consumes them.
- `ui-handoff/current-ui-map.md`, `experiments-and-future-surfaces.md`, `README.md` — noted the generic
  Connected cards + resurfacing attention; flagged signed-preview-for-resurface-items as the next slice.

## Verification

- Docs-only; no source changed. Confirmed the tree is green independently at session start:
  `typecheck` + **76 unit files / 488 tests** + `lint` + `build` all pass.
- Every deploy-gap claim cites a real file/line; no faked acceptance, no invented infra.

## Carry-forward / next (the approved follow-up)

Implement P0 from the roadmap (the founder chose "review + roadmap first," so the code is the next pass):
1. **Caddy reload wiring** in the provisioner after `writeCaddySnippet` (smallest, highest-leverage —
   a provisioned employee currently doesn't route). Validated reload + rollback on failure.
2. **docker-compose** for Caddy/Web/Manager (restart policy, healthchecks, start-order, log rotation) and a
   concrete, version-pinned employee `docker run` behind `HERMES_RUNTIME_COMMAND`.
3. **Per-employee lifecycle + reboot recovery + GC**; retire the phantom `hermes@<id>` hint in
   `repair.mjs`.
4. **Deploy path** (build → ship → migrate → restart → smoke + rollback).
5. Then **P1 core loop**: fix the model bridge to emit real tool-calls and reprovision old profiles onto
   scoped MCP creds so the tool-execution loop is deterministically verifiable before creds land.

Admin panel + billing stay parked. Do not upgrade any live gate without real provider/runtime proof ids.
Related: [[2026-07-10-2341-tool-agnostic-connector-center-resurfacing]],
[[2026-07-10-2232-deep-review-phase5-loose-ends-phase6-groundwork]].

## Continuation (2026-07-11, same session)

Founder re-asked for the wiki refresh + next-steps; I verified the earlier pass against the **live** git
status (not the stale session-start snapshot) — every file this note claims to have edited is in fact
`M` on disk (`CODEGRAPH.md`, `wiki/README.md`, `wiki/product-{ai-employee-context,agent-platform-architecture}.md`,
`wiki/MVP/second-half-current-and-future-state.md`, the four `ui-handoff/*`), and the two new docs exist.
The note is accurate, not aspirational.

Closed the one remaining wiki contradiction the first pass missed: `wiki/MVP/build-plan-current/README.md`
and `.../phases/README.md` still billed their Phases 1-13 as "THE forward roadmap / start here for next
build work" with no pointer to the second-half plan or the re-sequencing. Rewrote that framing (living-brain,
not banner): both now name the second-half plan as the **active** sequence, cite the production roadmap,
state that admin ops (9-10)/billing (11)/further metering (7-8,12) are **parked**, and demote the 1-13 set to
"module map + dependency graph + 1000-user horizon." Also corrected the phases index (Phase 5 planned→source-wired)
and the stale blanket "everything 1-13 is planned/pending" line (2,3,3A,4,5,6 are source-wired per
`mvp-build/CODEGRAPH.md` §3). New relative links verified to resolve; no code touched; tree still green
(typecheck + 76 files/488 unit + lint + build, exit 0).

Net: the wiki is now coherent end-to-end on product vision, shipped capabilities, and forward sequence.
The "best next steps" answer for the founder **is** the production-runtime-and-deploy roadmap (P0 deploy
foundation → P1 core loop → P2 durability/observability/egress; admin+billing parked; live gate on creds).
