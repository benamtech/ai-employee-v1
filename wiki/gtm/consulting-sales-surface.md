# Consulting-Sales Surface — How The Employee Sells Itself

**Status: active** · _Created 2026-06-29. This is the GTM update implied by the current MVP build and Work Surface UX research. Source of truth for product capability remains [`../MVP/old-build-plan/`](../MVP/old-build-plan/) and [`../../mvp-build/`](../../mvp-build/)._

## The shift

The old GTM assumed:

```text
free skill demo -> $300 custom skill -> later, maybe, connected AI Employee
```

The current product supports a stronger motion:

```text
first conversation with the Employee-like front door
  -> diagnosis of the owner's real work
  -> one visible work object
  -> account/phone/email setup
  -> live Employee
  -> consulting close around the next painful loop
```

The Estimate skill remains the wedge, but the **surface** that sells it is no longer just a founder-run demo. It is a loaded onboarding and consulting-sales experience that behaves like the future Employee: it asks naturally, remembers the answers, produces structured work, routes the owner into account setup, and escalates when human trust/price judgment is needed.

## What the surface must prove

The first interaction must show four things in order:

1. **It understands the business.** The owner talks normally; the front-door orchestrator structures the business brain instead of forcing a form.
2. **It knows what work matters.** For contractors, it identifies estimates, follow-up, invoices, deposits, reminders, and customer communication as the real office loop.
3. **It can materialize work.** The first object should be an estimate draft, intake summary, work-event card, or proof-backed next step, not marketing copy.
4. **It knows the gate.** Anything leaving the business or touching money requires approval. This is the trust signature, not a compliance footnote.

That is the consulting sale: diagnose pain by doing a small piece of the work in the same interface that will later run the business loop.

## The two sales paths

| Path | Entry | What happens | Human role |
|---|---|---|---|
| **Field-led** | Call, referral, in-person demo | Founder gets the owner into the front-door flow or runs it live on a real job. The surface captures the brain and produces/frames the first work object. | Founder closes trust, price, and scope. |
| **Product-led** | `/create-ai-employee`, `/claim`, SMS keyword | Owner chats, verifies phone/email, provisions a free/default-allow Employee, and sees the Work Surface. | Founder enters when the agent detects high-intent pain or schedules a call. |

These are not separate funnels. They are two doors into the same Employee relationship.

## The revised ladder

| Rung | Buyer experience | Commercial purpose |
|---|---|---|
| **0 — Consultative first work** | "Show me a job you're quoting." The front door/founder produces a useful work object and diagnoses the business loop. | Build trust and reveal pain. |
| **1 — Tuned work package** | Estimate skill tuned to pricing, format, materials, and owner rules; now represented as a reusable profile/skill update. | Paid discovery; business-brain capture; switching cost. |
| **2 — Live Employee** | Own SMS/web surface, artifacts, approvals, Gmail send/reply, Stripe deposit, reminders. | Recurring product; real time-back. |
| **3 — Managed office loop** | Job folders, follow-up, invoices, reviews, AR, scheduled briefs, more connectors, standing policies. | Retention and expansion. |

Rung 1 can still be sold as "$300 to tune your estimate," but internally it is not a one-off artifact. It is the supply-chain step that improves the `contractor_estimator` package and this customer's business brain.

## Escalation logic

The front-door/onboarding agent should escalate to a founder call when it sees:

- a real current job to quote;
- pricing/markup/materials confusion;
- owner pain around estimating at night, missed follow-up, slow deposits, or hiring an office person;
- a request to connect Gmail/Stripe/Drive;
- a money/customer-facing task the owner wants handled repeatedly;
- explicit buying language.

The founder does not need to explain the whole platform. The surface has already shown the product. The call is for trust, terms, price, and which loop to solve first.

## What to say

Use:

> "Let's set up the first version of your AI employee and point it at one real office loop. It will draft the work, show you exactly what it made, and ask before anything leaves your business."

Avoid:

> "Buy this AI skill and later we can talk about an AI Employee."

The skill is a proof object. The Employee is the relationship.

## Build implications for GTM

- Keep `/create-ai-employee` as the primary self-serve entry, but make it feel like an employee conversation, not a form.
- Every outbound script should drive to a real job/work object, not a generic demo.
- Every demo should end with one of three next steps: tune the estimate, provision the Employee, or schedule a founder call.
- Every provider-backed capability should leave proof: artifact id, approval id, Gmail id, Twilio SID, Stripe invoice id.
- Product-led provisioning can stay free-by-default in the MVP; pricing is tested around the managed loop, not hardcoded into account creation.

## Success metrics

Track the funnel by work objects, not only calls:

- first conversations started;
- real jobs/work objects submitted;
- business brains completed;
- Employees provisioned;
- estimate artifacts created;
- approvals resolved;
- provider-proof loops completed;
- founder calls scheduled from the surface;
- tuned work packages sold;
- live Employees retained.

The metric that matters most for the new GTM is: **how many owners experienced a real work loop before the founder asked them to buy?**
