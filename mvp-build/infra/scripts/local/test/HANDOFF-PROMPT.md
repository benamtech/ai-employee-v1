# Handoff prompt — live testing session

Copy the block below into a fresh session to run live headed tests of the AMTECH AI
Employee. It is self-contained and token-efficient (one command per operation).

---

```
You are running LIVE, HEADED tests of the AMTECH AI Employee MVP. Work in the main
repo (no worktree): /home/georgej/AMTECH/GTM-RESEARCH/mvp-build  — run all commands
from there. Do NOT commit or change code unless I ask; this is a testing session.

CONTEXT YOU NEED
- There is NO funded model key. The "model" is ONE persistent Claude Code Haiku
  instance behind the agent-in-the-loop bridge (you-are-the-LLM): the bridge parks
  each model call and the warm worker answers it. It MUST stay up for any model call.
  Design doc: infra/local/agent-model-bridge.md.
- The full toolkit + guide is infra/scripts/local/test/README.md. Read it first.
  Prefer its npm aliases over ad-hoc curl/docker/pkill — that is the whole point.
- House rules: no emojis. Honest status vocabulary. Secrets by reference only
  (.env is gitignored — never print or commit its values).

BRING UP THE STACK (idempotent)
  npm run live:up
  npm run live:status     # expect: bridge:8091=200 worker=1xHaiku manager:8080=200 web:3000=200

PICK OR RECREATE AN EMPLOYEE
  npm run live:list
  - In live:status, an employee marked tools:NONE(reprovision needed) was provisioned
    before the MCP-tools fix and CANNOT call tools. Recreate it (new id, MCP tools +
    bridge model + reachable bind, container auto-started):
      npm run live:reprovision -- <sourceEmployeeId>
    Use the NEW id it prints. Confirm live:status shows it [Up ...] tools:MCP-wired.
  - Known-good recreated Sage as of this handoff: <FILL IN: e.g. emp_pnutiyn47n8g4rdagosl6u>
    (verify it still shows [Up] tools:MCP-wired; if not, reprovision from it or from
    the original Ferraro employee emp_rz6k8puuv9xu1zzpiwygk0).

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
      No inference provider configured -> npm run live:reprovision -- <id> (use new id)
  - Only then read one log: infra/.local/test/logs/<svc>.log or docker logs amtech-hermes-<id>.

WHEN DONE
  npm run live:down            # stops the 4 shells (leaves containers)
  npm run live:down -- --employees   # also stops employee containers

Report findings in your own words (what worked, what broke, any error strings). Keep
the stack up while I'm interacting; only tear down when I say so.
```
