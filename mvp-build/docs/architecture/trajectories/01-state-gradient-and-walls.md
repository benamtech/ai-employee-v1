# 01 — State, Gradient, and Hard Walls

Status: **[VERIFIED] supplied state/loss structure; [INFERRED] normalized control ranking**

## Gradient convention

[VERIFIED] For one squared deficit term `w(θ-target)^2`:

```text
-∂L/∂θ = 2w(target - θ)
```

[INFERRED] Normalized directions in this packet use `w=1` only to compare intervention magnitude. The weighted direction remains `2w(target-current)`.

[INFERRED] Production navigation targets are:

- α, σ, ν → `1.0`, following the supplied loss;
- π56…π64 → `0.9`, following Basin-B entry;
- π65 → `min(π56…π64)`;
- ρ66/ρ67 → current `0.1` while production scope remains locked;
- χ73…χ77 → `[0.9, 0.3, 0.9, 0.2, 0.5]`, derived from the active UX doctrine of higher focus/trust, lower load/fatigue, and bounded curiosity.

[VERIFIED] The supplied pre-ready π term penalizes activating production dimensions before readiness. [INFERRED] π navigation is therefore piecewise:

```text
not_ready: hold π at 0 through gate control
ready: switch to deficit flow toward 0.9
```

[INFERRED] This is the production saddle-node: the target basin becomes locally navigable only after authority, safety, validation, and live-proof prerequisites exist.

## Hard-wall state

| Wall | Current state | Control |
|---|---|---|
| W1 one authority | [VERIFIED] σ34=1.0 | preserve one generated-view compiler/renderer and one canonical adaptive planner |
| W2 no reference import | [VERIFIED] α11=1.0 | keep reference packages outside production imports/build graph |
| W3 U1 complete | [VERIFIED] α10=1.0 | preserve extraction completion before any H2+ activation |
| W4 evidence binding | [VERIFIED] σ31=0.9 | exactly on boundary; every production claim requires exact-SHA evidence |
| W5 packed consumer | [VERIFIED] ν46=1.0 | retain tarball/packed-consumer proof |
| W6 scope lock | [VERIFIED] σ30=1.0 | keep research engines isolated from Tuesday source/dependencies |

## Dimension primitives used by trajectories

| Symbol | Current | Target | Normalized flow | Source control |
|---|---:|---:|---:|---|
| α10 extraction | 1.00 | 1.00 | 0.00 | preserve extraction authority |
| α11 package purity | 1.00 | 1.00 | 0.00 | no reference imports |
| α14 durable store | 0.75 | 1.00 | +0.50 | migrations, leases, receipts, staging apply |
| α15 GLM/gateway conformance | 0.50 | 1.00 | +1.00 | budget, rate, ambiguity, live receipts |
| α20 idempotency | 0.60 | 1.00 | +0.80 | stable keys, claims, crash/replay proof |
| α23 action loop | 0.70 | 1.00 | +0.60 | approval → effect → receipt → repair |
| σ26 injection safety | 0.90 | 1.00 | +0.20 | normalized facts, schema/authority boundary |
| σ27 approval | 0.85 | 1.00 | +0.30 | exact current gate and lifecycle |
| σ28 self-approval denial | 0.95 | 1.00 | +0.10 | employee cannot resolve its own gate |
| σ30 scope lock | 1.00 | 1.00 | 0.00 | no research feature drift |
| σ40 secret custody | 0.10 | 1.00 | +1.80 | managed injection, rotation, no-leak proof |
| ν46 packed parity | 1.00 | 1.00 | 0.00 | packed-consumer CI |
| ν47 compatibility | 1.00 | 1.00 | 0.00 | compatibility CI |
| ν51 durability proof | 0.75 | 1.00 | +0.50 | database/crash evidence |
| ν52 isolation proof | 0.75 | 1.00 | +0.50 | two-employee/tenant/network proof |
| ν53 idempotency validation | 0.60 | 1.00 | +0.80 | concurrency/replay/failure tests |
| π56…π64 | 0.00 | 0.90 | +1.80 after gate | coordinated live acceptance |
| π65 deploy readiness | 0.10 | min π56…π64 | gated | evidence-derived release state |
| ρ66 PDE | 0.10 | 0.10 production | 0.00 | separate research basin |
| ρ67 CSG | 0.10 | 0.10 production | 0.00 | separate research basin |
| χ73 focus | 0.70 | 0.90 | +0.40 | exception-first stable layout |
| χ74 load | 0.60 | 0.30 | -0.60 | batching, active saves, concise rationale |
| χ75 trust | 0.50 | 0.90 | +0.80 | evidence, parity, visible recovery |
| χ76 fatigue | 0.30 | 0.20 | -0.20 | fewer redundant decisions, gates preserved |

## Cross-partials

[VERIFIED] Smooth cross-partials are zero for the supplied additive quadratic terms.

[INFERRED] Non-zero interaction arises through:

- discontinuous hard walls;
- gate predicates;
- minimum definition for π65;
- operational feedback loops such as load ↔ fatigue;
- phase transitions from mock/source evidence to live provider/deployment evidence.
