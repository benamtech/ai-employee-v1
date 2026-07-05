# Tool availability bug + the materialization architecture (findings, plans, insights)

Date: 2026-07-05 01:40
Author: Opus 4.8 session (design-review turn, pre-build-plan)
Status: the toolset finding is FACT (verified in installed hermes-agent source). The materialization
architecture is a PROPOSED direction, pending founder sign-off before it becomes a phase.
Related: [[2026-07-05-0101-connector-actions-event-surface-and-observability]] (the connector work that
prompted the "buttons vs MCP-UI" question).

> Note on visibility: this file lives on the worktree branch `worktree-hermes-alignment-corrections`,
> not the main `mvp-build/` checkout. It is committed + pushed to that branch / PR #2.

---

## 0. The one-paragraph thesis

We have built something rare — a `(Hermes agent + Manager + business-brain + event-ingress)` factory
where **every employee is a frontier-model, state-of-the-art agent** with a huge native toolset. But we
(a) never turned most of those tools on in the profile, and (b) render only a few hand-coded card types.
The fix is not more bespoke UI. It is: **enable the full toolset**, then build a **schema-driven
materialization layer** so ANY tool (native or MCP) surfaces on ANY surface with no per-tool code —
reserving hand-built native cards for money/trust-critical flows (Stripe/Gmail) and adopting **MCP-UI /
MCP Apps** as the standard for rich, self-describing, extensible widgets. Multi-surface degradation
(web card → SMS line → voice summary) from one descriptor is our moat and is not something MCP-UI gives
you for free.

---

## 1. FACT: our employees aren't getting Hermes's toolset (config bug)

Verified in the installed runtime source (`~/.hermes/hermes-agent`):

- Hermes resolves an employee's tools for the **api_server platform** (what our employees run on) from
  `config.yaml` → **`platform_toolsets.api_server`**: `gateway/platforms/api_server.py:1241,1328`
  (`_get_platform_tools(user_config, "api_server")` → `enabled_toolsets`).
- There is a live introspection endpoint: **`GET /v1/toolsets`** (`api_server.py:1559`, route registered
  at `:4766`) that returns each toolset's `enabled`/`configured` state and its resolved tool list. This
  is the ground-truth check for "what can this employee actually do."
- The default composed toolset is tiny: `tools/delegate_tool.py:616`
  `DEFAULT_TOOLSETS = ["terminal", "file", "web"]`.
- Toolsets are configured under `platform_toolsets` in `cli-config.yaml.example:796` (see also `:751`
  "use `hermes tools` to enable/disable", `:849` "Available toolsets", `:898` "Composite toolsets").
- **Our `packages/agent-template/config.yaml` sets NO `platform_toolsets` block.** So a provisioned
  employee falls back to the minimal default. Everything below is dark by default.
- Stale note to fix: `packages/agent-template/.env.tpl:17` says "Config is env-only in current Hermes;
  config.yaml keys are ignored." That is **wrong for the api_server path**, which explicitly reads
  `platform_toolsets` from config.yaml. This wrong note is probably why nobody wired the toolsets.

### The native toolset we are shipping but not enabling
From `~/.hermes/hermes-agent/tools/` (the shipped surface — confirm exact toolset grouping via
`GET /v1/toolsets` on a live employee, since some are composite):

- **terminal / files:** `terminal_tool`, `read_terminal_tool`, `close_terminal_tool`, `file_tools`,
  `file_operations`, `read_extract`, `project_tools` (default set today = terminal/file only + web).
- **web / research:** `web_tools`, `url_safety`, `website_policy`, `x_search_tool` (X/Twitter search),
  `session_search_tool` (search prior sessions), `read_extract`.
- **browser automation:** `browser_tool`, `browser_cdp_tool`, `browser_dialog_tool`,
  `browser_camofox`, `browser_supervisor`, `computer_use_tool` — the difference between "drafts an
  estimate" and "logs into a supplier site / redesigns a page in a real browser."
- **generation:** `image_generation_tool`, `video_generation_tool` (+ `xai_video_tools`),
  `tts_tool` / `neutts_synth` / `voice_mode` / `transcription_tools` (speech in/out),
  `code_execution_tool` (sandboxed code).
- **agent-native leverage:** `delegate_tool` (subagents — bounded parallel work re-entering the
  session), `cronjob_tools` (self-scheduling), `memory_tool` (durable memory), `send_message_tool`,
  `todo_tool`, `kanban_tools`, `clarify_tool` (ask-for-clarity), `approval` / `write_approval`.
- **skills:** `skills_tool`, `skill_manager_tool`, `skills_hub` (install/author skills — the employee
  writing new skills for the business over time; the "gets better at THIS business" mechanic).
- **connectors / integrations:** `mcp_tool` + `mcp_oauth` (dynamic external MCP tools — the whole MCP
  ecosystem), `microsoft_graph_*`, `feishu_doc_tool`/`feishu_drive_tool`, `discord_tool`,
  `homeassistant_tool`, `managed_tool_gateway`, `tool_search`.

Implication for the product story: "redesign a website / deep BD + sales research / generate marketing
images / voice" are not roadmap items — the tools exist in the box. We just have to enable + materialize.

### Smallest correct fix (verify, do not assume)
1. Add `platform_toolsets.api_server: [ ... ]` to the rendered profile `config.yaml` (via
   `profile-renderer.ts`). Start with a safe contractor set and expand deliberately; keep
   money/customer-facing actions behind our Manager approval gate regardless of what Hermes exposes.
2. Boot an employee and `GET /v1/toolsets` (sealed bearer) to confirm the resolved surface — never
   claim a tool is available without this proof (Realness Rule).
3. Add the `/v1/toolsets` list to `npm run local:inspect` so we see the live tool surface every run.
4. Fix the stale `.env.tpl:17` note.

Open question for the fix: which toolsets are safe-by-default for an autonomous employee texting a
non-technical owner (terminal/code_execution/browser/computer_use carry real blast radius). Likely tie
enablement to the runtime backend policy (`runtime-backend.ts`: Docker-isolated → broader; `local` →
narrow) and keep the confirmation gate as the safety net.

---

## 2. The design question: our "buttons" vs MCP-UI — and the answer

### What our Work Surface buttons are
Manager-authored, server-rendered React driven by a typed `WorkEventDescriptor`; bespoke component per
`DeliverableType`; the action calls a Manager tool through a Next.js route (e.g. the connector/start
route). We own both ends. Strengths: gate-aware, secure, deterministic. Weakness: every new capability
needs a new renderer — bespoke code per thing. Does not scale to "any of ~40 tools + any MCP tool."

### What MCP-UI / MCP Apps is (official MCP extension, spec 2026-01-26)
The tool/server **declares a UI resource** (self-contained HTML / remote-DOM / external URL). The HOST
fetches it, renders it in a **sandboxed iframe** (no access to host DOM/cookies/storage), and
communicates **bidirectionally over JSON-RPC via postMessage** — shared methods like `tools/call` plus
new `ui/*` methods. Tools declare UI templates ahead of time so the host can prefetch/cache/security-
review. The UI ships WITH the capability and is host-agnostic (SDK adapters translate to each host).
This is precisely the "represent a tool with no bespoke code on our side" property — WHEN the tool
provides the UI.

### The nuance that decides it
- The reference `pyrate-llama/hermes-ui` is **also bespoke-per-message-type** (React single-file over an
  SSE proxy), NOT MCP-UI. So the best-in-class Hermes UI today does not use MCP-UI. That tells us MCP-UI
  is not yet the turnkey answer for a Hermes command center — but its *model* (capability-declares-UI) is
  the right extensibility boundary.
- Most Hermes native tools do NOT ship MCP-UI resources. So MCP-UI alone leaves ~40 tools unrendered.
- MCP-UI is web/iframe-only. It gives you nothing on SMS or voice.

### Verdict: two-tier materialization (build both, they compose)
- **FLOOR — universal schema-driven renderer (covers EVERY tool, zero per-tool code).** THE key
  invention. Generalize our descriptor grammar into a `ToolActivityDescriptor` (see §3). Render input
  from the tool's JSON schema, output by result shape, gate by risk. Any native tool + any MCP tool
  materializes from its schema. This is our graph/deliverable-materialization research applied.
- **CEILING — MCP-UI/MCP Apps for rich, self-describing widgets + the third-party boundary.** When a
  capability wants a real interactive UI (a calendar picker, a map, a rich invoice editor), it ships an
  MCP-UI resource we render in a sandboxed iframe. Adopting the standard means external/MCP connectors
  bring their own UI for free — future-proofing the "any connector" promise.
- **NATIVE CARDS — keep for money/trust-critical flows** (Stripe, Gmail). Already built. The founder is
  right to keep these deliberate.
- **MULTI-SURFACE is our moat, not MCP-UI's.** One descriptor degrades: rich card on web, typed line on
  SMS (`renderWorkEventSms`, already there), spoken summary on voice. MCP-UI is web-only; the descriptor
  layer is what makes one brain artifact appear correctly on every surface (graph-materialization
  principle). Never let web-rich-UI become the source of truth — the descriptor is.

So: **yes, adopt the MCP-UI direction — as the rich/extensible tier — but the load-bearing build is the
schema-driven descriptor layer underneath it.**

---

## 3. `ToolActivityDescriptor` — the generalization (design sketch)

Today `WorkEventDescriptor` + `DeliverableType` render a handful of Manager-authored outcomes. Generalize
to represent ANY tool invocation/result, authored by the employee OR the Manager, from schema:

- Reuse the existing spine: `move` (notify/question/review), `title`, `summary`, `acceptance` grammar
  (approve/edit/reject/respond/acknowledge), `proof`, and the gate (`workDeliverableNeedsGate`).
- Add a tool-generic deliverable carrying: `tool_name`, `toolset`, `input_schema` (JSON Schema), the
  bound `input` values, a `result_kind` (text | table | artifact | media | external_action | structured
  | error), and optional `ui_resource` (an MCP-UI resource ref) for the rich tier.
- Renderer precedence on web: `ui_resource` present → sandboxed MCP-UI iframe; else a native card exists
  for this `tool_name`/deliverable type (Stripe/Gmail) → native; else → **generic schema renderer**
  (form from `input_schema`, preview from `result_kind`). No bespoke code path for the long tail.
- SMS/voice: ignore `ui_resource`, render `renderWorkEventSms(descriptor)` / a spoken summary. Same
  descriptor, degraded.
- Risk/gate stays structural and independent of rendering: money/leaves-business → approval regardless
  of surface or tool. This keeps the "safe to get wrong first" sequencing intact as we widen the toolset.

Where it plugs in: `packages/shared/src/work-events.ts` (extend the contract), the Hermes→Work adapter
(Phase 3/5 — turn the runtime's tool-progress/tool-call events into descriptors), and
`apps/web/.../components/deliverables/` (add the generic + MCP-UI renderers alongside the native ones).

---

## 4. Proactive tool suggestion (the Janie example) — small addition, big feel

"Janie accepted the estimate, can you start Thursday?" →
1. Event ingress normalizes the Gmail reply (already built).
2. **Enrich** the normalized event with event-keyed candidate next-actions/tools drawn from the event
   type + business brain (accepted-estimate → `send_deposit_invoice`, `set_internal_reminder`,
   `draft_followup`). This is a generalization of the `suggested_next_action` we already emit.
3. The wake prompt hands the employee those candidates + the fact that the tools are actually available
   (per §1). The frontier model does the judgement; we supply candidates + live tools + the gate.
4. Materialize as a `question` card ("Janie's in — want me to send the deposit invoice and pencil in
   Thursday?") on web + SMS. Owner taps approve → gated tool fires.
This is the difference between an inbox and a coworker who notices and offers.

---

## 5. `hermes-ui` — what it proves we should do (feature → our surface)

The reference (`pyrate-llama/hermes-ui`, React single-file + `serve_lite.py` SSE proxy to Hermes :8642,
stdlib-only server, marked.js streaming) independently validated our direction:

- **Tool-honesty guard** (flags narrated-but-not-called work; labels UI-observed vs provider-native) ==
  exactly the hallucination we just fixed with `local:inspect`. Promote it into the live surface, not
  just the CLI: if the employee claims an action with no tool receipt, mark it.
- **Artifact auto-render** (HTML/SVG/PDF/CSV in a sandboxed right panel; auto-loads files the agent
  writes to disk) → our `document`/`media_asset` deliverables should preview inline, sandboxed.
- **Live-work banner** above the composer (background work stays visible as chat scrolls) → our
  Work Surface should surface in-flight tool runs (Runs/SSE), not just finished events.
- **Kanban/tasks from agent signals** (no separate task DB; ages out Done after 2h) → our job folders +
  `todo_tool`/`kanban_tools` once enabled.
- **Approachable UX** (glassmorphic, slash-command menu `/tasks` `/workspace`, workspace/spaces picker
  abstracting the filesystem, personality modes) → the "up and running without ever knowing what an API
  is" philosophy, made concrete.
Takeaway: render the Hermes developer event stream as a coworker (our build-plan 15 "Macintosh moment").
We have the substrate; we've been under-rendering it.

---

## 6. Parked — revisit deliberately (do not lose)

- **`pyrate-llama/hermes-ui`** — command-center UX reference (above).
- **`agentchatme/agentchat-hermes`** + **AgentChat Universal Skill** — connects Hermes to AgentChat
  peer-to-peer agent messaging; WebSocket daemon, leader-lock singleton, 38 typed tools, SOUL.md identity
  anchoring, "silence is a first-class outcome"; the universal skill does autonomous onboarding via curl
  + Hermes's cronjob tool with no human intervention. Relevant to (a) agent-to-agent comms between
  employees / with AMTECH, and (b) self-onboarding automation. Keep in mind "in a big way" (founder).
- **`DanielLi202/hermes-tag`** — "one session and we can have our own claude-tag." A tagging/annotation
  capability worth a session. Revisit.

---

## 7. Proposed next steps (before returning to the build plan)

Sequenced, each with a proof gate; nothing here is built yet.

1. **Tool-availability audit, made real.** Wire `platform_toolsets.api_server` in the rendered profile;
   boot an employee; `GET /v1/toolsets` to prove the surface; add that list to `local:inspect`; fix the
   `.env.tpl` note. (Small, high-signal, unblocks everything.)
2. **`ToolActivityDescriptor` spike.** Extend `work-events.ts`; build the generic schema renderer;
   materialize 2-3 non-native tools (e.g. `image_generation`, `web`/research, `session_search`) on the
   Work Surface with zero bespoke per-tool code. Prove the "any tool, no code" claim on one surface.
3. **Hermes→Work adapter for live tool activity.** Consume Runs/SSE tool-progress/approval events into
   descriptors (Phase 5 substrate already scoped in the connector memory) → live-work banner + inline
   artifacts.
4. **MCP-UI rich tier (opt-in).** Render an MCP-UI resource in a sandboxed iframe for one capability;
   adopt the standard for the third-party/MCP-connector boundary.
5. **Proactive suggestion enrichment.** Event-keyed tool candidates → the Janie flow end-to-end.
Then fold the above into the build-plan phases (likely reshaping Phase 5 "triage/batching/live stream"
to include generic tool materialization, and adding a "toolset enablement + tool materialization" module).

Realness reminder throughout: enabling a toolset or rendering a consent link is not provider/runtime
acceptance; prove with `/v1/toolsets`, real tool receipts, and provider proof ids before any status
upgrade.

---

## Sources
- MCP Apps announcement + spec (2026-01-26): https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/ ,
  https://modelcontextprotocol.io/extensions/apps/overview ,
  https://github.com/modelcontextprotocol/ext-apps ; SDK: https://github.com/MCP-UI-Org/mcp-ui
- Hermes toolset enablement (installed source): `~/.hermes/hermes-agent/gateway/platforms/api_server.py`
  (`platform_toolsets.api_server`, `GET /v1/toolsets`), `tools/registry.py`, `tools/delegate_tool.py`
  (`DEFAULT_TOOLSETS`), `toolsets.py`, `cli-config.yaml.example` (`platform_toolsets`).
- Reference UI: https://github.com/pyrate-llama/hermes-ui ; parked: https://github.com/agentchatme/agentchat-hermes ,
  https://github.com/DanielLi202/hermes-tag
