# AMTECH Agent Platform — Architecture

**Status: complete** · _Created 2026-06-28; refreshed 2026-06-28 with the current Nous Hermes docs. The worked-out technical design for the layer AMTECH owns **on top of** Hermes: how a non-technical owner gets an AI employee (the front door), talks to it across surfaces (the interaction wrapper), and has it managed for them (the backend control plane). Grounded in the proven product mechanics [S081–S085] and current Hermes capabilities [S086–S088]. **The MVP source of truth is [`MVP/old-build-plan/`](MVP/old-build-plan/), built in [`../mvp-build/`](../mvp-build/).** Build mechanics: [`product-ai-employee-context.md`](product-ai-employee-context.md). Funnel framing: [`offers/estimator-whole-product.md`](offers/estimator-whole-product.md)._

## The thesis this architecture serves

Hermes (and the frontier models under it) is the **engine** — profile-scoped state, runtime, memory, gateways, API server, webhooks, cron, MCP, and skill loading [S081, S085–S088]. It improves on its own. **AMTECH owns the layer that makes an agent useful *inside a business*** — getting it in (onboarding), making it work across the surfaces an owner actually uses, and managing its connectors, skills, lifecycle, and fleet over time. That layer is the durable moat, and it is built so that **a Hermes advance makes AMTECH stronger, not obsolete**: new engine capability is absorbed behind AMTECH's tools and shipped to the whole fleet.

**Second-half update, 2026-07-09; current 2026-07-11:** the current source has made the backend/control-plane thesis real enough that the next risk is not "can Hermes work?" but "can a non-technical owner operate it?" The forward plan lives in [`../mvp-build/second-half-plan/`](../mvp-build/second-half-plan/) and the wiki companion is [`MVP/second-half-current-and-future-state.md`](MVP/second-half-current-and-future-state.md). The interface layer is a materialization system that is **now `source-wired`** (live proof pending): `SurfaceEnvelope`, `WorkResource`, `WorkAction`, `CapabilityGraphNode`, and the employee event stream feed web, SMS, signed previews, admin, and (as contracts) desktop/Deno clients from the same employee state; a tool-agnostic Connector Center and a resurfacing projection are its first product use. Hermes Workspace/WebUI/Desktop are inspiration for interaction patterns, not owner-facing vocabulary. The next real risk shifted to **operability** — and the orchestration substrate for it is now **proven on a real Docker host**: the docker-compose core (`manager`/`web`/`caddy`) builds/starts/healthchecks, and per-employee Hermes containers provision/teardown/reinstate + run concurrently with Docker-DNS + Caddy routing across the fleet. The residual operability risk is running it on the **real VPS** (crash/reboot recovery, durability/observability, default-deny egress applied) plus live provider/runtime proof — see the deploy-readiness review, the re-sequenced roadmap, and the Pod Alpha runbook under `../mvp-build/`.

Four design rules govern everything below (see [[amtech-technical-architecture-principles]]):

1. **Agent-native.** Prefer agent **tool calls / MCP and agent-to-agent messages** over bespoke REST APIs wherever it makes sense — the forward bet is that agents coordinate by *messaging each other*, not by calling each other's APIs (this extends all the way to events and notifications; see "The event mesh"). Reuse Hermes primitives (skills, cron, profiles) instead of rebuilding them. The platform is a thin set of **tools the agents call** + **a message rail they talk over**, not a parallel API stack.
2. **Lean.** Minimal code; whole-product vision, thin implementation. Efficiency is a feature: triage cheaply, reason expensively only where it creates human meaning.
3. **One relationship.** The owner **only ever talks to their employee(s).** Acquisition and management are AMTECH acting *behind* that single relationship — never a second surface the owner has to visit.
4. **Proactive competence — the best AI experience they've ever had.** The agent owns the **implied** sub-steps. "Connect my email" means connect → test → verify → report; the owner **never** has to say *"…and test it."* Finishing the work includes proving it works and offering the obvious next move. The bar is not "correct" — it is the best assistant experience the owner has ever had.

> **Monetization is deliberately open.** Creating an AI Employee requires **account setup (phone + email verified), not payment.** For this MVP, leave every product capability free by default. The whole point is that someone *instantly* stands up an agent that feels superior to ChatGPT and can do real work. AMTECH has not decided what, if anything, sits behind paywalls yet. Do not assume payment is required before provisioning, before first useful work, before connector setup, or at any other specific step. Still build the **paywall/entitlement scaffolding now** — account entitlements, feature checks, usage counters, upgrade intent hooks, and confirmation-gated money actions — but configure the default MVP policy as permissive/free. The contractor field-sales pricing in [`00-decision.md`](00-decision.md) / [`offers/wedge-offers.md`](offers/wedge-offers.md) is a separate sales-motion hypothesis, **not yet reconciled** with this self-serve funnel — do not collapse the two.

## Account / Profile / Runtime Model

Keep these three concepts separate before writing a build plan:

- **AMTECH user account:** the product/account object. It belongs to a human and, eventually, a business/org. Account setup means phone verification, then email verification + password. This account is what lets the owner return to webchat, see artifacts, manage connectors, and own one or more employees.
- **Hermes profile:** the employee's durable agent home. It contains that employee's identity, config, `.env`, memory, sessions, skills, cron/jobs, MCP config, gateway/API state, and workspace pointers. A profile is the thing a running Hermes agent process uses; it is not the same as an AMTECH login account.
- **Runtime/processes:** the actual running services for a profile: SMS/webhook gateway, API server, cron/job runner, terminal backend/container, and any MCP connector processes. These may run continuously, on demand, or be restarted/supervised per profile. The profile is durable state; the runtime is how that state becomes reachable over SMS, webchat, voice, webhooks, and tools.
- **Entitlement policy:** the product permission layer. For the MVP, default it to `allow` for all capabilities, but still route feature checks through it so later paywalls, limits, trials, upgrades, or manual overrides can be added without rebuilding the agent surfaces.

The product relationship is: **AMTECH account -> employee record -> Hermes profile -> runtime endpoints.** A business-facing endpoint like `agents.hernandezpainting.amtechai.com` should resolve through AMTECH's account/tenant layer to the right employee/profile/API server, not imply that the website login *is* the Hermes profile.

## Hermes-aware corrections

These are the corrections to the earlier prompts that were written before Hermes was understood clearly:

- **A profile is a real employee identity, not a sandbox.** Hermes profiles are separate homes: config, `.env`, `SOUL.md`, memory, sessions, skills, cron, gateway state, API server env, and MCP config are scoped by `HERMES_HOME` [S087]. But on the `local` terminal backend, filesystem/process access is still the host user's access. The secure runtime boundary comes from `terminal.backend: docker` / SSH / Daytona / Modal / a VM, plus `terminal.home_mode: profile` for separate CLI credentials [S085, S087].
- **The webchat bridge is no longer speculative.** Current Hermes exposes an OpenAI-compatible API server per profile, with Responses, Runs, Sessions, Jobs, SSE events, approval resolution, skills/toolset discovery, and bearer-token auth [S087]. AMTECH should front this with its own account auth, artifact UI, and tenant routing rather than inventing a parallel agent runtime.
- **The event mesh has a native Hermes ingress.** Hermes now documents a generic webhook adapter: signed routes, prompt templates, selected skills, delivery to SMS/email/Slack/etc., direct-delivery mode, dynamic subscriptions, rate limiting, idempotency, and body-size limits [S088]. AMTECH still owns event normalization, triage, signing, dedup policy, and human-meaning translation, but it should use the Hermes webhook/API primitives before building a custom "inject message" rail.
- **MCP is the right boundary for AMTECH's control plane.** Hermes can consume stdio and HTTP MCP servers, OAuth-authenticated remote MCPs, mTLS servers, and per-server tool include/exclude filters; it can also run as an MCP server exposing conversation/message send/read tools [S087]. The Manager and the provisioning factory should be implemented as a strict AMTECH MCP/control service where possible.

## The three planes

```
                    THE OWNER  (only ever talks to "my employee")
                        │
        ┌───────────────┼────────────────────────────┐
        │ SMS           │ webchat        (voice → P2)  │   ← Plane 2: interaction wrapper
        └───────────────┼────────────────────────────┘
   pre-account          │            post-account
        │               │                 │
  ┌─────▼─────────┐     │        ┌────────▼──────────────────────┐
  │  PLANE 1       │    │        │  the live employee             │
  │  Front door    │    │        │  (Hermes profile, per client)  │
  │  lean stateless│    │        └────────┬──────────────────────┘
  │  orchestrator  │    │                 │ calls management tools
  │  (LLM + tools) │    │        ┌────────▼──────────────────────┐
  └─────┬──────────┘    │        │  PLANE 3: the "Manager"        │
        │ provision_employee()   │  backend control plane         │
        └───────────────────────►│  (invisible; tools/MCP)        │
                                  │  connectors · skills · crons   │
                                  │  lifecycle · entitlements · drift │
                                  │  multi-employee / org          │
                                  └────────────────────────────────┘
```

---

## Plane 1 — The front door (pre-account onboarding agent)

**What it is:** a **lean, stateless, agentic orchestrator** — an LLM loop with a small set of tools and a goal-oriented system prompt carrying full product knowledge. Not a per-prospect Hermes profile (no need to stand up a full persistent runtime — memory, cron, gateway — for every anonymous front-door conversation), and not a hardcoded form wizard. State lives in a light store keyed by phone / web session; the *intelligence* is the agent loop.

**One agent, two surfaces (now):**

- **Webchat** — `amtechai.com/create-ai-employee`, a Hermes-desktop-like interface that prompts the visitor to **chat first**. Build this surface first: no carrier gating, fastest to a live demo.
- **SMS** — text a keyword to the AMTECH front-door number (recommend a **10DLC long code or toll-free** to start; a true 6-digit shortcode like the example `577977` runs ~$1k/mo + 8–12 weeks of carrier vetting — confirm the number choice). This is today's `sms-entry` seam [S083] **upgraded from a dumb signpost into the live conversation.**

**Why it must be agentic, not a form:** the front-door agent **mirrors how the employee behaves** — same voice, same "do the work, lead with the result" discipline [S084]. So the onboarding conversation *is the first demo*: the prospect experiences the product before they have an account. A form can't do that.

**The conversation arc (goal-oriented):**

1. Greet → "what do you do, and what would you want your AI employee to handle?"
2. Reflect the real capabilities **in conversation** (full back-office: estimates, invoices, follow-up; easy connectors) — selling by demonstrating the voice, not listing features.
3. Gather the facts naturally. These map to the manifest's seven-question contract [S083]; the agent does the structuring, so the human just talks.
4. **Confirm back** what it heard, in the employee's voice.
5. Hand off to account activation: **phone verified first** (Twilio Verify, reusing the MVP claim path), then **email + password**. The verified phone *is* the future employee's allowlisted owner number.
6. On activation, the **entire conversation is piped into provisioning**: the agent's structured summary becomes the manifest and the raw transcript seeds the brain verbatim [S082, S084]. The deterministic intake path means no extra AI step is required, though the orchestrator has effectively already done the `--enrich` job.
7. Provision (`provision_employee` — see below) → the new employee sends its **own first "I'm live" text** (this also closes the MVP's missing provision-time intro gap [S081]).

**Agent-native realization (tools, preferably MCP).** The orchestrator's privileged actions are **tools it calls**, each backed by the same control-plane service Plane 3 exposes — not a REST contract it has to wrap. The cleanest version is an AMTECH Manager MCP with a very small pre-account tool surface:

| Tool | Does | Backed by |
|---|---|---|
| `send_phone_verification` / `check_code` | Twilio Verify OTP | existing MVP claim path [S083] |
| `create_account` | email + password after phone | account service |
| `provision_employee(manifest)` | stand up the per-client Hermes employee | strict wrapper around `provision_client.py` / provision hook [S082] |

**Continuity across the account boundary** is in the **prompt + skills + tools**, not necessarily the runtime. The front-door orchestrator and the live employee share the same prompt/skill DNA and call the same Manager tools, so "the same agent serving at various points" is true at the *definition* layer even though pre-account can run lean (stateless orchestrator) and post-account runs on a Hermes profile. That split is deliberate: the heavy persistent runtime is stood up at **account setup** — the point of real commitment — not for every anonymous front-door chat. Provisioning requires **account creation (phone + email verified), not payment** (see the monetization note up top).

**Provisioning factory boundary.** There are two different "factory" layers, and they should not be mixed:

- **Per-client provisioning:** `provision_employee` stamps a registered AMTECH profile package into one live profile from a manifest, claims/binds a number, configures env, cron/gateway/API routing, validates the generated profile package, starts runtime, and returns proof. This is the claim-time path.
- **Profile/skill authoring:** `hermes-profile-template`-style prompt-to-profile tooling manufactures new vertical profile packages and custom skills [S060–S062]. This is a supply-chain tool, not the runtime path every claimant hits. The current implementation stores `profile_prompt` as future authoring context, but does not yet run prompt-to-repo generation after claim.

Making `provision_employee` an MCP tool is useful precisely because it can be narrow: it accepts only a validated manifest/account id, never arbitrary shell commands; it allocates ports/numbers; it writes a profile; it starts gateway/API/webhook services; and it returns a structured employee record (`profile_id`, `employee_number`, `api_base_url`, `web_url`, `status`, first-message state).

**Endpoint/naming note:** the vision uses `agents.<business>.amtechai.com` (business-named); the MVP currently emits `<client_id>.agents.amtechai.com` [S082]. Reconcile to one scheme at provision time (a business slug is friendlier; keep a stable client-id under it for routing).

---

## Plane 2 — The interaction wrapper (how the owner works with the live employee)

The live employee is a Hermes profile with gateway processes and, when enabled, an API server [S085, S087]. Today the checked-in template declares **SMS only**; current Hermes also supports a per-profile OpenAI-compatible API server with Responses/Runs/Sessions/Jobs endpoints and SSE progress [S087]. Plane 2 adds **webchat now, voice later**, and defines the four interaction primitives the owner feels. The rule stays agent-native: most of this is the **agent's own behavior** (the `SOUL`/`AGENTS` conventions [S084]) plus **thin per-surface adapters** — not heavy middleware.

The second-half plan sharpens Plane 2: the owner surface is not a chat box. It is an employee desk and ambient inbox. Web becomes the high-fidelity renderer (navigation, timeline, preview rail, outputs, connected accounts, capabilities, approvals); SMS becomes the compact renderer (notify/question/review/failure/receipt + signed links); admin becomes the operator renderer (raw provenance, health, repair, cost). All render the same work resources and actions.

**The surfaces:**

- **SMS** (exists) — async, terse. Work = headline + a link to the artifact. Feedback = the next message. The gate = reply "yes" [S084].
- **Webchat** (new) — the rich surface. Same profile, reached through Hermes API server rather than a custom agent loop after account activation. The surface can **render artifacts inline** (preview the estimate), show **work-in-progress** from Runs/SSE/tool events, resolve approvals, and offer **affordances** (an Approve button that is just sugar over "yes"; tap to re-run a repeatable task).
- **Voice** (Phase 2) — call the employee's number; STT in, TTS out; a strict latency budget; artifacts fall back to SMS ("texted you the estimate"). Designed now, built after SMS+webchat prove out.

**The four interaction primitives, worked across surfaces:**

1. **Presenting that work is happening.** Acknowledge, then deliver — never narrate tool steps (the config already sets `tool_progress: off` for SMS [S085]). SMS: a one-line "on it — drafting that estimate" for longer tasks, then the result. Webchat: a live status/step indicator. Voice: a verbal "give me a second."
2. **Previewing work.** The artifact is a file in `./output/` [S084]; AMTECH's wrapper indexes that output folder and exposes files as **signed artifact links** that **materialize per surface** — SMS link, webchat inline preview, voice "check your texts." Same object, many surfaces (this *is* [`principle-graph-materialization.md`](principle-graph-materialization.md)). Hermes produces the artifact; AMTECH owns auth, signed URLs, previews, file retention, and customer-safe rendering.
3. **Giving / getting feedback.** Feedback is **natural language**, not structured forms — "bump it 15%, we don't do popcorn ceilings." The **confirmation gate** is the get-feedback-before-anything-leaves primitive [S084]. Webchat adds one-tap approve as sugar over the same "yes" and should use Hermes approval/session APIs where available [S087].
4. **Repeatable tasks.** A repeatable task = **a skill + an optional cron/job** — both already Hermes primitives the MVP uses (`AGENTS.md` tells the agent to write a skill when something recurs; the two daily check-ins are crons) [S082, S084]. The owner invokes them in natural language ("do the weekly invoices"); webchat can additionally show them as a tappable list backed by Hermes Jobs/Cron APIs. No new task engine — surface what Hermes already has.

**Do not expose the raw Hermes dashboard as the customer app.** The Hermes dashboard is valuable for AMTECH operators because it manages profiles, config, env, MCPs, sessions, logs, cron, and webhooks across a machine [S087]. The owner-facing product should be narrower: chat, artifacts, approvals, repeatable tasks, connector consent, and account settings. AMTECH can borrow dashboard/API primitives, but the customer UI is a product wrapper, not a general Hermes admin panel.

---

## Plane 3 — The "Manager" (the backend control plane)

**This is the corrected concept, and the heart of the moat.** The owner only ever talks to their employee. But a large share of what they ask for is **not work — it's management of the agent itself**: *"connect my email," "also handle my invoices," "give me a second employee for the landscaping side," "stop the morning text," "you're getting the markup wrong, fix it."* These are operations on AMTECH's infrastructure (connectors, skills, schedules, provisioning). The owner must never see a "manager" — their employee just handles it, end to end, **including the parts they didn't think to ask for**.

**Realization (agent-native + proactive).** The management control plane is exposed to the employee as a **set of tools / an MCP server** — the Manager tools. Hermes supports stdio MCPs, HTTP MCPs, OAuth-authenticated remote MCPs, mTLS, tool include/exclude filters, and runtime toolsets [S087]. The owner says only *"connect my email"* — **never "…and test it"** (design rule 4). The employee calls `connect_tool("email")`; the Manager backend runs the OAuth (texts the owner a consent link), wires the connector in, and **verifies it without being asked** — sends a test, confirms it round-trips — then the employee reports: *"Hooked up your Gmail and sent myself a test — it's working. Want me to pull today's threads?"* The privileged work happened server-side; the experience was one continuous employee conversation, and the owner never had to project-manage it.

**Manager responsibilities (what AMTECH owns):**

| Capability | Manager tool(s) | Notes |
|---|---|---|
| **Provisioning & lifecycle** | `provision_employee`, `add_employee`, `retire_employee` | wraps `provision_client.py` [S082]; one owner can run multiple employees |
| **Connectors** | `connect_tool`, `run_connector_test`, `revoke_tool` | OAuth + credential mgmt for email/Drive/invoicing; **connecting always includes the verify/test — the agent's job, never something the owner asks for**; least-privilege (cf. the walled-off intake profile in [`offers/estimator-whole-product.md`](offers/estimator-whole-product.md)) |
| **Skills** | `add_skill`, `tune_skill` | install/curate; manufacture the $300 custom skill (the hosted self-bootstrapping skill) |
| **Scheduling / repeatable tasks** | `set_schedule`, `pause_checkin` | Hermes cron under the hood [S082] |
| **Commercial entitlements / paywall scaffolding** _(free-by-default in MVP)_ | `get_entitlements`, `record_usage`, `request_upgrade` | build the entitlement hooks now but set the MVP default policy to allow all product capabilities; monetization boundaries are deliberately undecided; any money action is confirmation-gated |
| **Drift absorption** | (fleet-internal) | when Hermes/models advance, roll the capability into every profile behind the same tools — **this is how a Hermes advance becomes an AMTECH feature, not a threat** |
| **Org / within-org** | `add_employee`, shared brain, handoffs | the within-organization usefulness AMTECH wants to own: multiple employees, roles, shared knowledge, handoffs between them |

**Why a control plane (not per-employee hardcoding):** leanness and **fleet** management. One Manager backend serves every employee; it is where AMTECH's IP concentrates. But it is reached **agent-natively** — the agents call Manager tools directly, so there is no parallel API the agents (or the owner) have to juggle. Where an operation genuinely needs server enforcement (commercial entitlements later, infra, OAuth secrets), the *tool* is the boundary, backed by the control-plane service.

**Technical efficiency rules.**

- **Message-first, API-backed.** The product experience is agent-to-agent messages and tool calls; the implementation can still use ordinary HTTP/webhook/API plumbing underneath. APIs are transport, not the user-facing mental model.
- **Do not wake the big agent for everything.** Manager rules, direct delivery, cheap model triage, and batching handle routine events. The employee runs only when business judgment or owner-facing wording matters.
- **Every Manager action includes verification.** `connect_tool("email")` means OAuth, install, test, failure handling, and report. `set_schedule` means create, verify next run, and report. `add_skill` means install, smoke test, and report. The owner never appends "...and test it."
- **Return structured state to the employee.** Manager tools should return compact facts the employee can turn into a human message: status, what changed, proof/test result, next suggested action, and any confirmation required.
- **Keep the owner in one relationship.** Even when the Manager, a connector, or a webhook source initiates work, the owner hears from the employee in the employee's voice, usually over SMS unless a preference or severity policy says otherwise.

**Global vs per-profile MCPs.** Use both, deliberately:

- **Global AMTECH Manager MCP:** fleet authority. Provisioning, account binding, connector OAuth, lifecycle, commercial entitlements, artifact signing, event routing, and policy. Exposed to each employee with a minimal tool allowlist appropriate to that employee/account.
- **Per-profile connector MCPs:** business authority. Gmail, Drive, Stripe/invoicing, calendar, vertical systems. Credentials belong to the client's profile/account; dangerous tools are filtered out by default (`refund_payment`, delete operations, broad send/write) and enabled only when the product surface and approval gate support them [S087, S089].
- **Default-loaded skills/toolsets:** every AMTECH employee gets the employee voice, confirmation gate, business-brain discipline, artifact conventions, daily check-in, estimate/invoice primitives for the beachhead, and Manager tools. Vertical or connector-specific skills are installed by the profile template or Manager when the account actually has that lane.
- **Tool selection is product design.** Hermes can discover many tools; AMTECH decides which ones the employee can see. A non-technical owner experiences "connect my email," not a raw MCP catalog.

**Security.** Management tools are privileged, so: they execute under the Manager's authority; the same **confirmation-gate philosophy** applies (anything money- or account-level confirms with the owner first [S084]); and the **`X-Twilio-Signature` + verified-owner** boundary still holds [S085] — only the verified owner's messages can drive management actions on their fleet. The agent has shell access, so management tools are the *sanctioned* path for privileged ops; ad-hoc shell for these is exactly what the docker sandbox (Phase 2.6) is there to contain [S081].

---

## The event mesh — agent-to-agent over APIs (the edge)

The forward bet: **agent-to-agent messaging replaces API glue.** The employee is an **actor with an inbox**; everything that happens to the business arrives there as a **message** — the owner (across surfaces), the clock (cron), the Manager (the result of a management action), and the outside world (events). The employee reads each against the business brain and the trust gate and decides what is worth the owner's attention.

This is sharpest for **notifications**, and it is where the AMTECH edge comes out. Instead of wiring webhooks → a notification service → a templated SMS, the source just **messages the agent**:

```
(into the employee's inbox)   "George Allen just paid invoice #1111 — $2,400, the Smith repaint."
(employee → owner, via SMS)    "George Allen paid #1111, $2,400 for the Smith repaint.
                                Want me to close the job and send a receipt?"
```

A raw webhook says `payment.succeeded id=1111`. The employee says what a sharp office manager would say — **with context and a next action** — because it already holds the brain and the relationship. Notifications, reminders, hand-offs, and cross-system coordination all ride the same rail; any new event source is just **one more sender**, with no new surface for the owner to learn. AMTECH owns the layer where machine events become human-meaningful, actionable conversation.

**Hermes-aware implementation.** Prefer Hermes's documented webhook adapter before building a custom event rail [S088]:

- External systems (Stripe, Gmail/PubSub bridge, Supabase, Manager jobs) POST signed events to a per-profile or Manager-owned webhook route.
- The route uses a narrow prompt template, selected skills, and delivery target (`sms`, `email`, `log`, etc.). For events that need no reasoning, `deliver_only: true` sends a literal notification with zero LLM tokens.
- For events that need business judgment, Hermes runs the employee against the payload and delivers the response to the owner's home channel or preferred channel.
- Dynamic subscriptions let an agent/Manager create routes without a gateway restart, but AMTECH should wrap that in policy: route names, secrets, allowed event types, body limits, idempotency keys, and tool/skill allowlists.

**This must stay cheap (technical efficiency):**

- **Event-driven, not polling.** The employee wakes on a message; it never burns a loop watching for things.
- **Triage before reasoning.** Most events don't deserve the full agent. A cheap tier (rules or a small model) decides *notify / batch / ignore*. The MVP's `[SILENT]` check-in is exactly this pattern, generalized — the agent already knows how to receive a scheduled wake and stay quiet when nothing is worth a text [S082, S084].
- **Structured payloads; intelligence at the edge.** Internal hops carry compact structured messages; expensive language reasoning is spent only at the point of *human meaning* (what / whether / how to tell the owner), not on every plumbing hop. "Agent-to-agent" is the **interface and the future-proofing**, not a mandate to parse English at every step.
- **Batch + dedup.** Ten events in a minute become one digest, not ten texts; Hermes webhook idempotency helps at the route level, and AMTECH still needs account-level dedup/batching policy for business semantics [S088]. Protecting the owner's attention is a first-class job (same discipline as `SOUL.md` [S084]).
- **Channel by importance.** SMS by default; the owner can set a preferred channel for business-critical events (a call / voice for "the big deposit cleared" or "the permit was denied").

Why it is durable: as Hermes and the models improve, the *same inbox* gets a smarter reader for free, and any new source is one more sender — so "own the within-org usefulness of agents" stops being a slogan and becomes the literal data path.

---

## The moat, stated plainly

- **Hermes = engine.** Profile-scoped state, runtime, gateways, API server, webhooks, MCP, skills, cron. Improves on its own; not AMTECH's defensibility.
- **AMTECH = the management & usefulness layer.** The front-door orchestrator, the multi-surface interaction UX, the Manager control plane (connectors, skills, lifecycle, drift, org), and the trust/preview/feedback workflows — plus the relationship.
- **"Own the agency."** AMTECH owns the *business of running agents inside an organization*: the people, trust, money-gates, multi-employee coordination, and keeping it all current — the schlep a model or runtime advance never does for you.
- **Agent-to-agent over APIs (the sharp edge).** Events, notifications, and coordination arrive as messages the employee interprets against the business brain — `payment.succeeded id=1111` becomes *"George Allen paid #1111, $2,400 — want me to close the job?"* Owning the layer where machine events become human-meaningful, actionable conversation is the most concrete form of owning within-org usefulness (see the event mesh above).
- **Antifragile to Hermes.** Every plane is thin and sits above the engine. A "slight Hermes advancement" is absorbed behind AMTECH's tools and shipped to the fleet, so AMTECH compounds on engine progress instead of competing with it.

## Build sequence (lean, demo-first)

0. **(wired; provider acceptance pending)** MVP factory + account claim — the code now has profile packages, deterministic rendering, validation hook, provisioner HTTP boundary, Caddy/Twilio/runtime hooks, and first-live-SMS proof capture.
1. **(wired; provider acceptance pending)** Front-door orchestrator on webchat (`/create-ai-employee`) — OpenAI-compatible LLM loop ending in account setup and `provision_employee`.
2. **(wired; provider acceptance pending)** Provision-time "I'm live" text + per-profile runtime endpoint record + owner webchat wrapper over the configured Hermes runtime endpoint.
3. **(wired; provider acceptance pending)** Front-door on SMS — signed Twilio inbound routes into the same orchestrator and mints a single-use claim link when ready.
4. **(wired; provider acceptance pending)** Interaction wrapper / estimate artifact / approval v1 — Manager-backed estimate artifact rows, employee-created PDF storage in private Supabase Storage, signed AMTECH artifact links, owner artifact UI, and approval resolution.
5. **(groundwork only)** Gmail Manager control-plane seams — consent-link and draft/attachment rows exist, but real OAuth token exchange, connector test, Gmail send, watch/Pub/Sub, and history sync remain unimplemented until Phase 3.
6. **Stripe/deposit v1** — Stripe Connect in provider test mode, deposit invoice creation from the approved estimate, signed webhook handling, and invoice/payment state events. Payment still does not gate employee creation; Stripe is for the customer's deposit after owner approval.
7. **Event mesh v1** — two real events end to end: Gmail customer reply → employee interprets it → owner gets context + next action; Stripe invoice/payment webhook → employee interprets it when owner attention is useful. No manually injected invoice event satisfies MVP acceptance.
8. **Repeatable-task UX** + **multi-employee / org**.
9. **Voice surface.**

Each step is independently demoable and reuses the last. The orchestrator and the Manager **share tool definitions** where they overlap (both can `provision_employee`), which is the whole point of staying agent-native: one set of tools, many callers.

Current implementation detail is tracked outside the original plan packet in [`MVP/implementation-records/`](MVP/implementation-records/).

---

## Open questions (to resolve before / during the build plan)

**NEXT — the accounts & connectors model (the gating design work):**

_Accounts & identity_
- **What is an account?** Proposed: an AMTECH account starts as one verified owner-user, and should probably belong to a business/org that can hold ≥1 employee. Confirm the `org/account ↔ owner-user ↔ employee record ↔ Hermes profile` data model (it extends the MVP's Supabase claim/consent record [S083]).
- **Identity & verification:** phone verified first, then email + password. Canonical identity key = the AMTECH user/account, not the Hermes profile. Define how phone / email / password / employee records / profile ids relate.
- **Anonymous → account binding:** the stateless front-door conversation is keyed by phone / web-session; on account creation it becomes the manifest. How is that conversation bound to the new account without loss — including if it spans surfaces (start on webchat, finish on SMS)?
- **Web-surface auth:** how does a logged-in web user authenticate to talk to *their* employee, which is otherwise gated by verified phone on SMS [S085]? Map web-session → employee profile(s).
- **Multiple employees / multiple humans:** each employee = its own number + subdomain (clean). Will an org have **more than one human** who can talk to an employee (owner + office admin)? The MVP allowlist is a single owner phone [S085] — multi-user expands it. In scope for the demo, or later?

_Connectors & trust_
- **Connector order for the MVP:** Gmail first (send estimate, listen for real replies), then Stripe Connect in test mode (deposit invoice/payment link and signed webhook events). Drive and Google Calendar are fast-follow.
- **Token custody:** connectors live on the owner's own accounts. Where do OAuth tokens sit (per-profile secret store; refresh handling)? The MVP keeps per-profile `.env` / `home_mode: profile` [S085].
- **Least-privilege scopes:** a per-connector scope policy (Gmail read vs send; Drive read-only) — the walled-off-profile discipline applied.
- **Agent-native OAuth flow:** employee says "connect your email" → sends a consent link → owner approves on a hosted OAuth page → callback to the Manager → token stored → employee **verifies and resumes**. Define this flow concretely, including the SMS → web → SMS hop.
- **Connector installation path:** Hermes supports per-profile MCP config and tool filtering; decide whether AMTECH writes connector MCP config directly, calls `hermes mcp` commands, or uses the dashboard/API surfaces as the control point [S087].
- **Verify + failure:** the canonical "test" per connector (the proactive-competence step, design rule 4); and connector breakage surfaces as an **event into the inbox** ("your Gmail connection broke — reconnect?").

**Other open threads (resolvable alongside, or in the build plan):**
- **Event mesh:** first real sources = Gmail reply and Stripe invoice/payment webhook → Manager-normalized route → employee notification; decide where triage runs (Manager rule-tier vs the employee's `[SILENT]`-style gate); how a per-owner **notification-channel policy** is stored.
- **Webchat and artifact preview:** Hermes API server/dashboard primitives are confirmed [S087]; the AMTECH work is tenant auth, profile routing, API keys, Runs/SSE UX, and turning `./output/` files into **shareable signed links** [S084].
- **Front-door runtime:** what the stateless orchestrator is built on, and how it physically **shares prompt/skill DNA** with the Hermes employees.
- **Runtime lifecycle and isolation choice:** profiles are durable state; gateways/API servers/cron/MCP/tool backends are the runtime processes that make a profile reachable. Decide which run continuously vs on demand, and decide local Docker vs per-employee containers/VMs/VPS/SSH/Daytona for the demo and for pilots [S087].
- **Self-hosted footprint:** which MVP pieces run on the owner's own box vs hosted — Supabase (self-host Postgres?), the Netlify `claim` / `sms-entry` functions (self-host a small service?), ingress (Caddy vs Cloudflare tunnel [S081]), and whether the demo needs A2P 10DLC or a single toll-free number suffices. **These are the build-plan decisions for the self-hosted demo (LLMs and external APIs excepted).**

**Deferred (not blocking the demo):** the voice surface (STT/TTS/telephony/latency), Google Calendar write integration, Drive, multi-human orgs, and **monetization / paywalls** (deliberately open — see the callout up top).

> **Path from here:** execute the build plan in [`MVP/old-build-plan/README.md`](MVP/old-build-plan/README.md). The MVP bar is a real whole-product path: signup → employee → estimate PDF → approved Gmail send → real Gmail reply event → approved Stripe Connect deposit invoice in test mode → internal reminder.

---

_Principles: [[amtech-technical-architecture-principles]] · [`principle-agent-leverage.md`](principle-agent-leverage.md) (person-minimal; founder at the Tier-D gate) · [`principle-graph-materialization.md`](principle-graph-materialization.md) (one brain, many surfaces) · [`principle-deliverable-driven-surfaces.md`](principle-deliverable-driven-surfaces.md) (the deliverable's type drives Plane 2's preview/approval/repeatable-task interactions across hundreds of skills). Product mechanics this builds on: [`product-ai-employee-context.md`](product-ai-employee-context.md). GTM/funnel this enables: [`offers/estimator-whole-product.md`](offers/estimator-whole-product.md)._
