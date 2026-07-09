# 2026-07-06 00:10 — Fix: employee→Manager container networking (MCP url) + in-container terminal backend

Status: source-wired + render-verified; live runtime gate still `pending` (not run — see below)

Follow-up to [[2026-07-05-2343-manager-centrality-and-container-networking-handoff]]. That handoff
diagnosed why a provisioned employee runs **tool-less**; this session fixed the two render-time bugs
and verified them at the render layer without launching the live stack (the human explicitly asked to
fix from reading, not to relaunch the stack).

## Root cause, confirmed against the real artifacts (not just the handoff)

Inspected the on-disk profiles + logs of the two most-recent tool-less employees
(`client_emp_pnutiyn47n8g4rdagosl6u`, `client_emp_rgjiya5m4p7rrhr7h1nlya` under
`~/.hermes/profiles/`):

- Their rendered `config.yaml` baked `mcp_servers.amtech_manager.url: http://localhost:8080/manager/mcp`
  while the model `base_url` correctly used `http://host.docker.internal:8091`.
- `logs/errors.log` / `logs/agent.log`:
  `Failed to connect to MCP server 'amtech_manager': ... Connect call failed ('::1', 8080); ('127.0.0.1', 8080)`
  → `MCP: registered 0 tool(s) from 0 server(s) (1 failed)`. Inside Docker, `localhost:8080` is the
  container's own loopback, not the host — so the whole Manager tool surface was unreachable.
- Same logs: `Docker backend selected but 'docker version' failed (Cannot connect to the Docker daemon
  at unix:///var/run/docker.sock)` — the employee's `terminal.backend: docker` tried docker-in-docker
  with no socket, so `check_terminal_requirements` failed and terminal/file tools were gated off too.

## The fix (all in the profile RENDERER — the `-e` at container start is too late; URLs are baked at render)

`apps/manager/src/lib/profile-renderer.ts`:

1. **Container-facing Manager origin.** New `employeeManagerOrigin(runtimeBackend)`: for the `docker`
   backend it rewrites a host loopback origin (`localhost` / `127.0.0.1`) in `MANAGER_API_ORIGIN` to
   `host.docker.internal`, honoring an explicit `DOCKER_MANAGER_API_ORIGIN` override (matches
   `infra/scripts/local/start-hermes-container.sh`, which adds `--add-host=host.docker.internal:host-gateway`).
   `local` backends and non-loopback (production `https://api.amtechai.com`) origins are left untouched.
   Both the `MANAGER_MCP_URL` and the baked `MANAGER_API_ORIGIN` tokens now use this resolved origin.

2. **Decoupled Hermes terminal backend from the Manager isolation tier.** New `TERMINAL_BACKEND` token
   (default `local`, override `HERMES_TERMINAL_BACKEND`) feeds `config.yaml` `terminal.backend`
   (was `{{RUNTIME_BACKEND}}`). Rationale: the employee ALREADY runs inside the Manager's container, so
   Hermes must execute terminal/file tools in-process (`local`) — the container IS the sandbox.
   `RUNTIME_BACKEND` stays `docker` so `computeApiServerToolsets` still ENABLES `terminal` (blast radius
   = the container). Mounting the host docker socket instead was rejected — it hands the employee
   host-root.

Also updated `packages/agent-template/config.yaml` (both comments + the two tokens) and
`packages/agent-template/README.md` token list.

## Verification (no stack launched)

- `tests/unit/runtime-backend.test.ts`: added 8 cases — loopback rewrite (both `localhost` and
  `127.0.0.1`), `local` left intact, production origin untouched, `DOCKER_MANAGER_API_ORIGIN` override,
  and `TERMINAL_BACKEND=local` under docker + `HERMES_TERMINAL_BACKEND` override.
- Pure-function render smoke (real `.env` origin `http://localhost:8080`, docker backend) prints:
  `MANAGER_MCP_URL: http://host.docker.internal:8080/manager/mcp`, `TERMINAL_BACKEND: local`,
  `RUNTIME_BACKEND: docker`, `PLATFORM_TOOLSETS: [... terminal]`.
- Baseline green: typecheck, **299 unit tests** (44→ +… files), lint, build.

## What's NOT done — the live gate (deliberately deferred this session)

The DoD's live proof was NOT captured (stack not relaunched per the human's instruction). Remaining:
`npm run live:up` → `live:reprovision -- emp_rz6k8puuv9xu1zzpiwygk0` → `live:login` → ask for an
estimate, then confirm: employee log shows `MCP: registered N tool(s)` (N>0); `audit_log` /
`tool_invocations` show a real `create_estimate_artifact` (not just `owner_chat_turn`); estimate → PDF
→ signed link render on the Work Surface. The old tool-less employees in the DB
(`emp_pnutiyn47n8g4rdagosl6u`, `emp_rgjiya5m4p7rrhr7h1nlya`, `emp_rz6k8puuv9xu1zzpiwygk0`) must be
**reprovisioned** to pick up the corrected template.

Not committed yet (branch `worktree-mcp-server-toolsets-descriptor`). Update
`wiki/MVP/implementation-records/` when the live gate closes.

Related: [[2026-07-05-2343-manager-centrality-and-container-networking-handoff]],
[[2026-07-05-2145-live-test-model-bridge-single-instance-and-owner-session-gap]],
[[2026-07-05-0930-mcp-server-toolsets-tool-activity]].
