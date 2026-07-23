# WS-02 Streaming and Protocol Source/CI Closure

Status: **hardened source/CI accepted; live connector/protocol acceptance open**  
Task: `AMTECH-P0-WS02-002`  
Base: `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
Hardened implementation evidence head: `16dc18e0535ac14f867875989dfe5aee596f89c0`

## Mirror Cabinet result

The first closure claim was rejected because PR `#31` was still at red exact head `7736271` while documentation cited green ancestor `6f792ea`. Structural review then found four additional conjugate surfaces where implementation and claimed invariants diverged. All were repaired before the hardened evidence run.

## What changed

### Assignment-scoped streaming employee environment

Hermes run-event deltas and safe activity are forwarded immediately through Manager. Web retains the durable operating workspace and adds a live-run console. Established-stream failure polls the same run, preventing duplicate tool/effect work.

Owner-visible progress channels are now keyed by account, employee, and assignment. Legacy producers without assignment authority do not broadcast live state; their durable work remains visible after reconciliation. Manager stream frames carry assignment and current authority version; private owner-session headers replace token-bearing URLs.

### Remote MCP authorization and custody

Manager derives protected-resource and authorization-server metadata, exact resource audience, issuer, redirect, scopes, PKCE, and state. Metadata fetches reject redirects and unsafe/cross-origin locations. Access and refresh tokens are validated then sealed using the current Manager encrypted-envelope backend. Managed KMS/secret-manager acceptance remains open.

### MCP Apps

Generated views compile into content-bound `ui://` resources with MCP App MIME/profile metadata, SHA-256 binding, opaque-origin sandboxing, an enforceable in-document CSP denying network/resources/frames/forms, bounded host methods, and finite `amtech.surface.intent`.

The host verifies iframe source/origin, resource hash, method, intent, and projected authority. It then posts through the first-party protocol-action route. Manager rechecks current assignment and authority version before creating an approval or owner-message command. Missing scope yields display-only UI.

### AG-UI

AMTECH Work Stream events map into ordered RUN/TEXT/STATE/ACTIVITY events. A first-party authenticated SSE endpoint terminates on authority-scope drift. Client commands are finite and can only re-enter existing approval or owner-message authority boundaries. Client-visible stream errors use a stable public code rather than raw internal exception text.

### Effective capabilities and MCP execution

Capability decisions intersect advertisement, runtime report, dependencies, credentials, network, current assignment relationship/policy, entitlement, current authority version, connector binding, provider-verification freshness, live-probe status, and evidence freshness. Reports persist failed dimensions. `tools/list` stays broad; immediately before `tools/call` dispatch, Manager re-reads current policy and authority version rather than trusting the authenticated credential snapshot.

### Capability manifold and evidence design

The deterministic generator emits 105 complete pairs and 357 dependency-connected or hazard-bearing triples. The selected 12-dimensional evidence design has trace `24.8120`, eigenvalues `[0.7097, 0.7638, 0.9892, 0.9928, 1.1822, 1.6285, 1.7464, 2.0988, 2.2327, 2.4611, 2.6651, 7.3418]`, minimum eigenvalue `0.7097`, condition number `10.3449`, and log determinant `6.0011`. This is an explicit test-design surrogate, not an empirical production likelihood estimate.

## Verification

On implementation evidence head `16dc18e`:

- Ratified Standard/governance `29735429854` — success;
- Hermes Upstream Review `29735429873` — success, pin unchanged;
- Main Integration `29735429859` — **110 files / 635 tests**, source/type/lint/contracts, production build, archaeology, and compiled Chromium — success;
- no migration, Standard clause, Hermes image, or provider pin changed;
- no current assertion was weakened.

## Failed attempts retained

- Documentation head `7736271` removed a canonical adapter sentence and failed Standard/Main Integration; exact-head closure was revoked and repaired.
- The first AG-UI cast failed TypeScript and was corrected explicitly.
- Bearer challenge parsing missed a parameter directly after the scheme and received a focused parser fix.
- One source assertion matched the historical local variable `e`; the secure source check remained valid and the local spelling was restored without weakening the assertion.
- The connector rejected several templated writes before GitHub received them; bounded alternative writes were used without force updates.

## Remaining gates

`ISS-011` remains open: live connector authorization, health, staleness, revocation, scope change, outage, repair, deletion, provider receipts, and exact-candidate evidence. External MCP Apps/AG-UI client conformance, managed database, target host, fixture-free channels, commercial controls, recovery, signed deployment, pilot, and production readiness are also open.

## Next move

1. merge or formally supersede PR `#31` after the final documentation head is green;
2. run the generic connector protocol against disposable remote MCP/OAuth and shipped connector sandboxes;
3. retain exact authorization/health/revocation/failure evidence for `ISS-011`;
4. start guarded WS-03 from then-current `main` using documents `17` and `18`.
