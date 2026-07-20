# AMTECH UI Validation Standard

**Status:** canonical release gate  
**Companion documents:** `AMTECH_WEB_DESIGN_SYSTEM.md`, `AMTECH_AGENT_INTERFACE_STANDARD.md`

## 1. Purpose

UI quality is accepted through evidence, not adjectives. This standard converts AMTECH visual and agent-operating doctrine into repeatable pass/fail vectors for source, build, browser, accessibility, adaptive layout, safety, and live-channel acceptance.

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
- Historical design doctrines and fixed-tab work-surface experiments are labeled non-canonical.

### G1 — mechanical design-system conformance

- Canonical color tokens are present.
- No dark mode, dark page surface, amber/orange/gold/beige/purple/rainbow accent, or competing primary color.
- No global square-corner override or obsolete 3px spacing doctrine.
- Primary actions are AMTECH red; information is blue; verified success is green.
- Inter/system is the UI family.
- Components use the 8px spacing scale and 16–24px surface radii.
- Focus-visible and reduced-motion rules exist.

### G2 — operating-surface semantics

- The owner surface is built from work loops, active saves, decisions, system changes, delegated work, evidence, and contextual command.
- The default shell does not use a permanent Command/Work/Decisions/Proof tab set.
- Guided copy answers what changed, what is moving, what needs the owner, what will return, and what proves completion.
- Active saves expose a return condition.
- Delegated units expose parent purpose, state, and material result or block.
- Consequential actions show consequence and approval state.
- Completed effects show durable evidence or receipt state.
- Failure states show safe retry, repair, or escalation.
- Chat is not the sole representation of work.

### G3 — adaptive layout and context safety

- Manager emits one versioned `OperatingContextManifest`, `OperatingSurfaceState`, and `AdaptiveLayoutPlan`.
- Layout rationale and context fingerprint are inspectable.
- Hard priorities put revocation/failure/ambiguity, owner decisions, and blocked work before low-risk activity.
- Event-volume scoring is logarithmically damped.
- Layout uses owner-safe manifest, profile, business-brain, runtime, session, connector, and materialized-work signals.
- Raw provider payloads, secrets, memory files, soul files, AGENTS.md, CODEGRAPH.md, and chain-of-thought never reach the browser.
- Agent-generated layout suggestions may select only registered regions/components and cannot hide required states.
- Cross-assignment context leakage is zero.

### G4 — AG-UI event safety

- Events have stable IDs and typed names.
- Snapshots replace state; deltas are version-bound.
- Out-of-sync deltas trigger a fresh operating snapshot.
- Reconnect resumes state and never replays the owner command.
- Tool/delegation displays show owner-safe activity, not chain-of-thought.
- Frontend action requests re-enter Manager authority and C3.
- Terminal UI state agrees with command and receipt state.

### G5 — MCP Apps safety

- Resource is registered and owner-safe.
- iframe sandbox is present; `allow-same-origin` is absent by default.
- Host validates source window, message envelope, intent allowlist, assignment, context version, and action scope.
- Resource cannot read cookies, credentials, provider secrets, memory files, or arbitrary network state.
- Unsupported hosts receive a complete fallback.
- Arbitrary model-generated DOM and direct resource effects are prohibited.

### G6 — accessibility and interaction

- WCAG 2.2 AA automated and manual checks pass.
- Keyboard navigation works for work loops, forms, review actions, dialogs, details, and command controls.
- Focus is visible and not obscured.
- Interactive targets are 44px production target and never below WCAG minimum.
- Forms have explicit labels, descriptions, and field errors.
- Live regions announce meaningful state transitions without token-by-token noise.
- Reduced-motion mode removes nonessential animation.
- 320px mobile layout has no unintended horizontal overflow.

### G7 — content and evidence integrity

- Copy follows outcome → current operating state → required action → evidence/return condition.
- No unsupported superlatives or generic AI slogans.
- Fixture content is labeled.
- Provider, production, and performance claims have exact evidence references.
- Public estimator is labeled non-canonical until replaced.
- Price and offer text agrees with canonical GTM documents.

### G8 — performance and resilience

- Production build succeeds.
- Critical route JavaScript, image, font, snapshot, and streaming budgets are recorded.
- Layout planning is deterministic and bounded for 0, 1, 100, and 10,000 inbound events.
- High-volume event ingress cannot create unbounded cards or dominate priority through count alone.
- Loading, empty, degraded, offline, expired, revoked, stale-context, ambiguous, and failed states exist.
- Long-running work and delegated work resume from durable state.

### G9 — fixture browser acceptance

On the exact SHA, capture:

- front door desktop/mobile;
- create employee: initial, missing data, secure identity, pending verification, verified, failed;
- owner dashboard: empty and multi-employee;
- operating surface: guided first run, active loop, owner decision, blocked loop, active save, system changes, delegated work, evidence, degraded runtime, stale-context refresh;
- research-browser employee: question, source trail, competing claims, monitoring save, delegated source review, draft synthesis, contradiction, evidence;
- ecommerce employee: order exception, inventory threshold, fulfillment dependency, customer decision, receipt;
- growth employee: SEO/Google Ads loops, threshold saves, campaign changes, delegated analysis, evidence;
- signed Review: approval, artifact, media, receipt, failure, expired, revoked;
- MCP App card and fallback;
- admin readiness and support-action confirmation.

### G10 — fixture-free acceptance

- Real owner account/session.
- Real business identity verification request and signed provider callback.
- Verified employee activation with accepted C3 receipt.
- Real owner turn through Hermes.
- Real work loop and active save return.
- Real delegated work unit or bounded tool execution with parent lineage.
- Real signed Review decision.
- Real provider effect and durable receipt.
- Browser, SMS, provider, operating-snapshot, and context-manifest packets retained against one SHA.

## 4. Required artifact set

```text
validation/ui/<sha>/surface-inventory.json
validation/ui/<sha>/source-report.json
validation/ui/<sha>/operating-context-report.json
validation/ui/<sha>/layout-plan-matrix.json
validation/ui/<sha>/browser-matrix.json
validation/ui/<sha>/accessibility-report.json
validation/ui/<sha>/performance-report.json
validation/ui/<sha>/screenshots/
validation/ui/<sha>/live-channel-packet.json
```

Generated reports are immutable evidence and are not hand-edited.

## 5. Pass rules

A branch-level production-like UI candidate passes when G0–G9 pass. A live-production UI candidate passes only when G0–G10 pass on the exact deployment SHA.

A failed required vector blocks the release. A warning requires an owner, remediation, and due gate. Visual preference cannot override authority, accessibility, security, context isolation, or evidence failures.

## 6. Surface inventory schema

```ts
interface UiSurfaceRecord {
  id: string;
  route: string;
  audience: "public" | "owner" | "signed_owner" | "operator";
  purpose: string;
  dataAuthority: string[];
  operatingPrimitives: string[];
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
  contextVisibleOrInspectable: boolean;
  returnConditionVisible: boolean;
  delegationPurposeVisible: boolean;
  decisionConsequenceVisible: boolean;
  evidenceVisible: boolean;
  recoveryVisible: boolean;
  actionAuthorityBound: boolean;
  semanticBindingsValidated: boolean;
  fallbackComplete: boolean;
}
```

## 8. Adaptive layout matrix

At minimum, validate deterministic plans for:

| Scenario | Required primary region |
|---|---|
| revoked/ambiguous effect | attention |
| owner approval waiting | attention |
| blocked high-priority loop | attention |
| active work, no owner action | work_loops or guidance |
| return condition reached | active_saves or attention |
| high-volume low-risk events | system_changes below active work |
| material delegated failure | delegated_work or attention |
| quiet system | guidance |

The same context fingerprint and operating state must produce the same plan.

## 9. Review protocol

1. Run source validator and unit contracts.
2. Run shared/Manager/web typecheck and production build.
3. Run layout-plan determinism and event-volume tests.
4. Run fixture browser matrix across guided, standard, and expert contexts.
5. Run automated accessibility and inspect keyboard/focus manually.
6. Record route, snapshot, stream, and rendering performance budgets.
7. Review copy, context signals, and evidence levels.
8. Run fixture-free acceptance in approved staging.
9. Freeze SHA and publish the evidence manifest.

No screenshot-only review can close behavior, context, delegation, authority, or receipt gates.
