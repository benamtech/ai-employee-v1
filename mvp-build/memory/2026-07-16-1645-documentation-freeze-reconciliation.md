# 2026-07-16 16:45 — Documentation Freeze & Reconciliation

**Decision:** Reduce the entire forward plan to a single unambiguous remaining workstream: (1) live production deploy with real API credentials and (2) billing, with admin live testing as the immediate validation gate.

## Actions Taken

- Marked `wiki/MVP/build-plan-current/README.md` and `wiki/MVP/old-build-plan/README.md` as **superseded** with clear banners pointing to `mvp-build/second-half-plan/`.
- Updated both root `CODEGRAPH.md` and `mvp-build/CODEGRAPH.md`:
  - Declared `mvp-build/second-half-plan/` as the **only active forward plan**.
  - Explicit rule added: “All phases except billing and admin live testing are considered complete/source-wired.”
  - Provider/runtime acceptance redefined as “real creds on the production Docker stack (Cloudflare + Caddy + manager/web + Hermes fleet).”
- Added new top-level section **“Remaining Work – Billing + Admin Live Validation”** to `mvp-build/second-half-plan/README.md`.
- Updated `mvp-build/memory/MEMORY.md` index with this handoff as the newest entry.

## New Canonical State

- **Active plan:** `mvp-build/second-half-plan/` only.
- **Billing** is the sole remaining feature implementation.
- **Admin Portal Live Testing** is the immediate validation step against real production credentials.
- Everything else (runtime, orchestration, context-engineering CE-1–CE-4, materialization, SMS previews, Connector Center, QBO, etc.) is declared complete/source-wired.

## Security Note for xAI/Grok-4.3 Usage

When operating with live `xai_api_key` + `grok-4.3`:
- Never commit the key.
- Use the production `.env.production` overlay pattern only.
- Prefer scoped per-employee credentials over shared keys.
- Monitor spend limits aggressively (currently ~$5 available).
- All provider calls must go through the existing orchestrator-model adapter with structured-output fallbacks.

## Next Immediate Steps (per reconciled plan)

1. Execute `docs/production-normal-employee-live-deploy-runbook.md` end-to-end with real creds.
2. Produce the five required live proof IDs.
3. Run full admin portal test matrix against the live employee.
4. Implement billing.

This handoff supersedes all prior phase-oriented planning documents.