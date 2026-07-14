# AI-Native Work Surface Research

**Status: active** · _Created 2026-07-14. This is the canonical research note for making AMTECH feel like a new kind of business software: a chat-native operating surface for AI employees, not a chatbot bolted onto dashboards._

## The design problem

The current Work Surface is functional, but the product can still read as **AI chat plus a new dashboard to learn**. That undersells what AMTECH has actually built. The employee can receive business events, reason over tools and context, produce artifacts, ask for approval, leave proof, and continue work across SMS, web, signed links, and admin surfaces. Those are not disconnected dashboard panels. They are pieces of one work environment.

The target is closer to an **operating surface for a business employee**:

```text
business event / owner request / customer input
  -> employee interprets it
  -> work object appears
  -> generated task-specific surface opens when useful
  -> owner approves, edits, or asks in natural language
  -> external action happens
  -> proof returns to the same work object
```

The owner should not have to learn "software." They should learn the relationship: **tell Avery what happened, inspect what Avery made, approve what leaves the business, and trust that proof comes back.**

## Research spine

This is not just a modern AI UI problem. The strongest roots are in office-work, augmentation, personal information management, and language/action research.

| Source | AMTECH lesson |
|---|---|
| Douglas Engelbart, "Augmenting Human Intellect" (1962): https://www.dougengelbart.org/content/view/138/ | The computer is a working surface for complex work, not a pile of isolated tricks. AMTECH should increase the owner's ability to understand and act on the business, not merely answer prompts. |
| J. C. R. Licklider, "Man-Computer Symbiosis" (1960): https://groups.csail.mit.edu/medg/people/psz/Licklider.html | Humans set goals, judge, and redirect; computers handle routinizable sub-processes. AMTECH's owner keeps judgment and money/customer gates while the employee performs routine office work. |
| Xerox Star / Alto office metaphor and object-first UI: https://digibarn.com/friends/curbow/star/retrospect/index.html | Users should work with business objects, not launch programs first. AMTECH should surface estimates, jobs, approvals, receipts, connectors, and questions as first-class objects. |
| Thomas Malone / personal information management tradition: https://en.wikipedia.org/wiki/Personal_information_management | Real offices are piles, reminders, partial plans, and context re-finding. AMTECH should organize live work around what needs attention, not force a neat static taxonomy. |
| Lucy Suchman, situated action and work practice: https://en.wikipedia.org/wiki/Lucy_Suchman | Plans are resources, not scripts. The employee and UI must support adjustment, repair, and context-sensitive action rather than pretending every workflow is a fixed wizard. |
| Winograd/Flores language-action perspective: https://en.wikipedia.org/wiki/Language/action_perspective | Business language creates commitments. "Send it," "remind me," "ask for the deposit," and "not that price" are actions that change work state, not just messages. |

## Product translation

### 1. Chat is the command language, not the product

Chat should feel like the main input to an operating environment. It is where the owner says what happened, asks what to do, approves a draft, corrects context, or starts a new loop. But the value is not the transcript. The value is the **work objects** chat creates and updates.

Bad:

```text
chat on the left, dashboard on the right, each with its own mental model
```

Good:

```text
chat command -> estimate object -> approval surface -> sent receipt -> job timeline
```

### 2. Work objects are the new "apps"

In conventional software, the user opens an app to do a task. In AMTECH, the employee should make the needed surface appear from the work:

- an estimate becomes a line-item editor, PDF preview, approval gate, and send receipt;
- a customer reply becomes a job timeline and next-action decision;
- a connector issue becomes a repair surface;
- a payment event becomes a receipt and optional close-job action;
- a recurring check-in becomes a daily brief and follow-up queue.

This is the practical version of "software spins up when needed." The surface is generated from typed resources, actions, risk, proof, and context. It should not require a separate fixed dashboard for every skill.

### 3. Events are the office inbox

The business is an event stream: customer messages, deposits, emails, reminders, failed connectors, owner requests, invoices, and scheduled check-ins. The employee is the reader of that stream. The UI's job is to turn the stream into a small number of owner-facing states:

- done;
- doing;
- waiting for you;
- blocked or broken;
- produced;
- sent or recorded, with proof;
- available next.

"Activity" by itself is not enough. Activity becomes useful when it is grouped into commitments and next actions.

### 4. Approvals are operating-system permissions

The confirmation gate should feel like the business equivalent of an OS permission prompt: exact payload, risk, recipient, amount, why it is being asked, and what will happen after approval. The owner should never wonder whether "yes" means "draft it," "send it," "charge it," or "delete it."

This matters most for AI-naive owners. The trust lesson is not a tutorial. It is repeated interaction: inspect, approve, receive proof.

### 5. Proof is part of the interface

Receipts, provider ids, signed links, sent timestamps, uploaded artifacts, and connector tests are not admin details. They are how the owner learns that the employee is real. Proof should be quiet, but always retrievable.

### 6. Teach by doing one real loop

A fresh secretary, a 50-year-old contractor, and an AI-savvy operator need different density, but the same product truth:

- novice: "Avery needs you to check this estimate before it goes out."
- contractor: "Here is the number, here are the assumptions, say yes to send."
- AI-savvy user: "This is the typed work object, approval payload, proof trail, and next actions."

The first-run experience should not explain AMTECH abstractly. It should run one job and let the owner see the loop.

## UI implications

### Immediate Work Surface direction

The next UI should emphasize:

- a persistent employee input area that feels like a command line for the business;
- a "Today / Needs me" surface that is the office inbox, not a generic dashboard;
- work-object pages or panels where artifacts, approvals, proof, and history live together;
- generated task surfaces for estimates, connector repair, missing-info forms, daily briefs, and job timelines;
- preview/action/proof as one object, not separate tabs that feel unrelated;
- novice-friendly empty states that invite one real task rather than explaining features.

### Language rules

Prefer:

- employee;
- work;
- output;
- approval;
- proof;
- connected account;
- recurring work;
- needs you;
- done.

Avoid owner-facing:

- MCP;
- run;
- payload;
- tool call;
- artifact id as the main label;
- capability graph;
- webhook;
- provider event.

The technical terms still matter in admin/operator surfaces. They should not define the customer's mental model.

## Acceptance criteria for an AI-native UI pass

Pass:

- A new owner can understand in under 30 seconds what Avery is doing, what Avery made, and what needs approval.
- Chat, outputs, tasks, events, and previews feel like different renderings of the same work, not separate products.
- A contractor can start with "I walked this job" and end with an estimate draft without being taught a dashboard.
- An AI-savvy user can see that this is more than chat because typed objects, approvals, proof, and generated surfaces are visible.
- Every risky action has exact preview and proof.

Fail:

- The page reads as a chatbot with analytics cards.
- Tasks, outputs, chat, and activity disagree or require the user to reconcile them manually.
- The user must learn internal nouns before doing first work.
- The UI hides the unique capabilities that make the employee trustworthy: cross-surface work, event handling, approval gates, proof, and generated task views.
