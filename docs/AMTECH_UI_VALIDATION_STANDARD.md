# AMTECH UI Validation Standard

**Status:** canonical release gate  
**Companion documents:** `AMTECH_WEB_DESIGN_SYSTEM.md`, `AMTECH_AGENT_INTERFACE_STANDARD.md`

## 1. Purpose

UI quality is accepted through evidence, not adjectives. This standard converts the AMTECH visual and agent-interface doctrine into repeatable pass/fail vectors for source, build, browser, accessibility, safety, and live-channel acceptance.

## 2. Result vocabulary

- `PASS` — required evidence exists on the exact candidate SHA.
- `FAIL` — evidence demonstrates a violation.
- `BLOCKED` — the required environment, provider, account, or credential is unavailable.
- `NOT_RUN` — no valid evidence exists.
- `WARNING` — non-blocking debt with an owner and deadline.

`BLOCKED` and `NOT_RUN` never count as passing.

## 3. Gate classes

### G0 — authority and inventory

- Every public or operator route is listed in the surface inventory.
- Every surface names its evidence level and data source.
- Canonical documents have one explicit authority order.
- Historical design doctrines are labeled non-canonical.

### G1 — mechanical design-system conformance

- Canonical color tokens are present.
- No dark mode, dark page surface, amber/orange/gold/beige/purple/rainbow accent, or competing primary color.
- No global square-corner override or obsolete 3px spacing doctrine.
- Primary actions are AMTECH red; information is blue; verified success is green.
- Inter/system is the UI family.
- Components use the 8px spacing scale and 16–24px surface radii.
- Focus-visible and reduced-motion rules exist.

### G2 — agent-interface semantics

- Critical surfaces expose command, work, decision, and proof.
- State distinguishes working, needs-you, blocked, failed, and done.
- Consequential actions show consequence and approval state.
- Completed effects show durable proof or receipt state.
- Failure states show a safe retry or escalation path.
- Chat is not the sole representation of work.

### G3 — AG-UI event safety

- Events have stable IDs and typed names.
- Snapshots replace state; deltas are version-bound.
- Out-of-sync deltas trigger a fresh snapshot.
- Tool-call displays show owner-safe activity, not chain-of-thought.
- Frontend action requests re-enter Manager authority and C3.
- Terminal UI status agrees with command and receipt state.

### G4 — MCP Apps safety

- Resource is registered and owner-safe.
- iframe sandbox is present; `allow-same-origin` is absent by default.
- Host validates source window, message envelope, intent allowlist, assignment, and action scope.
- Resource cannot read cookies, credentials, provider secrets, or arbitrary network state.
- Unsupported hosts receive a complete fallback.
- Arbitrary model-generated DOM and direct resource effects are prohibited.

### G5 — accessibility and interaction

- WCAG 2.2 AA automated and manual checks pass.
- Keyboard navigation works for tabs, forms, menus, review actions, and dialogs.
- Focus is visible and not obscured.
- Interactive targets are 44px production target and never below WCAG minimum.
- Forms have explicit labels, descriptions, and field errors.
- Live regions announce meaningful state transitions without token-by-token noise.
- Reduced-motion mode removes nonessential animation.
- 320px mobile layout has no unintended horizontal overflow.

### G6 — content and evidence integrity

- Copy follows outcome → capability → operational detail → proof/action.
- No unsupported superlatives or generic AI slogans.
- Fixture content is labeled.
- Provider, production, and performance claims have exact evidence references.
- Public estimator is labeled non-canonical until replaced.
- Price and offer text agrees with canonical GTM documents.

### G7 — performance and resilience

- Production build succeeds.
- Critical route JavaScript, image, and font budgets are recorded.
- Loading, empty, degraded, offline, expired, revoked, and failed states exist.
- Streaming reconnects without duplicating user-visible work.
- Long-running work can be resumed from durable state.

### G8 — fixture browser acceptance

On the exact SHA, capture all critical variants:

- front door desktop/mobile;
- create employee: initial, missing data, secure identity, pending verification, verified, failed;
- owner dashboard: empty and multi-employee;
- owner work: loading, healthy, needs-you, blocked, failed, proof, connections;
- signed Review: approval, artifact, media, receipt, failure, expired, revoked;
- MCP App card and fallback;
- admin readiness and support-action confirmation.

### G9 — fixture-free acceptance

- Real owner account/session.
- Real business identity verification request and signed provider callback.
- Verified employee activation with accepted C3 receipt.
- Real owner turn through Hermes.
- Real signed Review decision.
- Real provider effect and durable receipt.
- Browser, SMS, and provider packets retained against one SHA.

## 4. Required artifact set

```text
validation/ui/<sha>/surface-inventory.json
validation/ui/<sha>/source-report.json
validation/ui/<sha>/browser-matrix.json
validation/ui/<sha>/accessibility-report.json
validation/ui/<sha>/performance-report.json
validation/ui/<sha>/screenshots/
validation/ui/<sha>/live-channel-packet.json
```

Generated reports are immutable evidence and are not hand-edited.

## 5. Pass rules

A branch-level production-like UI candidate passes when G0–G8 pass. A live-production UI candidate passes only when G0–G9 pass on the exact deployment SHA.

A failed required vector blocks the release. A warning requires an owner, remediation, and due gate. Visual preference cannot override authority, accessibility, security, or evidence failures.

## 6. Surface inventory schema

```ts
interface UiSurfaceRecord {
  id: string;
  route: string;
  audience: "public" | "owner" | "signed_owner" | "operator";
  purpose: string;
  dataAuthority: string[];
  interactionLevel: 0 | 1 | 2;
  evidenceLevel: string;
  criticalStates: string[];
  requiredGates: string[];
  owner: string;
}
```

## 7. Agent component validation schema

```ts
interface AgentComponentValidation {
  component: string;
  registered: boolean;
  goalVisible: boolean;
  stateVisible: boolean;
  inputsVisibleOrInspectable: boolean;
  decisionConsequenceVisible: boolean;
  proofVisible: boolean;
  recoveryVisible: boolean;
  actionAuthorityBound: boolean;
  semanticBindingsValidated: boolean;
  fallbackComplete: boolean;
}
```

## 8. Review protocol

1. Run source validator and unit contracts.
2. Run typecheck and production build.
3. Run fixture browser matrix.
4. Run automated accessibility and inspect keyboard/focus manually.
5. Record performance budgets.
6. Review copy and evidence levels.
7. Run fixture-free acceptance in approved staging.
8. Freeze SHA and publish the evidence manifest.

No screenshot-only review can close a behavior or authority gate.
