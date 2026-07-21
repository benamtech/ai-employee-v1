# ADR-009 — One production UI projection path

Status: **accepted for implementation; exact-candidate evidence pending**  
Decision date: 2026-07-21  
Repository: `benamtech/ai-employee-v1`  
Starting SHA: `feb88e1259d0018286e6c06ff77a5c51078a1963`  
Computed selection artifact: `decision/trace009/selected_implementation.json` generated from Trace009 before production patching  
Parent transaction: WS-08 on draft PR #36

## Context

The production UI had one shared layout planner, one `WorkObjectRenderer`, and one Manager generated-view compiler with a validating Web host. Repository inspection also found two active owner EventSource controllers, browser-local fallback semantic compilation, and a UI Lab route that used a parallel semantic compiler and renderer tree.

The UI method is subordinate to unfinished WS-08 release identity, recovery, restore, rollback, signing, capacity, workflow, and exact-head closure. It may remove a production architecture liability but may not promote any stronger evidence class.

## Alternatives

1. Keep duplicate implementations and add comments.
2. Create a separate UI Lab package/runtime.
3. Rewrite every surface in a new framework.
4. Delete UI Lab.
5. Consolidate the production controller/compiler/registry path and make UI Lab a thin fixture shell.

## Evidence

- `LiveEmployeeOperatingShell.tsx` and `AgentSurface.tsx` separately owned EventSource connection, snapshot, scope, and reconnect behavior.
- `AgentSurface.tsx` and the prior `FixtureLabClient.tsx` contained local operating-state compilation in addition to Manager materialization.
- The shared planner, `WorkObjectRenderer`, Manager `compileDeliverableUiResource`, and Web `McpUiResource` already provided canonical reusable primitives.
- Trace009 produced 32 bounded candidates, 30 feasible sets, and 11 Pareto sets. The Pareto compression and the simple evidence-and-invariants baseline independently selected the same four trajectories. Weighted aggregation is sensitivity analysis only.

## Selected invariants

```text
1 ProjectionController
1 SemanticCompiler
1 LayoutPlanner
1 RendererRegistry
1 WorkResourceRenderer
1 EmbeddedViewCompiler
thin Talk / Workspace / Review / MCP Apps / operator / UI Lab projections
same truth + same authority + same actions during experiments
no fixture evidence promoted to production conformance
WS-08 remains the primary transaction
```

## Decision

- Use `owner-projection-controller.ts` as the one owner-stream controller implementation.
- Use `compileOperatingProjection` as the one browser-facing semantic projection compiler; exact Manager-supplied operating state is accepted only when its account, employee, and assignment context matches.
- Keep `planAdaptiveOperatingLayoutV2` as the only layout planner.
- Gate planner regions through `registeredOperatingRegions`.
- Keep `WorkObjectRenderer` as the only WorkResource renderer.
- Keep Manager `compileDeliverableUiResource` as the embedded-view compiler and Web `McpUiResource` as its validating host, not a second compiler.
- Route UI Lab through `ProductionFixtureLabClient` and production `AgentSurface`. The old fixture client is isolated and has no route authority.
- Verify consequential state transitions exhaustively and ordinary presentation factors through deterministic constrained pairwise/three-way coverage.

## Consequences

Positive:

- Talk and Workspace share snapshot installation, exact scope validation, reconnect behavior, and no-replay semantics.
- UI Lab can vary timing and presentation policy without maintaining a parallel semantic or WorkResource renderer.
- Architecture singleton assumptions become executable fitness functions rather than prose.
- State-machine cases name durable or receipt oracles and forbidden observations.

Costs and risks:

- The controller and compiler become higher-leverage modules and require strict tests.
- Browser behavior can regress during consolidation even when types pass.
- The isolated legacy lab file remains historical source until a later mechanical deletion is safe.
- No source or fixture proof establishes browser/channel, release, target-host, pilot, deployment, or production acceptance.

## Proof obligations

- `scripts/verify-ui-architecture.mjs`
- `tests/unit/ui-architecture-fitness.test.ts`
- `tests/unit/ui-state-machine-conformance.test.ts`
- `tests/unit/ui-presentation-coverage.test.ts`
- existing owner snapshot, protocol authority, WorkResource, MCP UI, and browser suites
- exact-head all-workspace typecheck/build and PR workflow evidence

## Rejected options

The separate UI Lab runtime and full framework rewrite violate the no-parallel-UI or bounded-scope invariants. Documentation-only, planner-only, screenshot-only, and deletion-only alternatives do not close the selected hyperedges.

## Supersession

This ADR may be superseded only by another accepted ADR that:

1. cites the exact implementation and evidence SHAs;
2. preserves or explicitly replaces every selected invariant;
3. supplies behavioral evidence for authority, effect, ambiguity, retry, receipt, proof, and isolation;
4. records migration and rollback implications;
5. does not promote fixture or presentation experiments into production acceptance.

Large candidate, graph, score, sensitivity, and verification artifacts remain in `decision/trace009/`, not in this ADR.
