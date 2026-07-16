# Handoff prompt — live testing session

Copy the block below into a fresh session to run live headed tests of the AMTECH AI
Employee. It is self-contained and token-efficient (one command per operation).

---

```
You are running LIVE, HEADED tests of the AMTECH AI Employee MVP. Work in the main
repo (no worktree): /home/georgej/AMTECH/GTM-RESEARCH/mvp-build  — run all commands
from there. Do NOT commit or change code unless I ask; this is a testing session.

CONTEXT YOU NEED
- Use the normal live provider path. The toolkit keeps host `.env` invariants and
  selectively overlays xAI/Grok OpenAI-compatible provider variables from
  infra/deploy/.env.production. Do NOT source the whole production env into the host
  stack. The legacy LOCAL_MODEL_BRIDGE=1 path is only a dev shim, not proof.
- The full toolkit + guide is infra/scripts/local/test/README.md. Read it first.
  Prefer its npm aliases over ad-hoc curl/docker/pkill — that is the whole point.
- House rules: no emojis. Honest status vocabulary. Secrets by reference only
  (.env is gitignored — never print or commit its values).

BRING UP THE STACK (idempotent)
  npm run live:up
  npm run live:status     # expect: provider=openai_compatible model=<grok model> manager:8080=200 web:3000=200

CREATE THE EMPLOYEE THROUGH CHAT-FIRST ONBOARDING
  LOCAL_BROWSER_HEADLESS=0 npm run local:acceptance:browser-onboard
  Use the headed browser. The create-ai-employee flow is chat-first; phone, code,
  password, account creation, and Start Employee are secure controls inside the chat.
  Capture session_id, account_id, employee_id, owner email, proof path, and runtime id.

LOG IN + OPEN THE WEBCHAT (headed browser)
  npm run live:login -- <employeeId>
  You (the human) land on /agent/<employeeId>, authenticated. Interact there.

WHAT I WANT TO TEST THIS SESSION
  <FILL IN your scenario, e.g.:
   - Estimate flow: ask for an estimate for <job>; verify estimate -> PDF -> signed link
     render on the Work Surface.
   - Approval gate: ask it to email the customer; verify an ApprovalCard appears and
     that nothing sends until I approve.
   - Reminder / business-brain / MCP-UI view: <describe>.
   - Gmail (needs GOOGLE_OAUTH_CLIENT_ID/SECRET set): connect_email consent flow.>

TOKEN-EFFICIENT HEALTH / TRIAGE (don't spelunk — map the error)
  - Default check is ONE call: npm run live:status.
  - A turn failed? Map it:
      owner_session_invalid  -> npm run live:login -- <id>
      runtime_unreachable    -> npm run live:recover -- <id>   (or reprovision)
      No inference provider configured -> provider/render env mismatch; check live:status and reprovision if needed
      xAI auth/credit rejection -> provider-gated, not a Hermes/runtime outage
  - Only then read one log: infra/.local/test/logs/<svc>.log or docker logs amtech-hermes-<id>.

WHEN DONE
  npm run live:down            # stops the 4 shells (leaves containers)
  npm run live:down -- --employees   # also stops employee containers

Report findings in your own words (what worked, what broke, any error strings). Keep
the stack up while I'm interacting; only tear down when I say so.
```
