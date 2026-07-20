# WS-02 Streaming and Protocol Source/CI Closure

Status: source/CI accepted; live connector/protocol acceptance open  
Task: `AMTECH-P0-WS02-002`  
Base: `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
Implementation evidence head: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4`

## What changed

### Streaming employee operating environment

Hermes run-event deltas and safe activity are forwarded immediately through Manager. Web retains the durable operating workspace and adds a live-run console. Established-stream failure polls the same run, preventing duplicate tool/effect work. Manager stream frames carry assignment and current authority version; private owner-session headers replace token-bearing URLs.

### Remote MCP authorization and custody

Manager derives protected-resource and authorization-server metadata, exact resource audience, issuer, redirect, scopes, PKCE, and state. Metadata fetches reject redirects and unsafe/cross-origin locations. Access and refresh tokens are validated then sealed as Manager-held secret references.

### MCP Apps

Generated views compile into negotiated `ui://` resources with MCP App MIME/profile metadata, SHA-256 content binding, opaque-origin sandboxing, no direct network, bounded host methods, and finite `amtech.surface.intent`. Actions require assignment/version/resource/action projection; missing scope yields display-only UI.

### AG-UI

AMTECH Work Stream events map into ordered RUN/TEXT/STATE/ACTIVITY events. A first-party authenticated SSE endpoint terminates on authority-scope drift. Client commands are finite and can only re-enter existing approval or owner-message authority boundaries.

### Effective capabilities and MCP execution

Capability decisions now intersect advertisement, runtime report, dependencies, credentials, network, policy, entitlement, authority version, connector binding, live probe, and freshness. Reports persist failed dimensions. `tools/list` stays broad, while `tools/call` is intercepted after credential verification and before Manager tool dispatch.

### Capability manifold

The deterministic generator emits 105 complete pairs and 357 dependency-connected or hazard-bearing triples. Every entry includes full dimension names, operator, hypothesis, exact API surfaces, red-test trajectory, verification state, DEF-001–004 mapping, business/risk rating, utility, and impossibility proof where applicable.

## Product/UX consequence

The Web client remains SaaS-legible but behaves like an employee OS: persistent workspace, live conversation, current activity, connected systems, approvals, contextual apps, artifacts, proof, and recovery. Safety is not implemented as artificial slowness. Harmless projection streams first; authority becomes visible only when the user crosses into connection, approval, credential, or external-effect decisions.

## Verification

- Ratified Standard/governance: `29731384034` — success.
- Hermes Upstream Review: `29731384166` — success; pin unchanged.
- Main Integration: `29731384039` — broad 109/630, source contracts, build, archaeology, compiled Chromium — success.
- No migration, Standard clause, Hermes image, or provider pin changed.

## Failed attempts retained

- Initial AG-UI cast failed TypeScript and was corrected explicitly.
- Bearer challenge parsing missed a parameter directly after the scheme and received a focused parser fix.
- Earlier source assertions matched imports/legacy MCP-UI markers rather than current invocation/security boundaries; full authoritative suites were restored before changing only obsolete expectations.
- The connector contents API rejected two templated writes; equivalent atomic tree commits were used without force updates.

## Remaining gates

`ISS-011` remains open: live connector authorization, health, staleness, revocation, scope change, outage, repair, deletion, provider receipts, and exact-candidate evidence. External MCP Apps/AG-UI client conformance, managed database, target host, fixture-free channels, commercial controls, recovery, signed deployment, pilot, and production readiness are also open.

## Next move

Run the generic connector protocol against disposable remote MCP/OAuth and shipped connector sandboxes, retain exact authorization/health/revocation/failure evidence, then proceed to WS-03 database authority.