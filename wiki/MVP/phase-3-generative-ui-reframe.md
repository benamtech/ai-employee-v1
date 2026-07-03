# Phase 3 Generative UI Reframe

Status: active

Date: 2026-06-29

Purpose: keep Phase 3 implementation aimed at the real product breakthrough: turning remote computer work, agent events, and provider events into a humane, typed work interface that a non-technical owner can manage in seconds. This note distills [`old-build-plan/14-agentic-tooling-research-notes.md`](old-build-plan/14-agentic-tooling-research-notes.md), [`old-build-plan/15-interaction-reimagined-the-work-surface.md`](old-build-plan/15-interaction-reimagined-the-work-surface.md), [`../principle-graph-materialization.md`](../principle-graph-materialization.md), and [`../principle-deliverable-driven-surfaces.md`](../principle-deliverable-driven-surfaces.md) into the Phase 3 build posture.

## The Reframe

Do not implement Phase 3 as Gmail tools plus a few UI fields.

Implement Phase 3 as the first real proof that AMTECH can turn an event from the outside world into managed work:

```text
provider/Hermes/tool event
  -> Manager-normalized fact
  -> AMTECH work event
  -> typed deliverable or decision
  -> SMS/web rendering
  -> owner approval/edit/response
  -> provider-backed proof
```

The strategic point is larger than Gmail. The owner is not learning a tool. The owner is managing work remotely through a computer, where the computer increasingly contains agents that can plan, act, ask, show, revise, and remember. AMTECH's surface is the management layer for that work. It should be event-first, task-first, and experience-first, never tool-call-first.

## What Generative UI Means Here

Generative UI does **not** mean the model emits arbitrary screens.

For AMTECH, generative UI means:

- The agent selects and fills a **pre-approved typed component**.
- The component is chosen from the deliverable or work-event type.
- The renderer is deterministic and tested.
- The owner sees the same interaction grammar every time.
- The model can generate content and structure inside the contract, but it cannot surprise the owner with a new UI pattern for a money or customer-facing action.

This is the useful synthesis of S090-S094:

- **Static/declarative first.** Use typed, known components for cards, previews, tables, approvals, receipts, and repair prompts.
- **Open-ended UI later, rarely.** Raw markup belongs in experiments and internal tools, not the painter's money gate.
- **Conformance over novelty.** A generated UI artifact is acceptable only if it conforms to the type contract, safety gates, surface limits, and proof requirements.

In practice: "Jane replied..." should become a `question` card with reply context, proposed next action, artifact/job refs, and an approval path if it leads to invoice/email. It should not become a raw email webhook dump, a Gmail object viewer, or a generic chat paragraph with hidden state.

## The Small Contract To Add

The current code already has `NormalizedEvent` and employee-message delivery. The next useful seam is not large:

```ts
type WorkMove = "notify" | "question" | "review";

type DeliverableType =
  | "document"
  | "outbound_message"
  | "money_movement"
  | "dataset_report"
  | "recommendation"
  | "schedule_mutation"
  | "structured_record_write"
  | "media_asset"
  | "job_folder"
  | "external_system_action"
  | "plan";

interface WorkEventDescriptor {
  account_id: string;
  employee_id: string;
  source_event_id?: string;
  move: WorkMove;
  title: string;
  summary: string;
  deliverable?: {
    type: DeliverableType;
    title: string;
    refs: Record<string, string>;
    leaves_business?: boolean;
    money?: { involved: boolean; amount_cents?: number; currency?: string };
    reversible?: boolean;
    acceptance: Array<"approve" | "edit" | "reject" | "respond" | "acknowledge">;
  };
  suggested_next_action?: string;
  proof?: Record<string, string>;
}
```

This can start as a shared TypeScript type plus a renderer helper. It does not require a new runtime. It sits above:

- `packages/shared/src/event-types.ts`
- `apps/manager/src/lib/employee-events.ts`
- `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- Manager approval tools and artifact records

## The 1-Second Loop

The signature interaction is not "chat with an AI." It is:

```text
employee: Jane wants Tuesday 9:30 and accepted the 20% deposit. Send the $840 deposit invoice?
owner: yes
employee: Sent. Stripe invoice in test mode: in_...
```

That loop can happen over SMS, web, or voice because the decision is one Manager approval / response record, rendered three ways. The UI artifact should be shaped so the owner can decide in roughly one second when the work is routine:

- one-line business meaning first;
- exact payload or amount visible before approval;
- obvious edit path for corrections;
- quiet provider proof after action;
- no raw tool names, JSON, stack traces, scope jargon, or Gmail/PubSub vocabulary.

The faster the loop, the more valuable the employee becomes. But speed only earns trust when the gate is structurally correct.

## Long Tasks And Customer Lifecycles

Weeks-long work should not be represented as a long chat transcript. It should be represented as a durable work object:

- a **job folder** for the Smith repaint;
- a thread of events: estimate, email, customer reply, deposit invoice, payment, reminder, crew packet, follow-up;
- current state and next action;
- proof receipts;
- standing policies for which repeated actions can run quietly and which stay gated forever.

This is the larger product insight: agents make computers good at carrying work across time. The UI should expose the state of the work, not the state of the tool calls. Chat remains an input/output channel, but the durable object is the task, job, deliverable, or lifecycle.

## Conformance Tests

Generative UI must be test-driven enough that a future agent cannot accidentally ship a surprising money gate.

Minimum Phase 3 test shape:

- Gmail reply fixture -> `WorkEventDescriptor` with `move: "question"` and no raw provider payload in owner text.
- Outbound email draft -> `deliverable.type: "outbound_message"` and `leaves_business: true`.
- Deposit invoice intent -> `deliverable.type: "money_movement"` and approval required.
- Any `leaves_business` or `money.involved` descriptor without an approval path fails.
- SMS renderer produces a short plain-English line plus link or yes/no prompt.
- Web renderer produces a card using the same descriptor and same approval id.
- Duplicate provider events do not create duplicate work events or owner prompts.
- Proof fields survive rendering: Gmail message/thread/history id, Twilio SID where sent, artifact id/link, approval id.

The standard is not visual novelty. The standard is repeatable, inspected, owner-safe work.

## Phase 3 Decisions

Build the next slice this way:

1. Keep Gmail OAuth/send/watch/history focused on provider proof.
2. Convert Gmail reply normalization into a `WorkEventDescriptor`, not just an `employee_messages.body` string.
3. Render the same descriptor in SMS and web.
4. Add the first typed deliverables beyond the estimate document: `outbound_message` and, as Phase 4 begins, `money_movement`.
5. Treat connector setup as a work event too: "Gmail connected, test passed" or "Gmail needs reconnect," with proof and repair action.
6. Keep the raw Manager and Hermes surfaces invisible to the owner.

This is small enough to build now and large enough to become the platform grammar.

## Carry-Forward Law

Every future MVP implementation decision should ask:

> What is the work object, what type of deliverable or decision did it produce, what must the owner understand in one glance, what can they approve or edit, and what real proof shows the computer did it?

If a feature cannot answer that, it is probably still a tool call, not yet an AMTECH work surface.
