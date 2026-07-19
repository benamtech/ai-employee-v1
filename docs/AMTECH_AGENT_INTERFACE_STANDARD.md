# AMTECH Agent Interface Standard

**Status:** canonical  
**Scope:** owner web, onboarding, signed Review, dashboard, public front door, estimator, admin/operator surfaces, and any UI delivered through AG-UI or MCP Apps.  
**Authority:** `AMTECH_WEB_DESIGN_SYSTEM.md` controls visual language. This document controls agent interaction, state, safety, evidence, and rendering behavior.

## 1. Product model

AMTECH is an AI employee, not a chatbot shell. The interface must let an owner understand and control work without learning the internal architecture.

Every production surface is organized around four planes:

1. **Command** — what the owner asked for, what the employee understood, and what is still missing.
2. **Work** — current activity, staged outputs, progress, blocked state, and recovery.
3. **Decision** — consequential actions requiring approve, reject, edit, or escalation.
4. **Proof** — accepted receipts, sent artifacts, provider evidence, audit lineage, and completed outcomes.

Chat may initiate or steer work. It is never the only representation of state.

## 2. Human and agent responsibilities

The owner sets goals, supplies judgment, resolves ambiguity, and authorizes consequential effects. The employee gathers context, performs routinizable work, prepares decisions, and preserves state and proof.

This follows the durable AMTECH authority model:

```text
owner intent
-> authenticated principal
-> exact assignment and scope
-> typed state or command
-> approval when required
-> bounded effect
-> durable receipt
-> role-safe rendered outcome
```

The interface may explain this boundary. It may never bypass it.

## 3. Agent component contract

Every agent-generated or agent-selected component must expose the following fields, directly or through a registered adapter:

```ts
interface AgentInterfaceContract {
  goal: string;
  state: "idle" | "working" | "needs_you" | "blocked" | "failed" | "done";
  inputsUsed: Array<{ label: string; value: string; provenance?: string }>;
  work: Array<{ label: string; state: string }>;
  decision?: {
    risk: "low" | "medium" | "high";
    consequence: string;
    actions: Array<"approve" | "reject" | "edit" | "respond" | "acknowledge">;
  };
  proof: Array<{ label: string; value: string; receiptId?: string }>;
  nextAction?: string;
  recovery?: { error: string; safeRetry?: string; escalation?: string };
}
```

A component fails conformance when it shows an action without consequence, a result without proof, a failure without recovery, or a status without a source.

## 4. Rendering levels

### Level 0 — authored critical UI

Use authored React components for authentication, onboarding identity, account creation, approvals, payments, destructive actions, and error recovery. Runtime generation is prohibited.

### Level 1 — finite materialized UI

Manager selects a registered component and supplies typed props from owner-safe read models. This is the default for dashboards, tasks, work objects, connectors, and receipts.

### Level 2 — schema-constrained generated UI

An agent may select from a registered component vocabulary or fill a validated schema. The host validates semantics, bindings, actions, proof, assignment scope, and session state before mounting.

### Prohibited — arbitrary generated DOM

No model-generated scripts, claims, prices, links, actions, or unregistered component trees may be mounted directly. HTML resources are permitted only through the MCP Apps boundary below.

## 5. AG-UI boundary

AG-UI is a presentation and state synchronization protocol. It does not replace Manager, Hermes, C3, assignments, approval authority, or durable receipts.

Allowed mappings:

| AG-UI concept | AMTECH source |
|---|---|
| lifecycle event | Hermes/Manager run state |
| message event | owner-safe transcript event |
| state snapshot | `ResourcePayload` or bounded surface state |
| state delta | validated patch against the current snapshot |
| tool-call rendering | owner-safe tool activity envelope |
| interrupt | existing approval, missing-information, or escalation gate |
| tool result | durable terminal receipt or explicitly non-terminal progress |

Rules:

- Preserve event order and stable IDs.
- Replace state on a snapshot; apply deltas only to the matching state version.
- On version drift, discard deltas and request a fresh snapshot.
- Never expose private chain-of-thought. Show concise activity, inputs, decisions, and evidence.
- A frontend tool call can request an action, but the action must re-enter the canonical authority and C3 path.
- A run is not visually complete until its terminal state and receipt state agree.

## 6. MCP Apps / MCP-UI boundary

MCP Apps are used for bounded interactive work objects that are materially clearer than text: document review, comparison, configuration, structured missing information, charts, and approval previews.

Required controls:

- `ui://` resources are predeclared and component-registered.
- HTML uses the MCP Apps HTML profile when the standard host is available.
- Render in an iframe sandbox. `allow-same-origin` is prohibited by default.
- Host validates message source, envelope, intent, assignment, action scope, and current authority.
- UI resources receive owner-safe data only.
- Resource scripts cannot access owner cookies, Manager credentials, provider credentials, or arbitrary network endpoints.
- Resource intents are requests, not effects. The host routes them to existing approval/respond handlers.
- Unsupported hosts receive a complete structured/text fallback.
- Resource dimensions are bounded and responsive; no viewport takeover.

## 7. Office-derived interaction principles

The interface applies durable lessons from mid-century office and computing research without copying the failures of open-plan offices.

### Arrange by work dependency

Bürolandschaft organized space around communication and information flow rather than status. AMTECH therefore groups UI by the active job, decision, or dependency—not by database table or internal service.

### Design for change

Robert Propst treated the office as a facility based on change. AMTECH surfaces use modular work objects that can be reordered, expanded, or replaced without changing the owner’s core navigation or authority model.

### Support movement between overview and focus

Owners need a quiet overview, a focused work object, and a clear return path. Dense dashboards must not become permanent open-plan noise.

### Augment judgment

Licklider and Engelbart framed computers as partners that handle routinizable information work while humans formulate goals and exercise judgment. AMTECH must prepare and clarify decisions, not manufacture owner consent.

### Preserve personal control

Adaptation is explicit or low-risk. The system may reorder work by urgency and dependency, but it may not silently change claims, prices, approval requirements, or user-selected preferences.

## 8. Interaction rules

- Show the current system state before asking for input.
- Ask only for information required for the next bounded step.
- Preserve user-entered information and never require redundant re-entry without reason.
- Explain why a consequential action is held.
- Make approve and reject equally understandable.
- Provide edit/respond before forcing a binary decision when revision is safe.
- Distinguish `working`, `waiting`, `blocked`, `failed`, and `done`.
- Use optimistic UI only for reversible local state; external effects wait for receipts.
- Display uncertainty and degraded capability honestly.
- Provide a safe retry or escalation path for every recoverable failure.
- Do not display fake activity, fake precision, fake metrics, or simulated provider proof as live state.

## 9. Visual behavior

All components inherit `AMTECH_WEB_DESIGN_SYSTEM.md`:

- light surfaces only;
- red for brand/action, blue for system/information, green for verified success;
- 8px spacing rhythm;
- 16–24px cards and pill actions;
- Inter/system typography;
- restrained glass, borders, gradients, shadows, and motion;
- no ornamental badges, dark surfaces, amber/orange states, or competing accents.

## 10. Accessibility and motion

- WCAG 2.2 AA is the minimum conformance target.
- Production interactive targets are at least 44px where layout permits and never below WCAG minimum.
- Focus is visible and not obscured by sticky controls.
- Tabs implement keyboard and ARIA tab patterns.
- Status changes use appropriate live regions without announcing every streamed token.
- Forms use persistent labels, field-level errors, and accessible descriptions.
- Authentication avoids memory/puzzle barriers and redundant entry.
- Reduced-motion mode removes nonessential transitions.

## 11. Evidence levels

Every surface and claim declares one evidence level:

- `live_production_proof`
- `provider_accepted`
- `browser_channel_accepted`
- `ci_accepted`
- `source_wired`
- `fixture_demonstration`
- `concept`

Fixture and concept content must be visibly labeled and cannot be promoted into live proof.

## 12. Conformance

A release passes this standard only when:

1. the machine-readable UI vector suite passes;
2. typecheck and production build pass;
3. critical surfaces pass keyboard, responsive, reduced-motion, and contrast checks;
4. generated/MCP UI actions are semantically validated and authority-bound;
5. a fixture-free browser packet proves onboarding, owner work, signed Review, and receipt rendering on the exact SHA;
6. deviations are recorded in the canonical design document with reviewer sign-off.

## 13. Source basis

- W3C, WCAG 2.2 and ARIA Authoring Practices.
- ISO 9241-210:2019, human-centred design through the interactive-system lifecycle.
- Amershi et al., “Guidelines for Human-AI Interaction,” CHI 2019.
- J. C. R. Licklider, “Man-Computer Symbiosis,” 1960.
- Douglas Engelbart, “Augmenting Human Intellect,” 1962.
- Robert Propst, *The Office: A Facility Based on Change*, 1968.
- Quickborner Team / Bürolandschaft research on communication and adaptable organization.
- AG-UI official protocol documentation.
- Model Context Protocol Apps extension and MCP-UI implementation guidance.
