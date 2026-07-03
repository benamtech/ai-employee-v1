# AMTECH AI Employee — Product Context

**Status: complete** · _Revised 2026-06-28. This page is the brain's **product-mechanics ground truth** for how the AI Employee works — the template, the per-client factory pattern, the two onboarding doors, the security boundary, and the Estimate skill. These mechanics were proven in an earlier working prototype and are now folded into the MVP spec. **The single source of truth for the MVP is [`MVP/old-build-plan/`](MVP/old-build-plan/); the build is carried out in [`../mvp-build/`](../mvp-build/).**_

> **Read this before pitching or planning the Employee.** The mechanics below are the concrete, proven design the [`MVP/old-build-plan/`](MVP/old-build-plan/) packet assumes — a real per-client factory, a deterministic template render, two onboarding doors, a hard signature boundary. This is a stronger story than an aspirational "prompt-to-repo" factory, not a weaker one. Lead with the result; the machinery here is real.

## What AMTECH actually sells

AMTECH is **the commercialization and packaging layer on top of improving agent intelligence** (a self-hosted Hermes agent — Nous-style — driven by frontier models). It does **not** sell intelligence. It sells a **trusted, installed, vertical worker** to a non-technical owner who will never touch Hermes, a connector config, or a model API directly [S051, S081].

The AI Employee is not a chatbot, a receptionist, or a custom app build. It is a **self-hosted Hermes profile per client**, reached by SMS on its own Twilio number, framed as an employee that reports to the owner. AMTECH packages the profile, business brain, skills, memory, check-ins, phone/SMS wiring, approval gates, and provisioning into something the owner experiences as a *worker*, not infrastructure [S081, S082].

The ownership boundary that defines the moat:

- **Hermes core** owns profile-scoped state, the runtime, memory/session separation, gateways, API server, webhooks, MCP, cron, and skill loading. Almost none of the product is custom software — the runtime is Hermes [S062, S081, S086–S088].
- **AMTECH** owns the **template** (the agent authored as files), the **factory** (one script that stamps the template per client), the vertical skills, the business-brain capture, the onboarding doors, the safety/approval policy, and the commercial packaging [S081–S085].
- **The model vendor** owns the intelligence — which improves on its own and is *not* AMTECH's defensibility. The shipped default is `claude-opus-4-8`, with `claude-haiku-4-5` for compression/background work [S085].

## The architecture, as built

One Hermes install on one host; **one profile per client = one AI employee identity**, each textable on **its own Twilio number** claimed from a pool. Concretely, per client `<id>` [S082]:

- **Profile** at `~/.hermes/profiles/client_<id>/` (separate identity, memory, sessions, skills, config, secrets, cron, gateway/API state).
- **Workspace** at `~/amtech/clients/<id>/workspace/` — the agent's `terminal.cwd`, holding `AGENTS.md`, the `brain/`, and `output/`.
- **Inbound webhook** on local port `8100 + n`; the client's Twilio number points at `https://<id>.agents.amtechai.com/webhooks/twilio`, and a reverse proxy (Caddy, or a Cloudflare named tunnel) maps the wildcard subdomain to the port. One client's blast radius never reaches another's.

There is **almost no custom code** here, by design. The two things AMTECH adds are **(1) the template — the agent as files — and (2) a thin factory that renders it per client.** That is the whole MVP. The correction: a Hermes profile is a state/config boundary, not a filesystem sandbox by itself. On `terminal.backend: local`, the agent still runs with the host user's access; production containment comes from Docker/SSH/VM-style backends plus `terminal.home_mode: profile` [S085, S087].

Current Hermes also gives AMTECH stronger wrapper primitives than the first MVP assumed: per-profile API servers for webchat/Runs/Sessions/Jobs, MCP for connector/control-plane tools, and generic signed webhooks for event-triggered agent runs [S087, S088]. The AMTECH layer should wrap those primitives with account auth, tenant routing, artifact previews, connector consent, and strict tool policy — not rebuild the agent runtime.

**Do not confuse AMTECH accounts with Hermes profiles.** An AMTECH account is the owner/product identity: phone verified, then email verified + password, eventually attached to a business/org and one or more employees. A Hermes profile is the durable home for one employee's agent state. Runtime processes — SMS gateway, API server, webhook routes, cron/jobs, MCP servers, and terminal backend/container — make that profile reachable. Creation requires account setup, not payment; monetization and paywalls remain undecided. For the MVP, all capabilities should be free by default, but feature access should still pass through an entitlement/paywall policy layer configured to `allow` so AMTECH can later add paywalls, limits, trials, or upgrades without rewiring the product.

## The template — the product's soul (the part worth pitching)

The persistent, every-client material is the **template** — the agent authored as files. Only the data differs per client; the soul is constant [S084]:

- **`SOUL.md` — the employee persona and the SMS voice.** "You are not a chatbot and not a writing assistant. You are an employee… when there is work to do, you do the work and report the result." The texting discipline is explicit and is a feature: *lead with the result* ("Estimate's done, $4,200, sent it to your output folder"), a few lines, **at most one question per message**, match the owner's register, no filler — because the supervisor is "usually busy, on a job site, or driving."
- **`workspace/AGENTS.md` — the operating policy, loaded every session.** The one rule that matters most: **finish the work**, produce the artifact, don't hand back a plan. Use installed skills; **write a new skill** when you solve something that will recur — that is how each agent gets better at *its* business over time. Deliverables go to `./output/`; durable facts get written back to memory/brain.
- **The confirmation gate — `identity.md`'s "human at the money gate," in code.** Internal, reversible work: do it, then report. **Anything that leaves the business or spends money** (texting/emailing/calling a customer or supplier, spending, deleting): confirm in one line and wait for a yes. This is the trust mechanic, and it is enforced in both `SOUL.md` and `AGENTS.md`.
- **Skills** (`skills/`): `estimate` (gather scope → pull rates from the brain → line items with qty/unit/total → save to `./output/estimates/` → report total, never send unconfirmed), `invoice` (start from the matching estimate, unique sequential invoice number, send behind the gate), and `daily-checkin` (the proactive cadence). Each skill carries its procedure, pitfalls, and a verification checklist — so the agent is consistent, not improvising.
- **The business brain** (`workspace/brain/business-brain.md`, `customers.md`): a working knowledge base that **starts thin and the agent fills in as it works** — pricing/rates, suppliers, standing preferences. The verbatim onboarding answers are stored in the brain as the source of truth; the agent refines structure from them over time.
- **Memory** (`memories/MEMORY.md` business facts, `USER.md` the supervisor model) kept tight; the brain holds the detail.

**The proactive check-ins are part of the product, not an add-on.** Two scheduled sessions fire in the client's local timezone — `0 7 * * *` morning (surface the one or two time-sensitive things, offer the highest-value office work tied to the owner's workloads) and `0 13 * * *` midday (light touch). If there is genuinely nothing worth a text, the agent replies exactly `[SILENT]` and nothing is sent. An honest `[SILENT]` over manufactured urgency is a written rule [S082, S084].

## The provisioning factory — the keystone

`scripts/provision_client.py` turns a finished manifest into a live, isolated, textable employee **in under a minute. The dry run passes clean end to end.** Given a manifest it [S082]:

1. Decides the profile name, workspace dir, webhook host, and a unique port.
2. **Claims a Twilio number from the pool** (`claim_number.py`).
3. Creates the Hermes profile.
4. **Renders the template** — `SOUL`, `USER`, `MEMORY`, `config.yaml`, `.env`, the skills, `AGENTS.md`, and the brain — substituting `{{TOKEN}}` placeholders from the manifest. Unknown tokens are left **visible on purpose** so a bad render is obvious, not silent.
5. Registers the two daily check-in cron jobs.
6. Writes a per-client **Caddy snippet** mapping the subdomain to the port.
7. Installs and starts the per-client gateway as a service, with `TZ` set so check-ins fire in local time.

**Intake is deterministic by default.** The seven raw onboarding answers map to manifest fields with a simple, no-AI mapping (raw answer → primary field; the agent learns the rest from its brain), and the raw answers are stored verbatim so nothing is lost. An **optional** `--enrich` flag routes the answers through an LLM (Grok 4.3 by default; any JSON-capable model) for a clean up-front field split — and **fails open** to the deterministic map if it errors, so enrichment can never block a provision [S082]. Keep it off until the cleaner split earns the dependency.

The Twilio pool is lazy and self-healing: a number is "free" when its inbound `SmsUrl` isn't pointed at a client webhook; claiming points it at the client's webhook and records it; whenever fewer than two free numbers remain it tops up to four, so the next provision never blocks. The onboarding "front door" number is held on a **reserved list** the pool never recycles [S085].

> **One contrast worth holding:** the older wiki credited the `codegraphtheory/hermes-profile-template` *prompt-to-repo* system (S060–S062) as "the factory." That repo is real, but it is **upstream authoring tooling** (it scaffolds full profile/skill repos with validation, CI, distribution contracts). The current `mvp-build/` implementation borrows that discipline — profile packages, params, distribution metadata, validation before runtime start — but the claim path does **not** run a prompt-to-new-profile-repo authoring loop. Ground truth for "how a client comes to life today" is: select a registered AMTECH profile package, render it deterministically from the onboarding manifest, validate it, then start the Hermes runtime. The authoring template is how AMTECH manufactures new vertical packages and custom skills **before** they are registered for provisioning, not how every claimant is stamped.

## The two onboarding doors — the funnel front door

Both doors converge on the exact same tail — `buildManifest → persistClaim → triggerProvision` — and differ only in **how phone ownership is proven** [S083]:

- **Web door — `amtechai.com/claim`.** One page: the seven business questions, the supervisor's name, what to call the agent, the timezone, and a consent checkbox. The phone is verified **inline, once**, with a **Twilio Verify** code (`netlify/functions/claim.mjs`). On an approved code the function builds the manifest, writes a consent/claim record in Supabase, and posts the manifest to the authenticated provision hook on the host. No second code, no SMS back-and-forth.
- **SMS text-in door — text a keyword to the AMTECH onboarding number.** An inbound SMS *is* proof of phone ownership. `sms-entry.mjs` validates the `X-Twilio-Signature`, matches the keyword (`AI EMPLOYEE` and variants), and mints a short-lived, **single-use, HMAC-signed claim link** (`https://amtechai.com/claim?t=<token>`). The claim page validates the token, **locks the phone field, and hides the verification step** — the inbound signature already gave the same guarantee Verify would. Everything after is identical to the web flow. The manifest records `verification.method` (`twilio_verify` | `sms_inbound`) and `consent.channel` (`web` | `sms`) for a clean A2P/TCPA record.

**The seven-question contract** (each question deliberately captures more than one fact): the business (name + what it does + how long), the team (headcount + roles), the repeat computer work that wastes the most time, the tools in use, the money shape (revenue band + typical job), the ideal customer, and the friction customer. Plus supervisor name, agent name, timezone, consent. `claim.mjs` and `provision_client.py` both encode this contract and **must stay in sync** [S083].

> **Current implementation caveat for the funnel.** In `mvp-build/`, the SMS and web front doors now route to the same LLM-only onboarding orchestrator, persist the transcript/manifest draft, and converge on account setup + `provision_employee`. The code path exists, but live acceptance still depends on real Supabase, Twilio, Hermes, Caddy, and provisioner environment. The first registered profile package is `contractor_estimator`; the platform model is package-based so later employees are not locked to contractors.

## The security boundary (the real one)

The provisioned agent has **shell and file tools**. So the boundary is not a nicety [S081, S085]:

- **The `X-Twilio-Signature` check is the boundary — not the phone allowlist.** The allowlist (`SMS_ALLOWED_USERS`) trusts the spoofable `From` field; the signature proves the request genuinely came through AMTECH's Twilio account. Keep `SMS_WEBHOOK_URL` set to the exact public URL Twilio signs, and **never** set `SMS_INSECURE_NO_SIGNATURE` outside local debugging.
- **Contain the shell.** The template ships `terminal.backend: local` for first pilots; switch to `docker`/SSH/VM-style isolation once past them so each client's tool execution is sandboxed. `terminal.home_mode: profile` separates CLI home/credentials, but does not by itself prevent filesystem access on the local backend [S087].
- Run a current Hermes (the signature validation lives there), and register an A2P 10DLC brand/campaign (or use a toll-free number) before any volume so carriers don't throttle the agents' outbound texts.

## The core thesis: the work improves as the models improve

Because the deliverable is produced by the model + agent scaffolding, **the quality of every installed Employee rises as the substrate improves — at flat price and flat COGS.** Unlike most software a business buys — as good as it will ever be the day it's installed — the Employee compounds. (The contrast is with *static tools*, not with people; people get better too. The owner-facing value is **time back**.) Consequences that govern everything else:

- **Get installed early.** The value is the packaging + the *loaded context* (pricing, email, Drive, approval rules). Installing now means the customer accumulates their business brain and rides the capability curve from inside.
- **Rent the intelligence; own the packaging.** Stay model-agnostic so AMTECH can swap the brain underneath and **absorb model drift *for* the owner** — itself a selling point.
- **The moat is everything between the raw model and the contractor:** business brain, connectors, approval/trust UX, the SMS interface, the vertical skill, the local relationship. The gap between "frontier capability exists" and "a 55-year-old painter has it reliably running his office" is the permanent business.

## The Skills registry — wedge *and* supply chain

AMTECH's public Skills are signed, cataloged, and agent-readable. Four are published: OKF Audit, Knowledge Graph Builder, **Estimate**, and Article Research Writer [S057]. Skills serve two roles: a **wedge product** a buyer uses (and pays for) before trusting an Employee, and the **procedure library** a provisioned Employee loads, reuses, and grows. For the beachhead, the **Estimate skill is the wedge** — the most universal, frequent, money-deciding task a contractor performs; with his pricing loaded it lands within ~5% of what he'd charge, in his document format. That accuracy is the proof point that makes the whole ladder credible.

## The contractor Employee (the beachhead instance)

The first vertical Employee is the **paint/landscape Estimator**, climbing connector by connector. (Prices and the full ladder: [`offers/wedge-offers.md`](offers/wedge-offers.md), [`00-decision.md`](00-decision.md) §4.)

| Stage | Connectors | What the owner experiences |
|---|---|---|
| Custom skill | none (paste context) | Drafts a line-item estimate from inputs he gives it — within ~5% |
| Employee · Starter | SMS number + email | Voice-memos the job → it pulls the customer thread → drafts → he taps approve |
| Employee · Pro | + Google Drive + invoicing | Knows his past estimates/pricing/photos (zero manual context); drafts the invoice from the approved estimate; drafts owner-approved follow-up |
| (later) | + browser-use | Live material lookups, permit/job research — only when the workflow needs it |

`browser-use`, workspace repos, and similar belong to **AMTECH's profile factory**, not a contractor's daily flow. Give the Employee what the workflow needs; resist max-connector sprawl, because every connector is a support surface that can break for a non-technical owner.

## Risk sequencing and the confirmation gate (the sales-facing summary)

- **Safe-to-get-wrong-first (internal, no gate):** drafting estimates, pulling context, organizing job info, research. The owner reviews everything; estimates are line-itemed with visible assumptions and low-confidence flags so review is fast.
- **Behind a one-tap approval gate (anything leaving the business):** sending estimates, invoices, follow-up messages. Nothing leaves without "yeah, looks good."
- **TCPA:** no cold outbound. Customer follow-up only to existing/inbound leads, owner-directed and approved before send.

## Build state — where the real work is

The MVP is **specified** in [`MVP/old-build-plan/`](MVP/old-build-plan/) (the source of truth), gets **built** in [`../mvp-build/`](../mvp-build/), and has factual implementation records in [`MVP/implementation-records/`](MVP/implementation-records/). The whole-product bar is the real owner workflow:

> signup/claim → live employee (SMS + web) → walkthrough-to-estimate conversation → PDF artifact + signed link → approved Gmail send → real Gmail customer-reply event → approved Stripe Connect test-mode deposit invoice/payment link → internal reminder.

Stripe may run in provider test mode, but Gmail replies and Stripe invoice/payment events must travel through **real provider rails** — a manually injected provider result is not MVP acceptance. The build is sequenced into six milestones in [`MVP/old-build-plan/01-mvp-scope-and-milestones.md`](MVP/old-build-plan/01-mvp-scope-and-milestones.md): **(M1)** account/onboarding/employee claim, **(M2)** estimate brain + PDF artifact, **(M3)** Gmail send + reply listener, **(M4)** Stripe Connect deposit invoice, **(M5)** job commitment + reminder, **(M6)** pilot hardening.

**Current implementation record:** as of 2026-06-29, [`MVP/implementation-records/2026-06-29-phase-0-2-record.md`](MVP/implementation-records/2026-06-29-phase-0-2-record.md) records Phase 0/1/2 code wiring in `../mvp-build/`: front-door onboarding/account/provisioning, owner web/SMS runtime routing, Manager-backed estimate artifacts, private Supabase Storage links, approvals, and Gmail consent/draft groundwork. Provider-backed acceptance remains pending until real Supabase/Twilio/Hermes/Caddy credentials and runtime proof are present.

**Design lessons that carry forward** (proven in the earlier prototype, now folded into the spec): the per-client factory pattern — manifest → claim number → create profile → render the template → start the gateway — stamps a live, isolated, textable employee in under a minute; intake is deterministic by default with optional LLM enrichment that fails open; the Twilio pool is lazy and self-healing with the onboarding number reserved; and the agent must send a **provision-time "I'm live" text** (an early gap the spec now makes a required provisioning step — see [`MVP/old-build-plan/07-provisioning-runtime.md`](MVP/old-build-plan/07-provisioning-runtime.md)).

## Messaging discipline

Use this as the product promise:

> "AMTECH gives your business a textable AI employee. It has its own number, knows your pricing and your way of working, prepares the work, and asks for your approval before anything leaves the business — and it gets better on its own as the AI improves."

Avoid as a first promise:

> "Fully autonomous AI that runs your whole business."

The first is credible and closeable to an AI-naive owner. The second triggers fear and scope creep. The how-it-works page's broader "AI Brains / many roles" language [S053] is long-term expansion vocabulary, not the first sale. The durable difference from ChatGPT is **business ownership of a recurring workflow** — right inputs, records, skills, approvals, artifacts, accountability [S055] — packaged so a non-technical owner never has to assemble it.

---

_Strategic arc this product enables: [`strategy-4-year-implications.md`](strategy-4-year-implications.md). The whole-product wrapper and the customer-facing intake funnel: [`offers/estimator-whole-product.md`](offers/estimator-whole-product.md). The operating principle behind person-minimal provisioning: [`principle-agent-leverage.md`](principle-agent-leverage.md)._
