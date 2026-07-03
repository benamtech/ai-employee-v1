# The Event-Driven AI Office — Message-to-Agent Flow, Generative UI So Far, and the Frontier

Status: active · Date: 2026-06-29

Forward design + product-state review. It reconciles what is **built in `../../mvp-build/`** (Phase 5 record:
[`implementation-records/2026-06-29-phase-5-and-work-surface-record.md`](implementation-records/2026-06-29-phase-5-and-work-surface-record.md))
with the mechanics in [`old-build-plan/09-event-mesh-v1.md`](old-build-plan/09-event-mesh-v1.md) +
[`old-build-plan/14-agentic-tooling-research-notes.md`](old-build-plan/14-agentic-tooling-research-notes.md), the UX research in
[`old-build-plan/15-interaction-reimagined-the-work-surface.md`](old-build-plan/15-interaction-reimagined-the-work-surface.md)
+ [`phase-3-generative-ui-reframe.md`](phase-3-generative-ui-reframe.md), and the type system in
[`../principle-deliverable-driven-surfaces.md`](../principle-deliverable-driven-surfaces.md).

It does **not** rewrite the build-plan (source of truth). For *sequencing*, it supersedes the phasing in doc 15 §8
and principle §11: we shipped the rendered Work-Surface components ahead of the live event path, so the remaining
arc re-sequences (§7). The big idea the user is driving toward — **an entire office running through one AI employee** —
is an event-management problem first and a UI problem second; this doc works out both.

---

## 1. The thesis — the office is an event bus with one employee on it

A real office is a stream of events from many systems: an email reply, a paid invoice, a booked job, a new lead in a
form, a supplier's "back in stock," a contract e-signed, the clock hitting 7am. Today a human secretary is the router:
events land on her desk, she decides what matters, does the safe parts, and asks the owner about the rest.

**AMTECH's product is that router, as an AI employee.** Every connected system, webhook, and timer becomes a
**message to the agent**; the employee reasons over it against the business brain; it turns the event into
human-meaningful work — *notify / question / review* — and the owner supervises **one coworker**, not twelve dashboards.
The whole office runs through the employee when *any* event source can notify it and it can act within a trust gate.

So the architecture has two halves that meet at the employee:

```
  INPUT (event management)                 OUTPUT (generative UI)
  any system → message-to-agent  →  EMPLOYEE  →  typed work events → surfaces → owner gate
  (doc 09/14: the event mesh)      (reasons)    (doc 15 + principle: the Work Surface)
```

Generative UI (the right-hand side) is only as good as the event flow that feeds it. We built a strong right-hand side
first; the left-hand side — the **message-to-agent event bus** — is the frontier that turns a demo into an office.

---

## 2. The canonical event lifecycle (the spine to build to)

Every event, from any source, should travel one path. Stages map to existing specs and code:

```
1. INGRESS          any source: provider webhook (Gmail/Stripe/Twilio), connector push,
                    inbound SMS, cron/clock, customer form, future system
2. VERIFY           per-source authenticity: OIDC JWT (Pub/Sub), Stripe-Signature,
                    X-Twilio-Signature, OAuth state  ............................ [10, 14 Provider Strategy]
3. NORMALIZE        provider payload → a small STRUCTURED FACT (safe summary, refs,
                    account/employee/estimate linkage); never raw bodies  ....... [09 Event Delivery Rules]
4. DEDUPE/IDEMPOTENT key by provider id; store an event trace  .................. [09 Idempotency; 14 D]
5. TRIAGE           cheap tier (rules / haiku) decides: notify · batch · ignore ·
                    repair-queue (unknown mapping)  ............................. [14 §B, §E]
6. ROUTE            (a) deliver_only — trusted literal fact, zero-token templated line
                    (b) MESSAGE-TO-AGENT — wake the employee (Hermes run/session) with a
                        compact structured payload + brain/artifact context  .... [09 line 65; 14 §A,§E]
7. REASON           employee judges relevance, drafts the owner-facing line in its voice,
                    may propose or execute gated tools (set reminder, draft invoice)
8. EMIT             one or more typed WorkEventDescriptors (notify/question/review +
                    deliverable type + acceptance)  ............................. [phase-3 reframe; principle §2]
9. PROVE + RECORD   Manager stores provider proof, audit, delivery state
10. RENDER          SMS line + Work Surface card; same descriptor, two surfaces  . [15 §4; principle §6]
11. RESPOND         owner: approve · edit · reject · respond → resolves the gate
12. ACT → (events)  the resolved action runs, leaves proof, and may itself emit new events → back to 1
```

The loop is **recursive**: an approved send produces a `reply_received` event later; a paid invoice produces a
`set-a-reminder` question; a fired reminder is itself an event. An office is this loop, running on many sources at once.

---

## 3. Where we are — built, honestly (the deliver_only half)

**Backend (`apps/manager/src/`).** The shared delivery primitive `lib/employee-events.ts → deliverEmployeeEvent`
implements stages 3–4, 9–10 for the known sources: it dedupes on `inbound_events`, persists a normalized event +
a `to_owner` `employee_messages` row, sends the owner SMS (Twilio `MessageSid` proof), and writes audit. Two real
ingress pipelines feed it — Gmail Pub/Sub (`webhooks/gmail.ts` → `tools/gmail.stub.ts` history→reply) and Stripe
(`webhooks/stripe.ts → recordAndProcessStripeEvent`) — plus inbound SMS (`webhooks/twilio.ts`). A generic Manager tool
`send_employee_event` exists for *any* normalized event, and Phase 5 added reminder firing as a clock-sourced event
(`dispatch_due_reminders`).

**This is the `deliver_only` path, wired end to end — but the Manager authors the descriptor deterministically.**
The honest gaps against §2:

- **No message-to-agent (Hermes-run) path (stages 6b–8).** `deliverEmployeeEvent` renders the owner line from the
  descriptor (`renderWorkEventSms`); it never wakes the employee to *reason*. Doc 09 line 65 and doc 14 §E call for
  exactly this fork (deliver_only vs. Hermes run); we built only the first branch. So today the employee does not yet
  decide relevance, write copy in its own voice, or chain a next action — the Manager hard-codes it for 3 flows.
- **No triage tier (stage 5)** and **no account-layer batching** (10 events/min → one digest, doc 14 §D/§E).
- **Ingress is per-connector, not a generic registry (stage 1).** Adding a new system today means a new bespoke
  webhook + pipeline, not "register a source + a normalizer."
- **Scheduling is a thin tick, not Hermes Jobs.** `scheduler:tick` drives `dispatch_due_reminders` /
  `renew_expiring_watches`; doc 14 (Phase 5 note) wants Hermes Jobs as the runner with the `reminders` table as source
  of truth. We left that as a named seam.

**UI (`apps/web/app/agent/[employeeId]/`).** The Work Surface renders the descriptors as **fixed typed components** —
`WorkCard` (notify/question/review), per-`DeliverableType` renderers (×11), `JobFolder`, `DailyBrief`, `Receipt`,
acceptance-aware actions + an inline "no, tweak this" feedback loop. But it reads a **polled Manager snapshot**
(`/resources`, refresh-on-action), so:

- **No "doing it now" (stage 7 visibility).** There is no live stream; mid-task progress is invisible.
- **Binding approve/reject lives only on real `approvals` rows.** A work card's money/outbound acceptance is currently
  a "reply/tweak" affordance; the one-tap bound decision appears when the employee creates the real approval.
- **The daily brief is client-computed**, not the doc-15 §4b Hermes Jobs `[SILENT]`-gated digest.

---

## 4. Generative UI — exactly what we implemented, and why it's the safe stage

The generative-UI spectrum [S090]: **static** (agent selects + fills a pre-built component) → **declarative** (agent
returns a typed JSON description of the UI) → **open-ended** (agent emits raw markup). We are deliberately at
**static + typed**, per the conformance reframe ([`phase-3-generative-ui-reframe.md`](phase-3-generative-ui-reframe.md)):
*"the agent selects and fills a pre-approved typed component; conformance over novelty; the owner sees the same grammar
every time."*

What we shipped is the **renderer half** of generative UI, made of three parts:

1. **The typed selector** — `WorkEventDescriptor` (`packages/shared/src/work-events.ts`): `move` (notify/question/review)
   + `deliverable.type` (one of 11) + `acceptance` (approve/edit/reject/respond/acknowledge) + the `money` /
   `leaves_business` / `reversible` flags. This is the principle doc's descriptor, in code.
2. **The fixed component set** — `components/deliverables/` renders one known component per type; `WorkCard` renders the
   move; unknown types fall back safely. The painter is never surprised by a money or customer screen.
3. **The structural gate** — `validateWorkEventDescriptor` rejects any gated deliverable lacking an approval path. The
   gate is a property of the *type*, not the skill author (principle §4/§10) — trust-by-design [S094].

**The crucial nuance:** generative UI in the full sense is *the agent* selecting and filling the component. Today the
*Manager* authors the descriptor for 3 hard-coded flows. So we have the **typed renderer and the safe contract**, but the
**agent-authoring half arrives only with the message-to-agent path (§5 F1/F3)**. Open-ended UI is intentionally out of
scope for this ICP, forever — that is a principled boundary, not a backlog item.

---

## 5. The frontier — new UX frontiers for getting real work done with AI

Ordered as a maturity arc; each unlocks the next. Together they turn the deliver_only demo into an event-driven office.

**F1 — The message-to-agent event bus (the keystone).** Build the generic ingress + the wake-the-employee fork.
*Generic ingress:* a uniform `/events/{source}` registry where each source supplies a verifier + a normalizer, so a new
webhook/connector/cron is "register a source," not a new pipeline. *Wake-the-employee:* when triage says an event needs
judgment, `deliverEmployeeEvent` hands a compact structured payload to the Hermes runtime (a Run/Session message), the
employee reasons against the brain and **emits the descriptor itself** (and may propose a gated next action), and the
Manager records proof. Keep `deliver_only` for literal facts. *This is the single change that lets the whole office run
through the employee* — every system becomes a sender into one inbox. [09 line 65; 14 §A, §E]

**F2 — The live show-your-work stream (Hermes→Work adapter, AG-UI-shaped).** Move the surfaces off the polled snapshot
onto the Hermes Sessions `/chat/stream` (`assistant.delta | tool.started | tool.completed | run.completed`) and Runs SSE
feeds [14 §A]. This lights up "doing it now" (work-verbs, not tool names), mid-task artifact previews, and real-time
approval cards — the ambient, alive feel. The adapter emits an AG-UI-shaped event vocabulary so web, and later third-party
surfaces, stay thin renderers. [15 §2, §5]

**F3 — Declarative, agent-emitted descriptors (generative UI, full form).** With F1+F2, descriptors are emitted by the
reasoning employee over the AG-UI channel, not hand-built per Manager flow. Now a new skill ships UX for free by
declaring its type — the catalog scales without new screens (principle §8). This is the move from "static, Manager-authored"
to "declarative, agent-authored," still inside the fixed contract.

**F4 — Interactive generative UI within the gate (MCP Apps / MCP-UI).** For the types a paragraph can't carry, render real
interactive components [S091]: a **sortable/bulk-accept table** for dataset/report deliverables, a **day/week strip** for
schedule mutations, a **diff** for record writes, a **form** for precise intake. This is the literal "beyond chat" frontier —
*forms, previews, controls, step-feedback* [S090] — always type-selected, always inside the same gate. Additive to the
existing renderers; no rewrite.

**F5 — Triage + batching + the attention economy.** The owner's attention is the real bottleneck. A cheap tier
(rules / `claude-haiku-4-5`) decides notify/batch/ignore; the expensive model wakes only at the point of human meaning;
the account layer batches bursts (10/min → one digest) and dedups across sources [14 §B/§D/§E]. "Getting work done" at
scale is mostly *not* interrupting the owner.

**F6 — Progressive autonomy / per-owner trust calibration (the upsell engine).** Today every event is first-run gated.
The frontier is a stored **(owner × deliverable-type) autonomy policy** the gate consults [principle §6 axis 4, §7;
S093]: reversible, internal work *graduates* to act-then-report after earned trust ("I've sent 6 of these you've okayed —
just send routine follow-ups from now on?"), while **money and customer-facing actions keep a one-line confirm forever**.
This is the deepest "real work" lever — work happening without the human in the loop, safely — and it is the literal
wedge→Employee upsell mechanism and the lock-in (a trained policy can't be exported).

**F7 — Scheduling on Hermes Jobs.** Reminders are the first clock-sourced event. Generalize to a repeatable-task surface
backed by Hermes Jobs (runner), with AMTECH records as source of truth [14 Phase 5 note]; make the daily brief a real
`[SILENT]`-gated Jobs digest [15 §4b].

**F8 — Multimodal renderers + cross-surface continuity.** Voice becomes a third renderer of the *same* descriptors and
move-types (read the verdict, text the artifact); start a job on web, approve over SMS, hear it on a call — one employee,
one event stream, many surfaces [15 §4c; principle §6 axis 5].

---

## 6. What changes for the rest of the build plan (feature review)

| Remaining / future feature | UX-research + built-state verdict |
|---|---|
| **M6 pilot hardening** ([01](old-build-plan/01-mvp-scope-and-milestones.md)) | Partly satisfied: signature checks, OAuth state, token-by-reference, and **watch renewal** (`renew_expiring_watches`) are built. Remaining: webhook **replay-by-event-id** repair command, the broader repair surface (doc 09 §Repair), runtime containment, operator runbook. Fold repair into the generic ingress (F1). |
| **Event mesh beyond Gmail/Stripe** ([09](old-build-plan/09-event-mesh-v1.md)) | The two MVP classes are wired deliver_only. The generalization is F1 (generic ingress + message-to-agent), not more bespoke pipelines. doc 09's repair queue + triage rules become first-class. |
| **Fast-follow connectors: Calendar, Drive** ([13](old-build-plan/13-backlog-non-goals.md)) | Cheap now: each is "connect a tool" (a coworker sentence) + an event source (F1) + a deliverable type that already has a renderer. Calendar upgrades reminders from internal-only to a real `schedule_mutation` write; Drive is a `document` source. No new UI. |
| **Owner-configurable repeatable tasks** ([15](old-build-plan/15-interaction-reimagined-the-work-surface.md) §8 "Later") | Reframed as F6 (trust calibration) + F7 (Hermes Jobs). Reminders are the first instance; this is the upsell engine, so it moves *up* in priority. |
| **Generative UI / voice / multi-employee** (15 §8; principle §11 "Later") | F3/F4 (declarative + interactive UI within the contract) and F8 (voice). Multi-employee adds a "handoff" bundle sub-type — additive to the type system. |
| **Beachhead #2 (bookkeeping doc-sorter)** ([segments/bookkeeping](../segments/bookkeeping.md)) | Inherits the Work Surface for free — `dataset_report`, `structured_record_write`, `document`, and job-folder renderers already exist. It needs a profile package + the doc-sorter skill + its event sources, not new UI. Proof the type system pays off. |
| **Re-sequencing** | doc 15 §8 assumed the live adapter in "Phase 3"; we built the rendered components first against a snapshot. So **F1 (message-to-agent) and F2 (live adapter) move to the front** of the post-MVP queue — the components are waiting for a live event spine. |

---

## 7. The call list (recommended next build order)

1. **Generic event-source ingress + registry** — uniform verify/normalize/dedupe/trace; repair queue for unknown maps. (F1 backend)
2. **Message-to-agent (Hermes-run) fork** in `deliverEmployeeEvent` — wake the employee for judgment events; it emits the descriptor + proposes the gated next action; keep `deliver_only` for literals. (F1 core)
3. **Triage tier + account-layer batching** — cheap notify/batch/ignore; burst collapse. (F5)
4. **Live Hermes→Work SSE adapter** — "doing it now," mid-task preview, real-time approval; surfaces off polling. (F2)
5. **Per-owner trust-calibration policy + standing approvals** — the gate consults (owner × type); money/customer stay gated forever. (F6)
6. **Hermes Jobs scheduler + `[SILENT]` daily-brief digest** — reminders table stays source of truth. (F7)
7. **Interactive generative UI** where the type warrants — dataset table, schedule strip — via MCP-UI. (F4)
8. **Voice renderer.** (F8)

---

## 8. Guardrails that do not move (so the frontier stays pro-human)

- The **gate is a property of the deliverable type**, enforced structurally; money/customer-facing actions never graduate
  past a one-line confirm.
- **One acceptance primitive, many renderings** — SMS "yes," web Approve, voice "send it" resolve the same record.
- **`deliver_only` only for trusted literals**; anything needing judgment wakes the employee. Structured payloads on
  internal hops; plain English only at the owner edge.
- **Secrets by reference**; safe summaries only — no raw email/payment bodies in events or logs.
- **The owner only ever talks to one employee.** Every new event source is one more sender into the inbox the owner
  already trusts — never a new screen to learn. That is "own the agency," made of code.

---

## 9. Update points

- This doc is registered in [`README` index](../README.md), [`../CODEGRAPH.md`](../../CODEGRAPH.md) §4/§6, and the root
  `index.html` `SEED_PATHS`.
- It **supersedes the sequencing** (not the mechanics) of doc 15 §8 and principle §11; both now point here for the current
  forward arc.
- It does **not** modify [`old-build-plan/*`](old-build-plan/) (source of truth). New capabilities land as implementation records
  + (when the bar itself moves) an explicit build-plan revision requested by the founder.
