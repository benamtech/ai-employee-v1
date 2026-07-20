# Hermes UI Heartbeat Architecture

**Status:** fixture-first architecture; production emission not yet accepted  
**Date:** 2026-07-19  
**Scope:** owner web, fixture operating lab, support diagnostics, future Hermes/Manager stream evolution

## 1. Ground truth

AMTECH already uses a state-projection architecture rather than a blocking chat client:

```text
Hermes execution and session substrate
-> Manager authority, C3, projection, and owner-safe stream
-> Next SSE pass-through
-> AgentSurface snapshot + bounded deltas
```

The current production stream contract is intentionally small:

- `snapshot`
- `work_event`
- `work_progress`
- `approval_update`
- `run_completed`

Manager is the projection and authority boundary. The browser does not consume raw Hermes stdout, stderr, tool names, prompts, memory files, process IDs, container metrics, provider payloads, or private reasoning.

A heartbeat is **liveness evidence only**. It is not evidence that a command was accepted, work is correct, an external effect occurred, or a receipt exists.

## 2. Owner-safe heartbeat projection

The fixture lab may exercise a future optional frame with this bounded shape:

```ts
interface OwnerSafeRuntimeHeartbeat {
  kind: "runtime_heartbeat";
  run_id: string;
  sequence: number;
  observed_at: string;
  phase: "starting" | "working" | "waiting" | "reconciling" | "recovering";
  health: "active" | "waiting" | "stalled" | "recovering";
  summary: string;
  assignment_id: string;
  employee_id: string;
  context_version?: string;
}
```

Rules:

1. `summary` is an owner-safe work verb, never a tool name or raw log line.
2. Assignment, employee, run, and context version must match the mounted surface.
3. Sequence must increase monotonically within one run.
4. A heartbeat may update liveness presentation only. It cannot mutate authority, approval, command, effect, receipt, price, identity, or evidence.
5. Missing heartbeat after a declared supported interval may display `stalled` or `reconciling`; it must not resend the owner command.
6. Browser code never kills, restarts, or patches a runtime. Manager, provisioner, reconciler, and operator tooling own recovery.
7. Completion is accepted only when terminal command/run state agrees with durable receipt and projection state.

## 3. Two visibility planes

### Owner plane

The owner sees only the state needed to avoid frustration and duplicate commands:

```text
Starting
Working: reconciling 42 open orders with material inventory
Waiting on supplier reply
Connection lost after start; AMTECH is reconciling, do not resend
Completed; proof recorded
```

The owner plane may show elapsed time and last confirmed activity. It does not show CPU, RSS, PID, raw tool calls, terminal output, context tokens, provider route internals, or hidden prompts.

### Support/developer plane

A future authenticated operator surface may show bounded diagnostics when necessary:

- exact run/session/profile/assignment identity;
- transport state and last sequence;
- queue and lease state;
- aggregated throughput and dropped-line counts;
- redacted failure class;
- recovery/reconciliation record;
- links to retained logs behind support authority.

Raw traces remain rate-limited, redacted, assignment-scoped, retention-bounded, and separate from owner UI.

## 4. Stream reduction and backpressure

Raw execution streams can overwhelm the browser and obscure business state. Manager should reduce high-volume runtime signals before owner projection:

```text
raw stdout/stderr/tool activity
-> classify and redact
-> rate and byte budget
-> coalesce repeated lines
-> retain bounded diagnostic artifact
-> emit owner-safe progress verb or meaningful work event
```

Required behavior:

- never stream token-by-token reasoning;
- never send unbounded stdout/stderr to the owner surface;
- coalesce repetitive lines and retain an aggregate count;
- bound frame size, rate, queue depth, and reconnect backlog;
- prefer a fresh snapshot when the cursor gap is too large;
- preserve stable event IDs and order;
- reconnect is state recovery, not command replay.

## 5. Context spectator boundary

The owner may inspect the compiled `OperatingContextManifest`, rationale codes, context fingerprint, profile label/version, session identity, dominant domains, and owner-safe signals.

The UI must not expose or directly edit:

- raw `MEMORY.md`, `USER.md`, AGENTS.md, CODEGRAPH.md, soul files, or skills;
- private episodic/vector retrieval contents;
- provider prompts or chain-of-thought;
- credentials, raw connector payloads, or internal cache state.

Context changes enter through governed owner facts, explicit preferences, profile/package operations, or support-authorized workflows. The browser does not write directly to Hermes or its local database.

## 6. Fixture operating lab

The fixture lab exists to test ambitious product shapes through the real typed `AgentSurface` before provider/runtime wiring:

1. **AI employee as website** — visitor intent, qualification, public/private boundary, handoff, return condition, and evidence.
2. **Contractor employee** — estimate, customer reply, deposit, scheduling, follow-up, and signed review.
3. **Multi-person office** — role-aware delegation across owner, dispatcher, estimator, bookkeeper, and field staff without exposing internal agent topology.
4. **Personal operating brain** — explicit saves, recurring review, memory provenance, and no silent external effects. Research-only relative to the current commercial beachhead.
5. **Research employee** — question, source trail, competing claims, delegated review, contradiction, synthesis, and evidence.
6. **Independent clothing operations employee** — Shopify/email/business-brain context, order-to-material requirements, supplier pricing, production capacity, fulfillment exceptions, margin impact, purchase approval, and proof.

Every fixture:

- uses owner-safe typed contracts;
- is visibly labeled `fixture_demonstration`;
- performs no provider, customer, money, publishing, or inventory effect;
- uses deterministic local frames and commands;
- can be run against a compiled production build only through the exact CI-only fixture tuple;
- cannot count as G10 fixture-free acceptance.

## 7. Optimistic interaction model

A fixture command follows the production-shaped interaction grammar:

```text
owner outcome
-> stable local fixture intent
-> exact fixture employee + assignment + context
-> forming work loop
-> bounded delegated unit
-> owner-safe heartbeat/progress frames
-> decision or active save when required
-> draft evidence
-> explicit fixture completion label
```

The fixture may simulate a stalled heartbeat and recovery, but the UI must state that no command was resent and no real runtime was restarted.

## 8. Rejected interpretations

The following do not enter the owner UI architecture:

- browser-triggered self-healing scripts;
- raw CPU/RSS/PID engineering visualizers for ordinary owners;
- live editable private memory and prompt layers;
- private chain-of-thought or scheming trajectories;
- attention, sentiment, fatigue, personality, or approval-propensity inference;
- WebGPU reaction-diffusion as a release UI dependency;
- raw diff/log streaming without reduction and authority boundaries;
- fallback to another employee/profile/runtime after a started turn.

## 9. Production adoption gate

The optional heartbeat frame may enter the shared production stream only after:

1. Hermes/Manager emits assignment-bound monotonic frames from a real run;
2. disconnect, duplicate, reorder, stale-context, and cross-assignment tests pass;
3. browser watchdog proves no replay and no false completion;
4. frame rate and backpressure budgets pass under representative long-running work;
5. support diagnostics remain separately authorized and redacted;
6. fixture-free browser/runtime packets are retained on the exact deployed SHA.

Until then, heartbeat behavior is a fixture-lab capability and architecture contract, not production acceptance.
