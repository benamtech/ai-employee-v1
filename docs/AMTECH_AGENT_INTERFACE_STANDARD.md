# AMTECH Agent Interface Standard

**Status:** canonical  
**Scope:** owner web, onboarding, signed Review, dashboard, public front door, estimator, admin/operator surfaces, AG-UI presentation, MCP Apps, and proprietary employee surfaces.  
**Authority:** `AMTECH_WEB_DESIGN_SYSTEM.md` controls visual language. This document controls operating primitives, adaptive layout, context use, delegation, safety, evidence, and rendering behavior.

## 1. Product model

AMTECH is an always-on AI employee operating system. It is not a chatbot shell, notification center, provider dashboard, fixed tab set, workflow builder, or subagent org chart.

The owner enters through one stable operating point:

```text
business + owner + employee + assignment + current time + current work context
```

From that point, Manager materializes the smallest useful arrangement of work. The layout may change with the employee, business, current pressure, connected systems, device, and owner preference. The semantic primitives remain stable.

## 2. Canonical operating primitives

### Work loop

A durable body of work carried across time: a customer lifecycle, campaign, financial close, storefront operation, hiring process, research question, investigation, maintenance program, or custom workflow.

### Active save

A delegated future intention the employee is holding and evaluating until a return condition is met. Return conditions may be time, event, state, threshold, dependency, or owner judgment.

An active save is prospective work memory. It is not a notification. It preserves:

- why the work was saved;
- what the employee is watching;
- what will bring it back;
- what context changed while it was away;
- which loop, decision, effect, and proof it belongs to.

Examples:

- bring back a Stripe invoice when it becomes overdue;
- bring back a Gmail thread when the customer answers;
- bring back a Shopify order when fulfillment misses the promised state;
- bring back a Google Ads campaign when spend or conversion crosses a threshold;
- bring back an SEO investigation when ranking, indexing, or source evidence changes;
- bring back a research hypothesis when a new source contradicts it.

### Decision

Judgment or authorization required before a consequential branch can continue. Approve, reject, revise, answer, or escalate are contextual actions, not global inbox buttons.

### System change

A meaningful inbound, outbound, or internal state transition from Stripe, Gmail, Jobber, Shopify, QuickBooks, Google Ads, a browser/research source, Hermes runtime, or another connected system.

### Evidence

Source trail, accepted receipt, artifact, provider proof, audit lineage, contradiction, result, or terminal failure.

### Command

A universal steering input available in context. Command can create, steer, split, merge, pause, resume, or close work. It is not the information architecture.

### Delegated work unit

A bounded part of a work loop handled by a Hermes subagent, specialist agent, tool, connected system, human, or deterministic service. Delegation is first-class operating state but not presented as a technical hierarchy by default.

## 3. Adaptive operating surface

The interface guides a traditional business owner without constraining a knowledge worker or specialist.

A default rendering answers, in this order:

1. **What changed?**
2. **What is moving?**
3. **What needs me?**
4. **What is the employee holding for later?**
5. **What completed, and what proves it?**
6. **What can I ask or change now?**

These are dynamic regions, not permanent tabs. Empty regions disappear. A dominant work loop may become the focus surface. A compact owner view may show one sentence and one action; an expert view may expand the same object into sources, hypotheses, diffs, campaign entities, financial lineage, delegation, or provider evidence.

The surface must not require users to understand internal service boundaries. A contractor estimate, Shopify exception, QuickBooks close, Google Ads campaign, SEO program, and research investigation all use the same operating grammar while retaining domain-specific work objects.

## 4. Layout planning

Manager emits an `OperatingContextManifest`, `OperatingSurfaceState`, and `AdaptiveLayoutPlan`. The browser renders the plan; it does not independently infer authority or reconstruct business state from raw provider rows.

Hard deterministic priorities:

1. revoked, failed, ambiguous, or blocked authority/effect state;
2. decisions requiring the current owner;
3. active work and material delegation;
4. active-save return conditions;
5. meaningful system changes;
6. evidence and connection detail.

High-volume event sources use logarithmic volume weighting so a busy store, ad account, inbox, or browser session cannot monopolize the interface merely by producing more events.

Agent suggestions may choose a registered component, focus loop, explanation depth, or safe ordering among equal-priority items. They may not hide failures, weaken approvals, rewrite evidence, alter prices, change identity, or create arbitrary layouts.

## 5. Context compiler

The layout and available components may be informed by owner-safe versions of:

- current assignment and authority version;
- Hermes runtime, profile, transport, and session state;
- session history and carryover;
- webhook/event ingress and ambient inbox state;
- tools, connectors, MCP capabilities, and credential scope;
- employee manifest and seven-question intake;
- customer/business manifests and business-brain facts;
- profile package, context slots, generated memory/soul validation state;
- durable tasks, approvals, active saves, effects, receipts, outputs, and recovery;
- owner preferences and demonstrated interaction needs;
- compiled AGENTS and CODEGRAPH doctrine versions;
- AMTECH design, safety, and release policy.

Raw `AGENTS.md`, `CODEGRAPH.md`, secrets, provider payloads, soul files, private memory, and chain-of-thought are not sent to the browser. Build/provisioning compiles them into bounded doctrine, capability, version, and owner-safe context signals.

Every layout decision is inspectable through rationale codes and a context fingerprint. The interface may say “shown first because customer approval is required” without exposing private reasoning.

## 6. Delegation and subagents

Subagents are **first-class in execution, one-and-a-half-class in routine presentation**.

The owner normally sees:

- what part of the work was delegated;
- why it was delegated;
- whether it is queued, working, waiting, blocked, failed, or done;
- what result came back;
- how the result changes the parent loop;
- whether delegation affects cost, confidence, risk, or the next owner action.

The owner does not need to manage a tree of agent avatars, roles, or internal prompts. A topology view may exist for expert/support use, but the default product groups delegation by work outcome and dependency.

A delegated result cannot directly create a consequential effect. It returns to the parent employee/Manager boundary, where assignment, policy, approval, C3, receipt, and commercial attribution still apply.

## 7. Agent component contract

Every agent-selected component exposes, directly or through an adapter:

```ts
interface AgentInterfaceContract {
  goal: string;
  state: "forming" | "active" | "waiting" | "needs_you" | "blocked" | "repairing" | "failed" | "done";
  contextUsed: Array<{ label: string; value: string; provenance?: string }>;
  returnCondition?: { kind: string; description: string };
  delegatedWork?: Array<{ label: string; state: string; result?: string }>;
  decision?: {
    risk: "low" | "medium" | "high";
    consequence: string;
    actions: Array<"approve" | "reject" | "edit" | "respond" | "acknowledge">;
  };
  evidence: Array<{ label: string; value: string; receiptId?: string }>;
  nextAction?: string;
  recovery?: { error: string; safeRetry?: string; escalation?: string };
}
```

A component fails conformance when it shows an action without consequence, a result without evidence, a future intention without return condition, delegation without parent purpose, failure without recovery, or status without source.

## 8. Human and employee responsibilities

The owner sets outcomes, supplies judgment, changes priorities, and authorizes consequential effects. The employee observes, remembers, plans, delegates, performs routinizable work, returns active saves, prepares decisions, and preserves evidence.

```text
owner outcome
-> authenticated principal
-> exact assignment and context
-> work loop / active save / decision
-> Hermes and bounded delegated execution
-> approval when required
-> C3 effect
-> durable receipt
-> updated operating state
```

The interface may explain this boundary. It may never bypass it.

## 9. Rendering levels

### Level 0 — authored critical UI

Authentication, identity verification, account creation, payments, approvals, destructive actions, and recovery use authored components. Runtime generation is prohibited.

### Level 1 — finite materialized UI

Manager selects a registered component and supplies typed owner-safe props. This is the default for loops, saves, decisions, changes, evidence, connections, and delegation.

### Level 2 — schema-constrained generated UI

An agent may select from registered components or populate a validated schema. The host validates semantics, bindings, actions, evidence, assignment, session, and context version before mounting.

### Prohibited — arbitrary generated DOM

No model-generated scripts, claims, prices, links, actions, or unregistered component trees mount directly. HTML resources are permitted only through the MCP Apps boundary.

## 10. AG-UI boundary

AG-UI is presentation and state synchronization, not authority or a second ledger.

| AG-UI concept | AMTECH source |
|---|---|
| lifecycle event | Hermes/Manager run and delegated-work state |
| message event | owner-safe transcript event |
| state snapshot | operating snapshot or bounded work-loop state |
| state delta | version-bound patch |
| tool call | owner-safe delegated activity |
| interrupt | decision, missing information, dependency, or escalation |
| tool result | evidence or explicitly non-terminal progress |

Rules:

- stable IDs and event order are preserved;
- snapshots replace state; deltas require matching context version;
- version drift requests a fresh snapshot;
- reconnect resumes state and never replays the owner command;
- no private chain-of-thought is displayed;
- frontend actions re-enter Manager authority and C3;
- a run is not complete until terminal state and receipt agree.

## 11. MCP Apps / MCP-UI boundary

MCP Apps are bounded interactive work objects: document review, comparison, configuration, missing information, research/source analysis, campaign inspection, charts, and approval previews.

Required controls:

- predeclared `ui://` resources and registered components;
- sandboxed iframe; no `allow-same-origin` by default;
- source-window, envelope, intent, assignment, action, and context validation;
- owner-safe data only;
- no access to cookies, Manager/provider credentials, private memory, or arbitrary network endpoints;
- intents are requests, never effects;
- complete structured/text fallback;
- bounded responsive dimensions.

## 12. Office and computing principles

- **Arrange by dependency:** group around the active job, question, or obligation rather than database tables or provider brands.
- **Design for change:** modular work objects reorganize without changing the stable operating point.
- **Move between overview and focus:** quiet summary, focused loop, and clear return path.
- **Augment judgment:** routinizable information work is delegated; owner judgment remains explicit.
- **Preserve control:** adaptation may reorder or expand presentation but cannot silently change business facts, claims, prices, or policy.
- **Externalize future intention:** active saves reduce prospective-memory load by making return conditions durable and visible.

## 13. Interaction rules

- Show current state before asking for input.
- Use business language and one useful next step for guided owners.
- Ask only for information required for the next bounded branch.
- Preserve user-entered information and prior context.
- Explain why an effect is held.
- Make approve and reject equally understandable.
- Offer revision before a forced binary choice when safe.
- Distinguish active, waiting, blocked, repairing, failed, and done.
- Use optimistic UI only for reversible local state.
- Display uncertainty and degraded capability honestly.
- Provide safe retry or escalation for every recoverable failure.
- Never display fake activity, fake precision, fake metrics, or fixture evidence as live work.

## 14. Visual and accessibility behavior

All components inherit `AMTECH_WEB_DESIGN_SYSTEM.md`: light surfaces, red action, blue system state, green verified success, 8px rhythm, soft cards, Inter typography, restrained motion, and no amber/orange/dark ornamental UI.

WCAG 2.2 AA is the minimum target. Focus is visible and unobscured. Controls are keyboard operable. Forms use persistent labels and field errors. Status updates announce meaningful transitions without streaming every token. Reduced motion removes nonessential animation.

## 15. Evidence levels

- `live_production_proof`
- `provider_accepted`
- `browser_channel_accepted`
- `ci_accepted`
- `source_wired`
- `fixture_demonstration`
- `concept`

Fixture and concept content is visibly labeled and cannot be promoted into live proof.

## 16. Conformance

A release passes only when:

1. machine-readable operating-surface vectors pass;
2. typecheck and production build pass;
3. guided, standard, and expert layouts pass responsive/keyboard/accessibility checks;
4. AG-UI and MCP actions remain authority-bound;
5. delegation, active saves, and context signals pass cross-assignment and stale-context tests;
6. a fixture-free packet proves onboarding, operating surface, signed Review, and receipt rendering on one SHA;
7. deviations are recorded with rationale and reviewer sign-off.

## 17. Source basis

- W3C WCAG 2.2 and ARIA Authoring Practices.
- ISO 9241-210:2019.
- Amershi et al., “Guidelines for Human-AI Interaction,” CHI 2019.
- Licklider, “Man-Computer Symbiosis,” 1960.
- Engelbart, “Augmenting Human Intellect,” 1962.
- Propst, *The Office: A Facility Based on Change*, 1968.
- Bürolandschaft research on communication and adaptable organization.
- prospective-memory and event-based intention research.
- official AG-UI protocol documentation.
- Model Context Protocol Apps and MCP-UI guidance.
- Hermes runtime failure and recovery patterns documented in `docs/ui/HERMES_RUNTIME_UI_DERIVATIONS.md`.
