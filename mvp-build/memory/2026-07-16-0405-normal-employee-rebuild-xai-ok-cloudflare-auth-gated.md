# Normal employee rebuild + xAI ok + Cloudflare auth gated

Date: 2026-07-16 04:05 EDT
Status: public ingress `proven`; onboarding/live employee proof `pending`
Scope: Production-like normal employee deploy continuation after xAI/Grok correction

## What changed

- Re-ran the xAI/Grok diagnostic before rebuilding:
  - `GET https://api.x.ai/v1/models` returned `200`.
  - Configured model `grok-4.3` was listed.
  - Tiny `chat/completions` calls succeeded with strict `json_schema`, `json_object`, and omitted `response_format`.
- Rebuilt and restarted the production-like normal employee core with:
  - `npm run prod-like:normal:down -- --employees`
  - `npm run prod-like:normal:up -- --down-first --require-tunnel`
- The stack rebuilt successfully and started:
  - `amtech-ai-employee-manager-1` healthy on `127.0.0.1:8080`.
  - `amtech-ai-employee-web-1` healthy on `127.0.0.1:3000`.
  - `amtech-ai-employee-caddy-1` healthy on host `:80/:443`.
- Caddy origin route works:
  - `curl -I http://127.0.0.1/create-ai-employee -H 'Host: agent.amtechai.com'` returned `HTTP/1.1 200 OK` with `Via: 1.1 Caddy`.
- Moved the downloaded Cloudflare origin cert into gitignored local credentials:
  - `infra/.local/cloudflared/cert.pem`
  - permissions: `0600`
- Used the cert to derive a token for named tunnel `amtech-tunnel` without printing the token, then started the connector:
  - container: `amtech-tunnel`
  - tunnel id from logs: `496ceef3-e2a8-49f5-9af3-c3b155534627`
  - connector id from logs: `8240e43f-9700-47e9-b340-0edc9709e053`
- Public ingress now works:
  - `curl -I -L --max-time 30 https://agent.amtechai.com/create-ai-employee` returned `HTTP/2 200`
  - headers included `server: cloudflare` and `via: 1.1 Caddy`.
- Added and rebuilt onboarding LLM-security hardening after the founder caught the account-detail boundary:
  - `apps/manager/src/orchestrator.ts` now strips contact/account/auth-like keys from `current_manifest` before model calls.
  - It redacts email and phone/code-like patterns from transcript and new owner message text before model calls.
  - Focused tests in `tests/unit/orchestrator-readiness.test.ts` cover both manifest field stripping and transcript text redaction.
  - Rebuilt the production-like stack from source after this patch; do not use the earlier pre-patch image.

## Why

The prior handoff called xAI provider-gated, but the founder clarified that credits remain and `grok-4.3` is available. The redacted probe proved the xAI key/model/response-format path is currently usable. The remaining infrastructure blocker was not xAI and not Manager/Web/Caddy; it was starting the named Cloudflare Tunnel connector for `amtech-tunnel`. That connector is now running and public ingress is proven.

## Current status

- Focused validation passed:
  - `npm run typecheck --workspace @amtech/manager`
  - `npm run test:unit -- tests/unit/orchestrator-model.test.ts tests/unit/orchestrator-readiness.test.ts tests/unit/onboarding-compile.test.ts`
  - Result: 3 files / 14 tests passed.
- Later validation after streaming/account/privacy fixes passed:
  - `npm run typecheck --workspace @amtech/manager`
  - `npm run typecheck --workspace @amtech/web`
  - `npm run test:unit -- tests/unit/create-account-error.test.ts tests/unit/orchestrator-model.test.ts tests/unit/orchestrator-readiness.test.ts tests/unit/onboarding-compile.test.ts tests/unit/phone-verify-dev-bypass.test.ts`
  - Result: 5 files / 23 tests passed.
- Latest proof JSONs:
  - `infra/proofs/prod-like-normal-down-2026-07-16T07-52-42-399Z.json`
  - `infra/proofs/prod-like-normal-up-2026-07-16T08-00-43-415Z.json`
  - `infra/proofs/prod-like-normal-up-2026-07-16T09-25-29-856Z.json`
- Public `https://agent.amtechai.com/create-ai-employee` currently returns `HTTP/2 200` through Cloudflare and Caddy.
- No normal employee has been created in this continuation. No Twilio Verify SID, `account_id`, `employee_id`, or `amtech-hermes-*` runtime exists for this run yet.
- The founder will restart onboarding from the beginning on the rebuilt public URL.

## 2026-07-16 05:25 EDT update

- Implemented the proper onboarding streaming architecture:
  - Browser posts to `apps/web/app/api/front-door/message/stream/route.ts`.
  - Manager streams natural-language deltas from xAI-compatible chat completions via `/manager/orchestrator/web/stream`.
  - Manager then performs a separate strict structured extraction pass and persists the same onboarding session state/manifest/transcript path.
  - This intentionally avoids brittle streaming of a JSON field from a structured output response.
- Kept the JSON `/api/front-door/message` path as a fallback for transport failures.
- Removed synthetic secure-control owner chat messages such as phone/code/account/start markers.
- Added deterministic pending/done/error states for phone verification, account creation, and employee start controls.
- Account creation now maps duplicate Supabase Auth email failures to stable `account_email_already_registered` instead of a vague failed button.
- Onboarding model-bound context strips contact/account/auth-like keys and redacts accidental emails/phones/codes in text.
- Strict onboarding extraction schema no longer advertises `owner_email`.
- Changed onboarding/orchestrator model temperature default to `0.45`; `.env` local override was also changed from `0.2` to `0.45`. The production-like Manager container did not have `ORCHESTRATOR_TEMPERATURE` set, so it uses the rebuilt code default.
- Added `docs/public-interaction-standard.md` as the living high-level standard for AMTECH public surfaces: conversation captures intent, secure controls handle secrets/risky data, streamed public progress is business-facing, and work becomes typed proof/state.
- Database cleanup note: a real Supabase cleanup deleted tenant/runtime/onboarding/auth test state. It also cleared `entitlement_policies`; code inspection showed the current entitlement implementation is hard-coded MVP default allow and records checks to `feature_checks`, so `entitlement_policies` is future override/paywall scaffolding and not a functional blocker for this onboarding path.
- Rebuilt production-like stack from source. The first proof at `infra/proofs/prod-like-normal-up-2026-07-16T09-23-28-949Z.json` recorded `fail` because Docker Compose hit an orphan/intermediate container-name conflict from an interrupted rebuild, but the rebuilt images were produced and manually/Compose-started healthy. A clean follow-up no-build proof succeeded at `infra/proofs/prod-like-normal-up-2026-07-16T09-25-29-856Z.json`.
- Public SSE smoke through `https://agent.amtechai.com/api/front-door/message/stream` succeeded with live deltas and final `done` for temporary session `onb_b24hcnq0ip907a0w6esxco`; that throwaway test onboarding session was deleted immediately after.
- Tunnel was restarted for connector hygiene/security:
  - removed previous `amtech-tunnel` container;
  - started fresh Dockerized cloudflared connector from `infra/.local/cloudflared/cert.pem` without printing token;
  - new container id prefix: `092fb2e18436`;
  - tunnel id: `496ceef3-e2a8-49f5-9af3-c3b155534627`;
  - new connector id: `00ebed27-2432-4eda-9c64-162dbd91dc20`;
  - Cloudflare prechecks passed and public `https://agent.amtechai.com/create-ai-employee` returned `HTTP/2 200` with `server: cloudflare` and `via: 1.1 Caddy`.

## Cloudflare tunnel finding

- The named tunnel is `amtech-tunnel` in the Cloudflare account.
- Host `cloudflared` is not installed:
  - `command -v cloudflared` returned no path.
- No local Cloudflare login/cert was found:
  - `~/.cloudflared` does not exist.
  - Searches found no `cert.pem` or `*.cfargotunnel.com.json` credentials under the workspace, home, or `/tmp`.
- `infra/deploy/.env.production` has `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_ZONE_NAME`, but no `CLOUDFLARE_TUNNEL_TOKEN`.
- The stored Cloudflare value is not accepted as a bearer API token:
  - `GET /client/v4/user/tokens/verify` returned `400` / code `6003` / `Invalid request headers`.
- Trying the actual Dockerized tunnel program by name failed exactly because no origin cert is available:
  - `docker run --rm --network host cloudflare/cloudflared:latest tunnel --no-autoupdate run amtech-tunnel`
  - Result: `Cannot determine default origin certificate path... No file cert.pem... You need to specify the origin certificate path...`
- The founder downloaded the Cloudflare origin cert to `/home/georgej/Downloads/cert.pem`; it was moved to `infra/.local/cloudflared/cert.pem` and used successfully with:
  ```bash
  TOKEN=$(docker run --rm --user 0 \
    -v "$PWD/infra/.local/cloudflared/cert.pem:/cert.pem:ro" \
    cloudflare/cloudflared:latest tunnel --origincert /cert.pem token amtech-tunnel)
  docker run -d --name amtech-tunnel --network host --restart unless-stopped \
    cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "$TOKEN"
  ```

## Carry-forward / next

Continue from the live browser at:

```text
https://agent.amtechai.com/create-ai-employee
```

Complete the real public onboarding path: chat-first intake, Twilio Verify, account creation, Start Employee, live owner web client, and a provider-backed employee reply. Capture `session_id`, Twilio Verify SID/status, `account_id`, owner email, `employee_id`, `amtech-hermes-<employee_id>` container id/status, the proof JSON paths, tunnel id/container id, and final provider-backed reply evidence.

Important product/research note: the current chat-first onboarding interface is a working jumping-off point for next-level research. It validated the direction from the recent AI UX work: the owner should experience one conversational relationship, while sensitive identity/payment/provider actions appear as inline secure controls instead of being typed into chat or delegated to the model. Next research should treat this as the seed pattern: agent conversation for context and intent, deterministic secure controls for secrets/identity, and typed handoff states that let the employee start without exposing private account details to the onboarding LLM.

## Verification

- xAI redacted probe: `/models` `200`; `grok-4.3` listed; `json_schema`/`json_object`/none chat calls all `200`.
- Manager typecheck: passed.
- Focused onboarding/orchestrator unit tests: passed, 14/14.
- Production-like rebuild: Manager/Web/Caddy images built and containers healthy.
- Origin route: `HTTP/1.1 200 OK` through Caddy.
- Public route: `HTTP/2 200` through Cloudflare and Caddy.
- Post-security rebuild proof:
  - `infra/proofs/prod-like-normal-up-2026-07-16T08-33-32-382Z.json`
  - Manager health: `{"status":"ok","tools":65,"expected":65}`
  - Tunnel connector id from logs: `afe108d2-2036-4bc4-a411-af29d6cacc75`
