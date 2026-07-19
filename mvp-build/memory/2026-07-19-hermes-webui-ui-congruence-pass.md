# 2026-07-19 — Hermes/WebUI research and UI congruence pass

## Branch and proof anchor

- Branch: `employee-production-tuesday`
- Draft PR: `#23` into `research`
- Implementation/CI anchor: `e0a585290c3eb0ef78e1ac23cfcbe631facba347`
- `main`: untouched

## Status

`ci-accepted` for the source and compiled fixture/product-shell scope described below on the implementation anchor. This does not claim real-Supabase, provider, fixture-free browser/channel, commercial, deployment, or launch acceptance.

## Research disposition

Official Hermes Agent surfaces examined:

- ACP over stdio;
- TUI gateway JSON-RPC;
- OpenAI-compatible HTTP/SSE;
- the separate `hermes mcp serve` messaging-channel bridge over stdio;
- the internal curated Hermes-tools stdio MCP bridge used by the Codex app-server runtime.

`NousResearch/hermes-agent#360` is closed because ACP, the TUI gateway, and HTTP/SSE cover the proposed general RPC use cases.

A final source verification corrected the MCP claim:

- the current command is `hermes mcp serve`, not `hermes serve-mcp`;
- the current parser exposes `serve`, `--verbose`, and shared hook acceptance, not HTTP transport or port flags;
- the current implementation runs FastMCP over stdio;
- it exposes a fixed conversation/message/event/channel/permission bridge rather than the full Hermes native tool registry;
- `messages_send` calls the send-message tool directly;
- `permissions_respond` is best-effort without gateway IPC and only updates bridge-local observed state;
- event cursor and pending-approval state are process-local and non-durable.

AMTECH therefore does not adopt this MCP server in the owner or ordinary employee path. A post-baseline platform-operator experiment may wrap a dedicated employee's process and allowlist read-only conversation/history/event methods, but only behind Manager platform authority, tenant/runtime isolation, redaction, bounded output, audit, and independent durable verification. Direct message sending and approval response remain denied outside C3.

The internal curated Hermes-tools MCP bridge provides a separate useful pattern:

- authored `EXPOSED_TOOLS` allowlist intersected with the authoritative runtime tool definitions;
- authoritative JSON-schema reuse for generated MCP call signatures;
- duplicate host-owned shell/filesystem/process capabilities omitted;
- loop-bound delegation, memory, session-search, and todo tools omitted because stateless callbacks cannot supply live `AIAgent` context.

AMTECH adapts that compiler pattern only. No Hermes MCP runtime was installed because the live `/v1/toolsets` probe is not yet persisted or combined with Manager schemas, connector readiness/custody, assignment/grants, entitlements, runtime revision, and policy into one immutable effective-capability proof. Adding another route now could overstate tool availability and duplicate effect authority.

The deep review of `nesquena/hermes-webui` yielded bounded techniques rather than an adoptable product architecture:

- fail closed on loaded-runtime source revision drift;
- read live session state through conservative read-only projections;
- normalize source/session vocabulary and collapse compression lineage;
- separate stream ownership from transport attachment and browser lifetime;
- default extensions off, bound assets/state/redirects, keep same-origin paths strict, persist atomically, and consent separately to sidecar proxy authority;
- do not reuse its single-user/process-global environment assumptions for AMTECH tenancy.

The useful lesson from `jozef-barton/the-kitchen@43adc3e` is protocol congruence: declared generated section kinds, live registry, renderer, preview fixtures, and tests must be one finite vocabulary. No recipe-specific UI vocabulary was imported.

Canonical decision record:

- `mvp-build/docs/ux/09-hermes-programmatic-integration-and-webui-findings.md`

## Implementation

### Canonical adaptive planner parity

The canonical planner in `mvp-build/packages/shared/src/operating-layout.ts` already implemented deterministic focus selection through explicit state precedence, newest `updated_at`, and stable ID tie-breaking. It also bounded event-volume priority and encoded explicit rationale for high-risk decisions, reached active saves, and material delegated failures.

Changed `mvp-build/packages/shared/src/operating-system.ts` and `mvp-build/tests/unit/amtech-agent-ui-contract.test.ts`:

- removed the second planner implementation from the contract module;
- re-exported the canonical V2 planner from the contract module;
- added package-root/direct-module parity coverage so scoring and focus semantics cannot silently diverge again.

### Generated-view congruence and design-system alignment

Changed `mvp-build/apps/manager/src/lib/ui-resources.ts` and `mvp-build/tests/unit/ui-resources.test.ts`:

- replaced the renderer switch with an exhaustive `Record<WorkView["kind"], WorkViewRenderer>` registry;
- every declared `WorkView` kind now compiles in contract tests;
- preserved Manager-owned templates, escaping, sandboxed host rendering, and approval-bound intent envelopes;
- removed the independent dark-mode branch;
- changed primary generated actions from generic blue to AMTECH red;
- enforced 44px controls, visible focus, canonical light colors, and reduced-motion behavior;
- retained text-card fallback on compile failure.

### CI and production-build browser harness

Changed:

- `mvp-build/package.json`
- `.github/workflows/ui-agent-operating-surface.yml`
- `mvp-build/apps/web/app/login/layout.tsx`

The pass:

- added `ui-resources.test.ts` to `test:ui:contracts`;
- made generated-view compiler/test changes trigger the UI workflow;
- restored the exact web typecheck artifact filename after an intermediate workflow-edit regression;
- replaced the hardcoded standalone Next server path with bounded `server.js` discovery excluding `node_modules`;
- retained server-readiness diagnostics and evidence upload;
- fixed the browser-discovered 80×22 login brand link to a full 44px target instead of weakening the target assertion.

## Exact CI evidence on `e0a585290c3eb0ef78e1ac23cfcbe631facba347`

- Phase 2 Remediation Plan Integrity — run `29683146460`: success
- Lane 1 Relationships and Authorization — run `29683146457`: success
- S10.1 Onboarding Identity Authority — run `29683146465`: success
- S2 S7 S9 Production Boundary — run `29683146476`: success
- Employee Work Production Boundary — run `29683146456`: success
- Lane 10 Integrated CI and Release Evidence — run `29683146463`: success
- Agent Operating Surface Standard — run `29683146482`: success

The UI workflow success includes:

- shared/db/Manager/web typecheck and required builds;
- UI source validation;
- focused UI contract tests, including generated-view and adaptive-planner export parity;
- compiled production Next build;
- adaptive fixture browser acceptance;
- unauthenticated login/dashboard product-shell acceptance;
- uploaded browser/screenshots/log evidence.

## Boundaries preserved

- Manager remains the control plane.
- Hermes remains the runtime substrate.
- C3 remains the only consequential command/effect ledger.
- capability discovery is not authorization;
- owner access remains exact principal + assignment + grants + policy;
- generated UI remains typed data compiled by Manager, never raw model HTML;
- no browser talks directly to Hermes or receives runtime credentials;
- no Hermes MCP write or approval path was added;
- no database, authority, approval, commercial, provider, or runtime semantics changed in this pass.

## Unresolved risks

1. The approved real Supabase staging target still needs migrations and behavior proof.
2. Provider-backed generative UI remains unaccepted until one real business-context work object traverses typed view, owner action, external effect, and durable proof IDs.
3. Runtime capability/toolset probes and the effective-capability graph hash are not yet persisted.
4. A future effective-capability compiler must intersect authored Manager allowlists, observed Hermes registry/toolsets, connector custody/readiness, assignment/grants, entitlement, policy, runtime revision, and execution context.
5. A future Hermes TUI adapter must begin read-only and remain Manager/platform-authority/C3 mediated.
6. A future `hermes mcp serve` experiment must be dedicated-runtime and read-only, deny send/approval tools, treat cursors as non-durable, and prove tenant isolation.
7. Shared/fractional cross-account employee assignment, broad role perspectives, public employee behavior, commercial reconciliation, capacity, recovery, rollback, deployment manifest, and fixture-free live browser/SMS/Review proof remain outside this pass.

## Next concrete move

Return to the release-critical normal-employee path: identify the approved staging target, apply/verify migrations, capture fixture-free owner/runtime/provider/effect/receipt evidence on one SHA, and only then run the first provider-backed generated-view acceptance slice. Treat persisted effective-capability evidence, a read-only Manager runtime-session projection, and any read-only Hermes MCP/TUI operator adapter as post-baseline P1/P2 work.
