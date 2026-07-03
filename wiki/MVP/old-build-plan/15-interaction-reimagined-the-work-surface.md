# Interaction Reimagined — The Work Surface (the Macintosh moment for AI Employees)

Status: active · Date: 2026-06-29

Research + product-vision addendum to the build packet. It does **not** replace the original 00–13 docs; it extends [`06-interaction-wrapper.md`](06-interaction-wrapper.md) and is the design north star for the Phase 2/3 surfaces and everything after. Companion: [`14-agentic-tooling-research-notes.md`](14-agentic-tooling-research-notes.md) (the tool/efficiency mechanics this vision renders).

> **The thesis, in one line.** The Macintosh did not invent the computer — it invented the *interface* that made the computer usable by people who would never touch a command line. Hermes (and the frontier models under it) is a staggeringly capable agent runtime with a **developer** front door: a CLI, a raw OpenAI-compatible API server, bearer tokens, toolset config, terminal backends, a Pub/Sub event firehose. **None of that is reachable by a 55-year-old painter.** AMTECH builds the interface that turns that runtime into a **coworker you already know how to manage** — one that texts you, shows its work like a good office manager, and asks before anything leaves the business. **AMTECH is to the AI agent what the Macintosh was to the PC.**

---

## 1. Why the out-of-the-box agent interface fails our ICP

Hermes ships real, powerful interaction surfaces [S086–S089, and the API-server doc below]. Every one of them is built for a developer or a power user, not for the owner of a paint crew:

| OOTB Hermes / generic-agent surface | Why it's invisible to the painter |
|---|---|
| `hermes chat` CLI, `--toolsets "web,terminal"` | He has never opened a terminal. |
| The Hermes **dashboard** (profiles, config, env, MCP servers, sessions, logs, cron) | This is an *operator's* control panel — the thing AMTECH uses, not the thing the customer touches (`06`, "do not expose the raw Hermes dashboard as the customer app"). |
| Raw OpenAI-compatible API + **bearer tokens**, `X-Hermes-Session-Key` headers | An integration surface, not a product. |
| `toolsets`, `terminal.backend: docker`, `cronjob` config | Configuration is a developer act. The owner says "handle my invoices," never "enable the `cronjob` toolset." |
| A streaming **tool-call log** (`read_file`, `patch`, `terminal`, `browser_navigate`…) | A wall of tool calls reads like the Matrix. It *erodes* trust instead of building it — the opposite of what we need from a money-touching coworker. |
| ChatGPT-style **chat box** as the whole product | Chat is the lowest-common-denominator agent UI and the current bottleneck: real work needs previews, controls, approvals, and step feedback, not a text box [generative-UI sources]. And a blank chat box asks the owner to be a prompt engineer. |

The generic agent industry has noticed the same gap: "AI agents have become much better at reasoning and planning, but the UI layer has mostly stayed the same and is holding back the experience — most agent experiences still rely on chat, even when the task clearly needs forms, previews, controls, or step-by-step feedback" [CopilotKit / generative-UI 2026]. Our ICP makes the gap **absolute**, not just suboptimal: the painter will not climb a learning curve, will not trust a wall of logs, and will not manage configuration. If the interface isn't something he already understands — **a person who works for him** — there is no sale.

**This is the schlep and the moat** (`identity.md` §IV). The distance between "frontier capability exists" and "a 55-year-old painter has it reliably running his office" is exactly the interface, the trust, and the relationship. Owning that layer is owning the business.

---

## 2. The substrate we render (what Hermes actually emits)

The reimagined interface is not invented from nothing — it is a **humane rendering of a real, rich event stream** Hermes already produces. Grounding (Hermes API-server docs, fetched 2026-06-29):

- **Runs API** — `POST /v1/runs` starts an agent run; **`GET /v1/runs/{run_id}/events` is an SSE stream "designed for dashboards and thick clients that want to attach/detach without losing state."** It emits tool-call progress, token deltas, and lifecycle events. `POST /v1/runs/{run_id}/stop` interrupts at the next safe point (owner override). `GET /v1/runs/{run_id}` exposes `status` (`completed|failed|cancelled|stopping`) and `usage`.
- **Tool progress** — `hermes.tool.progress` events surface tool-start visibility *without polluting the assistant text*; in the Responses stream, `function_call` / `function_call_output` items carry `call_id` linkage for real-time rendering.
- **Sessions** — `POST /api/sessions/{id}/chat/stream` emits a clean, renderable event vocabulary: **`assistant.delta`, `tool.started`, `tool.completed`, `run.completed`**. Sessions can be **forked** (`/fork`) — branch a piece of work.
- **Human-in-the-loop gate** — `POST /v1/runs/{run_id}/approval` resolves an approval; **`/v1/capabilities` advertises `run_approval`** so a UI can detect support before surfacing an approval prompt. (AMTECH's confirmation gate sits in front of this with its own approval primitive + audit; see `04`, `10`.)
- **Jobs API** — `POST /api/jobs` + `run|pause|resume` schedules background work (the proactive check-ins and repeatable tasks).
- **Capability discovery** — `/v1/capabilities`, `/v1/skills` (`name/description/category`), `/v1/toolsets` (resolved tools) describe *what this employee can do right now* — the raw material for an honest, human "here's what I can do for you" surface.
- **Memory scope** — `X-Hermes-Session-Key` threads a stable per-channel identity into long-term memory, so the same owner is one continuous relationship across SMS and web.
- **Tools the owner's work actually uses** — `web_search/web_extract`, `browser_navigate/snapshot/vision`, `vision_analyze`, `image_generate`, `read_file/patch/terminal`, `memory`, `cronjob`, `delegate_task`. Each is a *verb of work* we can render as a plain-English activity ("looking up the paint price," "reading last year's estimate," "drafting the PDF").

**Design consequence:** AMTECH's job is a **translation layer**, not a new runtime. Every developer-facing event above maps to one human-meaningful unit: *what is my employee doing, what did it produce, and what does it need from me?* That mapping is §4.

> The generic industry is standardizing exactly this agent→user channel. **AG-UI** ("Agent-User Interaction Protocol") is an open, event-based protocol — ~16 event types covering text streaming, tool orchestration, state sync, and approvals — for streaming agent work into a UI; **A2UI / MCP Apps** let an agent describe UI components at runtime (generative UI) [AG-UI / A2UI 2026]. AMTECH should treat AG-UI's event taxonomy as the **target shape** of its Hermes→surface adapter (so the web Work Surface, and later third-party surfaces, speak a standard), while keeping the *rendered experience* radically simpler than a developer console.

---

## 3. Design principles (the AMTECH interface laws)

1. **One relationship, never a console.** The owner only ever talks to **their employee** (`02`, `product-agent-platform-architecture.md`). Connectors, approvals, artifacts, and provider proofs are rendered *around* that one coworker — never as separate admin screens, never as a tool catalog. "Connect my email" is a sentence to a coworker, not a settings page.
2. **Show your work like an office manager, not a terminal.** Trust in a background agent requires showing what it's doing [ambient-agents / "show your work"]. But the painter does not want `tool.started: browser_navigate`. He wants *"Pulling up your Sherwin-Williams pricing…"* then *"Done — here's the estimate, $4,200."* We render the **meaning** of each event, at the **altitude of the work**, with progressive disclosure: headline by default, the receipt one tap away.
3. **The confirmation gate is the primary trust UI, not a dialog box.** Anything that leaves the business or spends money pauses for a one-line, plain-English "Send it? / Yes." This is `SOUL.md`'s money-gate rendered as the product's signature interaction — the single most important screen we build. Map it onto Hermes `run_approval` + AMTECH's audited approval primitive (`04`, `10`).
4. **Calm / ambient by default.** The employee protects the owner's attention (the `[SILENT]` discipline, `product-ai-employee-context.md`). It reaches out only when something is worth a busy man's glance — and batches/dedups when it isn't (`09`). The default surface is **SMS**, because an SMS from a worker feels like a working office, not another app to check (`00-source-of-truth-and-rules.md`).
5. **Materialize one event stream across many surfaces.** SMS, web, and (later) voice are **renderings of the same employee state**, not separate products (`principle-graph-materialization.md`). The artifact is one object; it appears as an SMS link, a web inline preview, or a "check your texts." Start a job on web, finish it over SMS — no loss.
6. **Recover gracefully, in the open.** When a connector breaks or a send fails, the employee says so as a coworker would — *"Your Gmail connection dropped, want me to reconnect?"* — an event in the inbox, never a stack trace (`09`, `10` repair commands).
7. **Accessible-to-the-painter is a hard test, not a vibe.** Every surface passes §7's checklist or it doesn't ship.

---

## 4. The interaction model — two surfaces, one employee, three move-types

The generic frame that fits our ICP best is the **ambient agent inbox** [LangChain ambient agents]: an agent that runs in the background on event streams (customer replies, payments, the clock) and surfaces to the human in exactly three move-types — **notify, question, review**. AMTECH's whole event mesh (`09`) is built to feed this. We render it on two surfaces.

### 4a. SMS — the ambient inbox (default, MVP-complete shape)
SMS *is* the agent inbox for our ICP — they already live in it, it requires no new app, and it feels like a coworker texting. The three move-types render as:
- **Notify** — "George paid invoice #1111, $2,400 for the Smith repaint." (No action needed; context + a closing offer.)
- **Question** — "Jane asked if you can start Tuesday 9:30. Want me to lock it in?" (One question per message; `SOUL.md`.)
- **Review / approve** — "Here's the estimate to jane@… with the PDF attached. Send it? Yes/No." (The money-gate.)
Discipline: lead with the result, a few lines, at most one question, signed link when inspection is needed. Outbound proof (Twilio SID) and inbound signature are the trust spine under the friendly surface (`10`).

### 4b. Web — the **Work Surface** (the richer rendering; Phase 2 began it)
Not a dashboard — a **coworker's desk you can look over the shoulder of.** It renders the *same* employee/event state with the affordances SMS can't carry. Core components (each maps to a Hermes event or a Manager record):

| Component | What the owner sees | Rendered from |
|---|---|---|
| **The conversation** | One running thread with the employee; same state as SMS | Sessions `/chat/stream` (`assistant.delta`) keyed by `X-Hermes-Session-Key` |
| **"Doing it now"** | A calm, plain-English activity line ("Drafting the estimate…"), not a tool log | `hermes.tool.progress` / `tool.started/completed`, **translated** to work-verbs (`14` mapping) |
| **Artifact preview** | The estimate/invoice rendered inline; the real PDF behind a signed link | `artifacts` + signed link (`04`, Phase 2 built); not placeholder UI |
| **The approval card** | "Send this? / Charge this?" with the exact payload shown before yes | Manager approval primitive ↔ `run_approval`; audited payload hash (`14`) |
| **The job folder** | Everything for one job: estimate → email thread → deposit → reminder | `./output` + `email_threads` + `stripe_invoices` + `reminders`, joined by job |
| **The receipt / proof** | "Sent ✓ 2:14pm · message id…" — quiet proof a real thing happened | provider proof ids (Twilio/Gmail/Stripe), shown as trust, not jargon |
| **"What I can do"** | An honest, plain-English capability list + connect-a-tool prompts | `/v1/skills` + `/v1/toolsets` + connector status, **translated** |
| **The daily brief** | The morning/midday check-in as a glanceable card | Hermes Jobs/cron → the `[SILENT]`-gated digest |

The Work Surface is where AMTECH later adopts **generative UI** properly: when a task needs a form, a comparison, or a control, the employee *renders the right component* instead of a paragraph — using an AG-UI-shaped event channel so the web app (and future surfaces) stay a thin, standard renderer over the Hermes stream [AG-UI / A2UI]. MVP keeps it to the fixed components above; the seam is the adapter.

### 4c. Voice (later) — the same inbox, spoken
Call the employee's number; STT in, TTS out; artifacts fall back to SMS ("texted you the estimate"). Designed now (Hermes ships `text_to_speech`), built after SMS + web prove out (`06`).

---

## 5. The translation layer (the actual build seam) — Hermes events → human work

This is the concrete engineering artifact behind the vision and the bridge to `14`. The Manager (or a thin web BFF) owns a **Hermes→Work adapter** that consumes the run/session SSE stream and emits a small, stable, AG-UI-shaped vocabulary the surfaces render:

```
Hermes event                          → AMTECH work event (owner-facing)
─────────────────────────────────────────────────────────────────────
run started                           → "On it." (only for >~2s tasks; else stay silent)
hermes.tool.progress(web_search …)    → "Looking up the paint price…"
tool.started(read_file: brain/…)      → "Checking your pricing…"
tool.started(browser_navigate …)      → "Pulling up the supplier…"
tool.completed(write_file: output/…)  → artifact appears (preview + signed link)
run needs approval (run_approval)     → APPROVAL CARD (payload shown; money-gate)
run.completed + artifact              → "Estimate's done — $4,200. [preview]"
run failed / connector error          → "Hit a snag with Gmail — reconnect?" (repair offer)
job/cron fired (check-in)             → daily brief card, or [SILENT]
provider event (gmail.reply/stripe)   → notify/question, with context + next action
```

Rules for the adapter (efficiency + trust): **never surface raw tool names**; collapse bursts into one line; only narrate work that takes long enough to matter; spend the expensive model only at the point of *human meaning* (what/whether/how to tell the owner), not on every plumbing hop (`14`, `09` triage). The adapter is the literal place where "machine events become human-meaningful, actionable conversation" — **the AMTECH edge, made of code.**

---

## 6. Why this is the moat (not a skin)

- **Hermes/​models improve on their own; the interface-of-trust does not come for free.** As the substrate gets smarter, the *same* humane surface gets a smarter worker behind it at flat price — and AMTECH compounds on engine progress instead of competing with it (`product-ai-employee-context.md`).
- **Owning the translation layer = owning within-org usefulness.** Every new event source (a new connector, a new provider) is one more sender into the same inbox the owner already trusts — no new surface to learn. That is the most concrete form of "own the agency" (`product-agent-platform-architecture.md`).
- **The relationship is the lock-in.** A coworker who has learned your pricing, your customers, your way of working, and whom you trust at the money gate is not a tool you churn. The interface is what makes that relationship legible and safe.

---

## 7. "Accessible-to-the-painter" acceptance tests (every surface passes these)

- [ ] The owner never sees a tool name, a token, a config key, a JSON blob, or a stack trace.
- [ ] Nothing that leaves the business or spends money happens without a one-line plain-English approval the owner understood.
- [ ] Every "doing it now" line is a sentence a human office manager would say.
- [ ] The same job/artifact/approval is reachable identically from SMS and web (one employee).
- [ ] A failure is surfaced as a coworker's offer to fix it, not an error.
- [ ] Default state is quiet; the employee reaches out only when a busy owner should care.
- [ ] Every external action leaves a quiet, real proof (provider id) the owner *can* see but never has to parse.

---

## 8. Phasing (what's real now → the reimagined arc)

- **Now (Phase 2 shipped-in-code):** the conversation, artifact preview + signed link, the approval card, recent-artifacts/pending-approvals list. This is already the Work Surface embryo — keep extending it, not a second app.
- **Phase 3 (next):** the **event-mesh renderings** — customer Gmail reply → notify/question card with context + next action; connector-as-coworker ("connected your Gmail, sent myself a test — working"). Build the **Hermes→Work adapter (§5)** here, because Phase 3 is the first time a real external event must become human-meaningful conversation.
- **Phase 4–5:** the job folder (estimate→email→deposit→reminder joined), the receipt/proof surface, the daily brief card.
- **Later:** generative UI via an AG-UI-shaped channel (render forms/controls/comparisons on demand); voice; the owner-configurable repeatable-task list backed by Hermes Jobs.

---

## 9. Sources

Hermes capability docs (fetched 2026-06-29): API server (`/v1/runs`, `/v1/runs/{id}/events` SSE, `hermes.tool.progress`, Sessions `/chat/stream` `assistant.delta|tool.started|tool.completed|run.completed`, Jobs, `/v1/runs/{id}/approval`, `/v1/capabilities|skills|toolsets`, `X-Hermes-Session-Key`) and tools/toolsets — <https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server>, <https://hermes-agent.nousresearch.com/docs/user-guide/features/tools> [extends S086–S089]. Generative UI / agent UX 2026 — <https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026>, <https://agentic-design.ai/patterns/ui-ux-patterns>. AG-UI / A2UI generative-UI protocols — <https://docs.ag-ui.com/introduction>, <https://developers.googleblog.com/a2ui-v0-9-generative-ui/>. Ambient agents / agent inbox / notify-question-review / "show your work" — <https://www.langchain.com/blog/introducing-ambient-agents>, <https://github.com/langchain-ai/agent-inbox>, <https://www.blog.langchain.com/ux-for-agents-part-2-ambient/>.
