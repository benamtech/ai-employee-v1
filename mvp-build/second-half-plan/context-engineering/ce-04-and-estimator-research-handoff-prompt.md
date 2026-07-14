# Handoff prompt — finish CE-4, then research the estimator "product limits" test

Status: handoff (authored 2026-07-12). Copy the block below into a fresh session.

---

You are the lead of AMTECH AI. This session has two goals, in order: **(1) finish CE-4** (connector-agnostic
capabilities + operator modes), then **(2) research and plan a "product limits" test** — building an
estimator AI employee served as a public web form. Grounding first.

## Ground yourself (do this before anything)

1. Read and **embody** `identity.md` (Ogilvy · Paul Graham · psycho-cybernetics · AMTECH spirit). Not
   optional — behavior follows self-image.
2. Read `CODEGRAPH.md` (workspace map) and `mvp-build/CODEGRAPH.md` (MVP source map) — §3 "Current status"
   is the truth of what's built. Read `mvp-build/CLAUDE.md` (build-home rules, Realness Rules).
3. Read the newest CE dev handoffs: `mvp-build/memory/2026-07-12-2330-ce2-ce3-production-implemented.md`
   then `...-2219-ce1-...md`, and `mvp-build/memory/MEMORY.md`. Then the CE workstream:
   `mvp-build/second-half-plan/context-engineering/README.md` and the authoritative spec
   `phase-ce-02-03-production-implementation-plan.md`.

**State you're inheriting:** CE-1/CE-2/CE-3 are `source-wired`; migrations `0029`/`0030` are applied +
verified live. Local baseline green: `npm run typecheck && npm run test:unit` (87 files / 543 tests) `&&
npm run build && npm run lint && npm run plugins:test` (10/10). The CE-2/CE-3 branch
`worktree-ce2-ce3-production` is committed but **unpushed** (repo rule: no push without an explicit ask).
Still `pending`: live-Hermes hook/compression/rotation proof + reprovisioning employees to pick up the new
config/plugin (needs the Docker/Hermes stack).

**Doctrine (do not violate):** references over payloads; prime once per session (re-prime only on
rotation); **stay as-powerful-as-Hermes — add awareness, never nerf** (the runtime is very capable OOTB;
the management layer must not get in its way); model/tool-agnostic (model metadata enters CE only via
`packages/shared/src/model-context.ts` as a capability input, never a behavior branch); money/customer
actions stay Manager-mediated behind the approval gate; **Realness Rule** — no status upgrade without real
proof, mocks only in `tests/unit/`. Work in a worktree; don't push/PR without an explicit ask.

## Task 1 — finish CE-4 (connector-agnostic capabilities + operator modes)

Spec: `second-half-plan/context-engineering/phase-ce-04-connector-agnostic-and-operator-modes.md`. Build it
**to the extent it makes sense** (source-wired + locally green; live gates stay pending). The two real gaps
per the spec:
1. **Capability routing is hardcoded per tool** (`lib/capability-registry.ts` enumerates Gmail/Stripe/QBO
   by name). Generalize so a connector's capability nodes + connection surfaces derive from **metadata**
   (category, read/write, connected state) — a new MCP connector should appear in the capability graph,
   Connected surface, resurfacing, and the agent primer with **zero bespoke UI**. `deriveConnectionSurfaces`
   in `lib/employee-stream.ts` already has a generic "custom" path; make the capability graph follow.
2. **Custody policy per connector:** a declarative rule — **read-only** connectors may be direct-MCP
   (rendered into `config.yaml` `mcp_servers`); **write/money/customer-facing** connectors stay
   **Manager-mediated** (custody + approval gate + audit), the QuickBooks posture. Enforce at
   provision/render time (`profile-renderer.ts`) and reflect it in the primer's "what you can do" framing.
3. **Operator-mode + business-type context policy (seam only):** express CE-1 primer emphasis / CE-2
   compression defaults / CE-3 rotation thresholds as policy keyed by business type + operator mode ("solo
   owner" vs "owner + secretary"). Leave the roles/delegated-permissions seam; **do not build roles** here.

Acceptance (source-wired): a fixture read-only MCP connector appears end-to-end with no per-tool code; a
write/money connector is refused a direct-MCP path; primer/compression/rotation vary by a fixture
business-type + operator-mode policy. Note CE-4's own caution against premature generalization — but you now
have real second/third connectors (Stripe/QBO) **and** Task 2 gives a genuine second *profile package* to
generalize against, so generalize against those, not invented ones.

## Task 2 — research & plan the estimator "product limits" test (the main event after CE-4)

This is a **research project**, not a commitment to implement. Deliverable: a grounded understanding + a
plan/research doc (in `second-half-plan/`), and an honest verdict — **you may reach a different
conclusion.** Durable memory: `estimator-form-product-limits-research` (in the user's project memory).

**The scenario to work out from first principles against our actual code + infra:** an AI employee served
through a **generic OpenAI-compatible React/TypeScript multimodal chat** (e.g. OpenUI / open-webui style),
rendered as a **website estimator form**. It guides a visitor: (a) collect basic contact info, then (b)
conversationally gather all estimate details, **accepting pictures**, using context/skills we give it where
the **estimate logic is re-derived from first principles from the form data** (not the back-office estimate
skill), and (c) return an **official estimate rendered on-site as styled HTML + a downloadable PDF**. A
**contractor mode** lets the form-owner set a T+M rate, materials surcharge, and other-fee notes — and
because of Hermes's nature that is **just extra notes appended shortly after contact info, needing no
special configuration**. Here the **"owner" is the form's user**, and **each visitor is a separate
session**.

**The thesis to test (why this is illuminating):** it's the **same software** (Hermes employee + invisible
Manager + materialization/Work-surface + approval gates) used for something **completely different** (a
public, per-session, form-shaped estimator instead of a persistent back-office employee). By researching
**our own codebase + infra capabilities** to work out exactly how we'd stand up this employee type, notice
what it reveals about the **true nature of the product** and how far it already is (or isn't)
**tool-agnostic** and capable of a **proactive UX** — whether the moment is onboarding or "starting the day"
in the office (or out of it).

**Research questions to answer from the code (cite files):** How does an employee get served over a generic
OpenAI-compatible chat surface vs our web/SMS surfaces? What is a "session" here and how does per-visitor
session isolation map to `runtime_endpoints` / `employee_sessions` / the turn queue / channel router? How
would multimodal (pictures) enter — ingress, artifacts, Hermes tools? How is the styled-HTML + PDF estimate
materialized (artifacts, `artifact-view.ts`, signed links, `buildWorkResource`)? What in provisioning /
profile-package / `SOUL.md` / skills would we reuse vs re-derive for a first-principles estimator, and does
"contractor mode = extra notes" really need no config? Where do CE-1..CE-4 (native memory, primer,
rotation, connector-agnostic capabilities, operator modes) map onto this per-session form employee? What
does this say about the product being **one materialization layer over Hermes** serving many shapes?

**Method:** read-only research of `apps/`, `packages/`, `infra/`, the `wiki/MVP/` design docs, the active
UX system at `docs/ux/`, and the active owner UI packet at `ui-redesign/`; use subagents for broad sweeps
and keep only findings. The archived `docs/archive/ui-handoff-2026-07-14/` packet may be checked for
provenance, but it is not the current UI direction. Then write the plan/research doc + a short "what this
reveals about the product" section. Ground every claim in a file you read.

## Wrap-up

Update `mvp-build/CODEGRAPH.md` §3 + a dated `mvp-build/memory/` handoff for CE-4; add the estimator
research doc + a memory pointer. Run the full baseline before claiming done. Do not push/PR unless the user
explicitly asks.
