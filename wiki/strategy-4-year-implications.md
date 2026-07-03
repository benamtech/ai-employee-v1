# Four-Year Business Implications

**Status: active** · _Rewritten 2026-06-29 around the current MVP build, the Work Surface UX research, and current task-based AI-work economics. MVP source of truth: [`MVP/old-build-plan/`](MVP/old-build-plan/), built in [`../mvp-build/`](../mvp-build/)._

## Bottom line

AMTECH is the **Macintosh layer for AI agents**. Hermes/frontier models are the personal-computer substrate: powerful, general, and still mostly legible to developers. AMTECH is the product layer that makes that power usable by an owner-led SMB: a textable employee, a consulting-sales onboarding surface, typed work cards, artifacts, approval gates, connector proof, and a Manager control plane that hides the machinery.

The four-year opportunity is not "build automations for contractors." It is to become the **managed AI-work surface for owner-led businesses**: the place where work formerly stuck in email, forms, invoices, folders, calls, and ad hoc admin becomes supervised, typed, approval-gated agent work.

## The current product fact

The MVP is no longer just a skill ladder. The current `mvp-build/` source state is:

- Front door: `/create-ai-employee` and `/claim`, with a web/SMS onboarding orchestrator that gathers the business brain, then routes to phone verification, account creation, and `provision_employee`.
- Employee surface: owner web/SMS runtime routing, artifacts, approvals, stored messages, connectors, work events, deposit invoices, and reminders.
- Work grammar: `WorkEventDescriptor` converts provider/tool events into `notify | question | review` moves and typed deliverables such as `document`, `outbound_message`, `money_movement`, and `job_folder`.
- Whole-product loop: signup/claim -> live employee -> estimate PDF -> approved Gmail send -> real Gmail reply event -> approved Stripe Connect test-mode deposit invoice -> internal reminder.
- Acceptance boundary: Gmail/Stripe/Twilio must travel through real provider rails. Source wiring is strong; live provider/runtime acceptance is still pending.

That changes the strategy. AMTECH does not have to sell a static skill first and hope the customer later imagines an Employee. The onboarding and work surface can **demonstrate the Employee while diagnosing the business**. The first sale becomes a consulting-sales experience: the owner talks to the Employee-like front door, sees it understand their business, sees a real work object, then either provisions immediately or schedules the human close.

## The economic thesis

Current AI-work evidence points in the same direction as the product:

- AI use is increasingly task-level, not occupation-level. Anthropic's Claude conversation study maps AI usage to O*NET tasks and finds both augmentation and automation use patterns [S095].
- Empirical labor evidence is mixed but no longer hand-wavy: field experiments show meaningful individual time savings without automatic organizational redesign [S097], while broader reviews find productivity gains are context-dependent and substitution signals are strongest in writing/translation and novice work [S098].
- Agentic capability raises exposure from simple content generation toward multi-step work. Task-level exposure work links higher AI exposure to reduced employment, higher unemployment, and shorter work hours in recent CPS-linked analysis [S096].
- The policy debate is moving from "robot tax" as a slogan to automation/compute/task-substitution mechanisms. The 2026 "AI Layoff Trap" model argues that competitive firms may over-automate because each firm captures savings but externalizes demand loss, and that a Pigouvian automation tax directly addresses the incentive [S099]. Compute-tax proposals are now entering mainstream business press [S101].

AMTECH's relevance is the synchronicity: the economy is trying to name and tax **task displacement**, while AMTECH is building a product that measures, packages, supervises, and gates **task delegation**. That is not an argument to sell fear. It is a product-design clue. The unit of value is the typed task/deliverable, not the chatbot session and not the job title.

## Strategic positioning

Do not position AMTECH as replacing workers. The buyer is usually the worker-owner. Position it as:

> "A managed AI employee that takes the repeat computer work off your plate, shows the work, asks before anything leaves your business, and gets better as the models improve."

This keeps AMTECH on the pro-human side of the policy debate:

- It sells time back to owner-operators, not layoffs.
- It makes automation legible and auditable through work-event descriptors, proof IDs, and approval records.
- It complements scarce human judgment: pricing, customer trust, job acceptance, money movement, and final sends stay gated.
- It accumulates the business brain and owner policies that make future agent capability useful instead of chaotic.

## Year 1 — prove the Employee as a whole product

**Focus: contractor Estimator / Office Employee.**

The first-year goal is not 100 disconnected $300 skills. It is proof that a non-technical owner can go from first conversation to a real, supervised worker.

What must be true:

- The onboarding surface feels like the first useful employee conversation, not a form.
- The Employee can produce a real estimate artifact with line items, assumptions, low-confidence flags, signed link, and approval.
- Gmail send and reply detection work through real provider rails.
- Stripe Connect test-mode deposit invoice/send/webhook proof works.
- The owner can resolve routine work in the one-second loop: "Jane accepted Tuesday and the 20% deposit. Send the invoice?" -> "yes" -> proof.
- The first paid pilots generate referenceable artifacts and owner language.

Commercial motion:

- Field-led: call/referral/in-person demo into the consulting-sales surface.
- Product-led: owner lands on `/create-ai-employee`, chats, verifies, provisions, then escalates to a paid setup/consulting call when the work gets valuable.
- Wedge: Estimate remains the first work object because it is frequent, money-proximate, visual, and easy for the owner to judge.

Success metrics:

- 3-5 provider-accepted golden-path demos.
- 6-10 contractor Employees provisioned or seriously piloted.
- 20+ estimate/customization transactions only if they feed Employee learning.
- One stable `contractor_estimator` profile package with a repeatable onboarding/consulting script.

## Year 2 — turn service learning into profile packages

The Year-2 product is a profile library, not a services menu.

Priority packages:

- `contractor_estimator`: estimate -> email -> deposit -> reminder.
- `contractor_office_admin`: follow-up, invoices, review requests, AR chase, job folders.
- `bookkeeping_doc_coordinator`: missing-docs chase, client intake, month-end prep, approval-gated client messages.
- Adjacent trades only after the first package has retention and low support load.

Each package ships with:

- SOUL/persona and SMS voice.
- Business-brain intake mapping.
- Default deliverable types and approval rules.
- Skills, connectors, cron/check-ins, output examples.
- Work Surface renderer expectations.
- Provider proof requirements.
- Support/repair playbooks.

The moat becomes the **profile package + typed work grammar + Manager control plane**. Hermes and models keep improving underneath; AMTECH converts those improvements into owner-safe work.

## Year 3 — own the work surface across verticals

Year 3 is where AMTECH becomes less contractor-specific and more obviously a platform:

- One owner can supervise multiple Employees from one Work Surface.
- Jobs become durable folders: estimate, thread, deposit, payment, reminder, crew packet, follow-up.
- Repeatable work earns standing approvals where safe, while money/external sends remain gated forever.
- More connectors become event senders into the Employee inbox: Drive, Calendar, QuickBooks, CRM, supplier sites.
- The catalog grows by adding deliverable types and profile packages, not by hand-designing screens for every skill.

Distribution should start shifting from founder calls to proof, referrals, local partners, and vertical-specific landing flows, but only after direct retention is real.

## Year 4 — managed AI workforce for owner-led SMBs

The Year-4 product vision:

- A catalog of vertical AI Employee profiles.
- A standard Work Surface where every task appears as a typed, previewable, approval-gated work object.
- A Manager layer that handles provisioning, connectors, repair, lifecycle, entitlements, drift absorption, and org-level handoffs.
- SMS as the ambient inbox, web as the rich work surface, voice as the field surface.
- AMTECH-managed model/runtime upgrades that make every installed Employee better without the owner learning new software.

This is the Macintosh analogy made concrete: the leap is not that computers/agents exist. The leap is a consistent interface contract that lets ordinary operators trust and manage them.

## Strategic risks

1. **Self-serve agent commoditization.** If raw agent platforms become easy, simple workflows get commoditized. Counter: keep moving up the stack into business brain, connectors, approvals, proof, repairs, and owner relationship.
2. **Support burden.** A textable worker with provider credentials can create incidents. Counter: typed gates, audit, proof IDs, repair commands, sandboxed runtime, and narrow Manager tools.
3. **Over-automation narrative.** Macro policy may frame AI work as labor displacement. Counter: sell owner time back, supervision, auditability, and human judgment; avoid "replace staff" language.
4. **Provider acceptance gap.** Source wiring is not market proof. Counter: do not claim MVP completion until Gmail/Twilio/Stripe/Supabase/Hermes proof exists.
5. **Vertical sprawl.** Profile packages make new verticals tempting. Counter: one retained profile before the next.
6. **Pricing incoherence.** Self-serve provisioning is free-by-default in the MVP while field sales has setup/monthly pricing. Counter: keep entitlements scaffolded but treat monetization as a tested motion, not a build assumption.

## The judgment

AMTECH should spend four years building the interface, management, and trust layer for agent work inside small businesses. Skills are still important, but as the **procedure supply chain** and first proof object. The recurring value is the installed Employee and the typed Work Surface that lets an owner supervise real work in seconds.

The operating cadence:

1. Land with one painful work object.
2. Use onboarding as diagnosis and demo.
3. Provision the Employee early.
4. Produce artifacts and provider proof.
5. Convert repeated work into skills, profile-package updates, and standing policies.
6. Expand across lanes only when the owner has felt the last one.

That is how AMTECH compounds: each customer builds the profile library, each task enriches the work grammar, and each model/runtime improvement makes the installed workforce more useful.
