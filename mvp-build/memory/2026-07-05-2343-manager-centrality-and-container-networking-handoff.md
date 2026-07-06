# 2026-07-05 23:43 — Handoff: Manager must be the central control plane; fix host↔container networking so employees actually reach it

Status: active handoff

This is both a durable handoff and a copy-paste prompt for a fresh session. The live
headed test surfaced that a provisioned employee runs **tool-less** because it cannot
reach the Manager from inside its Docker container. That is not a cosmetic bug — the
**Manager is the spine of this product** (event ingress/egress, tool calling, and the
Work Surface / MCP-UI all flow through it), so an employee that cannot reach the
Manager is a frontier chatbot, not an AI employee. Make the Manager central and make
the container↔host path to it rock-solid.

---

```
You are working on the AMTECH AI Employee MVP in the MAIN repo (no worktree):
/home/georgej/AMTECH/GTM-RESEARCH/mvp-build  — run everything from there. Do not push
to main; branch off main for feature work; commit only when asked.

=== ORIENT (read in this order) ===
1. ../identity.md                         — required operating self-image/voice.
2. ../CODEGRAPH.md                         — root GTM brain map + canonical facts.
3. ./CODEGRAPH.md and ./CLAUDE.md          — the MVP build's architecture map + agent guide.
4. ./memory/MEMORY.md                      — durable dev handoffs; read the newest few, incl.:
     - 2026-07-05-2343 (this file) — Manager centrality + container-networking bugs.
     - 2026-07-05-2145 — model-bridge single-instance worker, dev-login, provisioning fixes, live-test toolkit.
     - 2026-07-05-0930 — Manager-as-MCP-server + toolset enablement (the design you're extending).
5. ./infra/local/agent-model-bridge.md     — the no-key "you-are-the-LLM" model bridge (see below).
6. ./infra/scripts/local/test/README.md    — the live-test toolkit (npm run live:*). Use it; it is token-efficient.

House rules: no emojis anywhere. Honest acceptance vocabulary (source-wired /
provider-accepted / runtime-accepted / planned / pending) — never fake proof. Secrets
by reference only; .env is gitignored — never print or commit its values. On this Node
26 box the Manager runs on plain `tsx`, NOT `tsx watch` (which crashes resolving
@amtech/shared); the live-test toolkit already does this.

=== HOW IT FITS TOGETHER (the mental model) ===
The owner only ever talks to ONE employee (SMS + the web Work Surface at /agent/<id>).
The employee is a per-client Dockerized Hermes runtime. The MANAGER (Node/TS control
plane, apps/manager, :8080) is the invisible spine and MUST be central to:
  - EVENT INGRESS: external/untrusted sources -> ingestEvent (adapter contract);
    internal Manager-authored events -> deliverEmployeeEvent. Two-door split is intentional.
  - EVENT EGRESS / channel routing: owner turns, replies, SMS/web delivery, presence.
  - TOOL CALLING: the Manager is exposed to the employee as a native MCP server
    (apps/manager/src/lib/mcp-server.ts, POST /manager/mcp) — a transport over the
    tool registry (runManagerTool) so gates, audit, secrets-by-reference, and the
    approval flow are reused, not reimplemented. The employee's config.yaml attaches
    it as mcp_servers.amtech_manager. THIS is how the employee gets estimates,
    artifacts, approvals, Gmail/Stripe connectors, reminders, business brain, etc.
  - WORK SURFACE / MCP-UI: the Manager turns Hermes's Run/SSE event stream into
    owner-safe WorkEventDescriptors (SSE at /api/employee/[id]/events -> AgentClient.tsx),
    and compiles agent `view` output into ui:// MCP-UI resources rendered in a
    sandboxed iframe whose postMessage intents route back through the approval gate.
Local model: there is NO funded key. The "LLM" is ONE persistent Claude Code Haiku
instance behind the agent-in-the-loop bridge (:8091). It MUST be up for any model call.

=== THE BUGS TO FIX (why the employee is tool-less) ===
Reproduce: `npm run live:up`, then `npm run live:reprovision -- emp_rz6k8puuv9xu1zzpiwygk0`
(recreate the Ferraro "Sage" employee), `npm run live:login -- <newId>`, ask it to
"create an estimate". It only chats and deflects ("load the estimate skill first").
Root causes, from the employee's ~/.hermes/profiles/client_<id>/logs/errors.log +
agent.log and the DB (audit_log has only tool:provision_employee; every
tool_invocations row is owner_chat_turn; agent.log shows tool_turns=0):

1. **[PRIMARY] Manager MCP server unreachable from inside the container → 0 tools.**
   errors.log: "MCP server 'amtech_manager' failed initial connection ... Connect call
   failed ('127.0.0.1', 8080)" and agent.log: "MCP: registered 0 tool(s) from 0
   server(s) (1 failed)". The rendered config.yaml sets
     mcp_servers.amtech_manager.url: http://localhost:8080/manager/mcp
   but the employee runs INSIDE Docker, where localhost:8080 is the container's own
   loopback, not the host. It must be host.docker.internal:8080 — exactly like the
   model base_url correctly uses host.docker.internal:8091. This is the SAME class of
   host↔container bug already fixed twice this session (API_SERVER_HOST 127.0.0.1->0.0.0.0
   for reachability; the model base_url). Fix in apps/manager/src/lib/profile-renderer.ts:
   the MANAGER_MCP_URL token derives from MANAGER_API_ORIGIN (= http://localhost:8080,
   the host value) — for a docker-backend employee it must resolve to
   host.docker.internal:8080. start-hermes-container.sh already knows the container-
   facing origin (DOCKER_MANAGER_API_ORIGIN / passes -e MANAGER_API_ORIGIN=
   http://host.docker.internal:8080), but that runtime -e is too late — the URL is
   already baked into config.yaml at render time. So the RENDERER must emit the
   container-facing origin for the MCP url (and audit any other host-baked URL that the
   containerized employee has to call back on: webhook/callback origins, artifact links).
   Also confirm the Manager MCP handshake works over host.docker.internal (the bearer
   MANAGER_INTERNAL_TOKEN is rendered into mcp_servers.amtech_manager.headers).

2. **[SECONDARY] terminal.backend: docker fails inside the container.** agent.log:
   "Docker backend selected but 'docker version' failed (Cannot connect to the Docker
   daemon at unix:///var/run/docker.sock)". The employee's rendered terminal backend is
   docker, but there is no docker socket inside the container, so terminal/file tools
   are gated off ("check_terminal_requirements returned False"). Decide the right
   containerized-employee terminal backend (run in-container without docker-in-docker,
   or mount the socket deliberately) — this is separate from the MCP fix but also
   suppresses tools. Lower priority than #1.

=== DEFINITION OF DONE ===
- A freshly reprovisioned employee logs "MCP: registered N tool(s)" (N>0) and, when
  asked for an estimate, actually calls create_estimate_artifact (audit_log /
  tool_invocations show a real Manager tool, not just owner_chat_turn), and the
  estimate -> PDF -> signed link render on the Work Surface.
- Verify end-to-end with the live-test toolkit (README.md): npm run live:up ->
  live:reprovision -> live:login -> drive it; watch infra/.local/test/logs/*, the
  employee profile logs, and audit_log/tool_invocations.
- Keep the you-are-the-LLM bridge + one warm Haiku worker as the local model.
- Update ./memory/ (this handoff's follow-up) + the wiki/implementation-records when
  the Manager-centrality networking is solid. Treat reliable container->Manager
  reachability as a first-class, tested invariant, not an incidental config value.
```

## Working state at handoff (for the human)

- Everything is shut down (`npm run live:down -- --employees`): bridge/manager/web off,
  all `amtech-hermes-*` containers stopped.
- Committed this session (branch `worktree-mcp-server-toolsets-descriptor`, NOT pushed):
  `6911400` (single-instance Haiku worker) and `276a580` (dev-login + provisioning
  fixes + live-test toolkit). The MCP-url fix above is NOT yet done.
- Employees in the DB: original Ferraro `emp_rz6k8puuv9xu1zzpiwygk0` (Sage, exited, the
  reprovision source) plus this session's recreated ones (`emp_pnutiyn47n8g4rdagosl6u`,
  `emp_rgjiya5m4p7rrhr7h1nlya`) — all tool-less until the MCP-url fix lands.

Related: [[2026-07-05-2145-live-test-model-bridge-single-instance-and-owner-session-gap]],
[[2026-07-05-0930-mcp-server-toolsets-tool-activity]], [[event-ingress-two-door-architecture]].
