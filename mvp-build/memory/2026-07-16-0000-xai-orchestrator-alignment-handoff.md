# xAI orchestrator alignment + estimator handoff

Date: 2026-07-16 00:00 ET
Status: source-wired config/doc update; no runtime/provider status changed
Scope: Align the front-door orchestrator with the xAI/Grok env shape already used in production env, and preserve the estimator handoff context for the next session.

## What changed

- `apps/manager/src/lib/orchestrator-model.ts` now treats lowercase `xai_api_key` and `xai_model` as first-class env aliases, not just the uppercase variants.
- The orchestrator base URL now defaults to `https://api.x.ai/v1` when xAI env is present and no explicit `ORCHESTRATOR_API_BASE_URL` is set.
- `.env.example`, `.env.local.example`, and `README.md` were updated so the repo docs reflect the xAI/Grok default instead of leaving the front-door orchestrator visually anchored to OpenAI.
- The existing estimator handoff remains token-efficient: one no-message smoke first, then one concise xAI-backed turn against the already-provisioned estimator employee.

## Why

- The production env already carries xAI as the effective provider shape (`xai_api_key`, `xai_model`).
- The next session should not have to translate between uppercase doc examples and lowercase production env keys by hand.
- Keeping the orchestrator aligned with the same provider/model family used elsewhere reduces avoidable config drift before the next estimator proof.

## Current status

- `source-wired` for config/documentation alignment only.
- `provider-accepted` remains pending until a real xAI-backed turn is captured.
- The public estimator and Cloudflare tunnel work remains documented separately in the 2026-07-15 estimator memories.

## Files touched

- [orchestrator-model.ts](/home/georgej/AMTECH/GTM-RESEARCH/mvp-build/apps/manager/src/lib/orchestrator-model.ts)
- [.env.example](/home/georgej/AMTECH/GTM-RESEARCH/mvp-build/.env.example)
- [.env.local.example](/home/georgej/AMTECH/GTM-RESEARCH/mvp-build/.env.local.example)
- [README.md](/home/georgej/AMTECH/GTM-RESEARCH/mvp-build/README.md)

## Carry-forward

- Keep the xAI credit budget tight: no exploratory provider calls.
- Start the next session with the no-message public-estimator smoke.
- Then run exactly one concise message turn for the existing estimator employee.
- Defer QuickBooks public-IP / allowlist work until the live-test path demands it.

## Verification

- No runtime command was run for this edit.
- The change is purely config/doc surface plus the orchestrator resolver fallback.

## Next-session prompt

Use this as the first message for the next session:

> Read [2026-07-16-0000-xai-orchestrator-alignment-handoff.md](/home/georgej/AMTECH/GTM-RESEARCH/mvp-build/memory/2026-07-16-0000-xai-orchestrator-alignment-handoff.md), then continue the estimator bring-up with the xAI/Grok prod env shape. Keep `agent.amtechai.com` on the tunnel path, leave QuickBooks IP allowlisting for later, and spend at most one concise xAI turn after the no-message smoke.
