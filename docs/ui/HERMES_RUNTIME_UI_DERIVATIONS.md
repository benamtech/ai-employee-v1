# Hermes Runtime → AMTECH UI Derivations

**Status:** active research synthesis  
**Runtime:** `NousResearch/hermes-agent`  
**Purpose:** Convert concrete Hermes runtime strengths and failure modes into owner-facing interface requirements without moving authority out of Manager/C3.

## Boundary

Hermes remains the execution substrate for turns, sessions, streaming, tool behavior, recovery, and memory. Manager remains the authority, assignment, approval, command/effect, commercial, and proof boundary.

The UI may expose owner-safe runtime state. It must never treat Hermes profile, transport, provider, or session state as authorization.

## Evidence reviewed

- Hermes repository current source and architecture.
- PR #67280 — webhook skill/config lookup escaped the URL-resolved profile because profile-dependent work occurred outside the runtime scope and global caches did not invalidate on profile changes.
- PR #67271 — session ordering already used `last_active`, but the RPC projection dropped it, preventing clients from displaying or independently sorting resumable sessions.
- PR #67262 — cached async auxiliary wrappers did not close underlying transports, causing resource leaks during credential refresh and shutdown.
- PR #67261 — rotating xAI refresh tokens required one canonical shared credential owner, locking, migration, fail-closed shape validation, and explicit global/per-profile semantics.
- PR #67254 — desktop routing silently fell back to the primary gateway when the requested profile was unavailable and left stale secondary sockets open.
- PR #67256 — WebSocket fallback is safe only before a request starts; after `response.create`, replaying the turn through SSE would risk duplicate execution.
- PR #67255 — async auth recovery dropped `main_runtime`, rebuilding against the wrong provider/model/base URL and a different cache key.

## Derived invariants

### HRT-01 — Exact runtime identity is visible

Every live work surface must be able to show, inspect, or include in diagnostics:

- employee ID and display name;
- assignment ID;
- Hermes profile/runtime identity;
- session ID;
- provider/model route class;
- connection/transport state;
- last accepted activity.

Routine owner UI may summarize this as “Avery · connected · last active 2 min ago.” Support and proof views retain exact IDs.

### HRT-02 — No silent fallback

When the requested employee/profile/runtime is absent, stale, revoked, or disconnected, the interface fails closed. It must not route to a default employee, profile, provider, model, or gateway.

Required state:

```text
requested context unavailable
-> no turn started
-> owner-safe explanation
-> explicit retry, reconnect, or return action
```

### HRT-03 — Context binds the whole turn

Profile, skill, config, credential, provider, model, session, and assignment context are resolved before turn start and remain immutable for that turn. A UI component cannot combine state from different profiles or refresh caches without a context-version change.

### HRT-04 — Session recency is part of the contract

Session lists include a numeric `last_active`, stable session ID, created time, status, and profile/employee scope. Ordering and displayed timestamps use the same field. Empty sessions fall back to start time.

### HRT-05 — Started versus not-started is explicit

Transport and provider failures distinguish:

- `not_started` — no provider request accepted; a bounded fallback or retry may be safe;
- `started` — provider accepted the turn; do not replay automatically through another transport;
- `ambiguous` — acceptance/effect state cannot be proven; surface repair/reconciliation;
- `terminal` — accepted, failed, cancelled, or rejected with durable evidence.

The owner-facing state may be concise, but the command/proof view retains the exact classification.

### HRT-06 — Reconnect is not replay

SSE/WebSocket reconnect requests a fresh state snapshot or resumes from a durable cursor. It does not resubmit the owner message. The UI uses stable intent IDs and disables accidental duplicate submission while state is uncertain.

### HRT-07 — Runtime parity is tested

Sync/async, streaming/non-streaming, desktop/web/SMS, and primary/auxiliary paths must preserve the same runtime context fields and terminal-state semantics. Missing context on one path is a release failure.

### HRT-08 — Credential ownership is modeled

Connection UI distinguishes:

- credential owner/custodian;
- shared versus assignment-local scope;
- current generation/version;
- refresh state;
- per-employee disable versus global revoke;
- migration/reconnect requirement;
- affected employees.

The interface never copies or displays raw secrets. Shared credential status is not duplicated into misleading per-employee “independent” connections.

### HRT-09 — Resource lifecycle affects health

Transport/client cleanup failures are represented as runtime degradation before they become broad outages. Health checks include stale sockets, leaked/over-limit clients, reconnect churn, credential-refresh eviction, and shutdown completion.

### HRT-10 — Global caches are scope-keyed

Any browser or server cache containing capabilities, skills, connections, sessions, or work resources is keyed by assignment + employee + profile/context version. Switching employees invalidates incompatible cached data before rendering.

## UI patterns

### Runtime identity strip

A quiet strip in owner/support surfaces:

```text
Avery · Ready · last active 2m · Email connected
```

Expanded diagnostics:

```text
employee emp_...
assignment asn_...
profile contractor-estimator
session tsess_...
transport SSE connected
provider route main-runtime-v3
context version 18
```

### Turn lifecycle

```text
Queued
-> Starting
-> Working
-> Waiting for you | Waiting on provider
-> Completed + proof
```

Exceptional branch:

```text
Starting failed (not started) -> safe retry
Connection lost after start -> reconciling, do not resend
Ambiguous -> repair action + proof inspection
```

### Profile/employee switch

1. stop accepting input;
2. close or detach prior stream;
3. clear scope-keyed state;
4. resolve the new exact assignment/runtime;
5. fetch snapshot;
6. render identity confirmation;
7. re-enable input.

No primary/default fallback is permitted.

## Validation additions

- Switch between two employees with same-named skills and prove no cross-profile content.
- Remove the selected runtime and prove the UI fails closed rather than falling back.
- Disconnect during a started turn and prove no automatic replay.
- Reconnect and prove snapshot/cursor resume without duplicate visible work.
- Rotate credentials and prove cached clients close and the UI updates connection generation.
- Exercise async auxiliary recovery and prove provider/model/base URL context is preserved.
- List sessions and prove `last_active` is present, numeric, displayed, and used for ordering.
- Exercise shared credential disable/revoke and prove the affected-scope copy is exact.

## Adoption rule

These are runtime-derived UI invariants, not speculative feature ideas. New Hermes versions or patches are reviewed against this file before AMTECH runtime upgrades. Relevant changes update the validation vectors and acceptance packet.
