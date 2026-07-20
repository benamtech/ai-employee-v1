# Connector, MCP Apps, and AG-UI Program

Status: P0/P1 protocol execution companion  
Primary Standard clauses: `CCIP-6.1` through `CCIP-6.10`

## Canonical stack

```text
AMTECH labor protocol
  assignment → work object → authority → approval → effect → receipt → recovery

MCP core
  tools/resources/prompts + protected-resource authorization

MCP Apps
  optional negotiated ui:// interactive resources in an isolated host

AG-UI
  optional agent↔user run/message/activity/tool/state event adapter

AMTECH clients
  Web | SMS | signed Review | connected-system events | future voice
```

None of MCP, MCP Apps, AG-UI, or a provider authorization token creates AMTECH assignment authority.

## Connector manifest contract

Every native connector declares:

- stable key, aliases, provider, and category;
- custody and actual authorization protocol;
- setup flow, start tool, and descriptor-bound continuation;
- scopes/permissions;
- exact authorization or onboarding hosts;
- proof fields containing the provider redirect;
- credential custody, rotation, health, revocation, and audit posture;
- owner-safe permission language;
- effect and approval profile.

Current adapters:

- Gmail — OAuth authorization code;
- QuickBooks — OAuth authorization code;
- Stripe — provider-managed Connect onboarding;
- arbitrary read-only MCP — direct only when metadata proves no write, money, or customer-facing risk;
- unknown/consequential connector — Manager-mediated and not self-service until reviewed.

## P0 sequence

### P0-C1 — Complete setup-manifest enforcement

Success criteria:

- [ ] every self-service connector setup is descriptor-driven;
- [ ] browser code cannot select tool, scope, host, credential mode, or continuation;
- [ ] every redirect is HTTPS and exact-host allowlisted;
- [ ] unknown setup is 404/fail-closed;
- [ ] OAuth-only compatibility functions cannot expose Stripe as OAuth;
- [ ] connector health and revocation map to capability effectiveness.

Primary files:

- `packages/shared/src/connector-registry.ts`
- `packages/shared/src/connector-setup.ts`
- `apps/manager/src/lib/artifact-workbench-routes.ts`
- `apps/web/app/api/employee/[employeeId]/connect/[connector]/route.ts`
- `apps/web/app/agent/[employeeId]/connect/[connector]/page.tsx`
- `apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx`

### P0-C2 — Remote MCP authorization profile

Success criteria:

- [ ] protected-resource metadata is discovered and validated;
- [ ] authorization-server metadata is discovered from trusted metadata, not tool text;
- [ ] resource audience is exact;
- [ ] PKCE/state/redirect validation are covered;
- [ ] tokens stay in Manager custody for consequential servers;
- [ ] only explicitly declared read-only direct MCP enters employee runtime;
- [ ] revocation/staleness makes capability ineffective.

### P0-C3 — MCP Apps host adapter

Success criteria:

- [ ] client/server negotiate MCP Apps support;
- [ ] tool-associated `ui://` resource is fetched through MCP resource contract;
- [ ] HTML runs in opaque-origin sandbox with declared CSP and permissions;
- [ ] JSON-RPC bridge exposes only bounded host methods;
- [ ] requested action intersects current assignment-scoped `WorkAction` set;
- [ ] UI has no raw credential, database, MCP-server, or provider network authority;
- [ ] consequential host calls retain audit and proof.

Current AMTECH generated views remain supported. The adapter converts compatible generated resources; it does not replace durable work objects.

### P1-C4 — AG-UI adapter

Success criteria:

- [ ] versioned mapping for run lifecycle, text, activity, tool calls, snapshot, and delta events;
- [ ] stable IDs and replay order;
- [ ] role-safe projection only;
- [ ] client actions become authorized AMTECH commands;
- [ ] shared state is recoverable projection, not authority;
- [ ] compatibility tests cover reconnect, duplicate delivery, stale state, and authority revocation.

## Provider-specific code policy

Provider adapters are expected where protocols differ. Provider-specific **ontology** is prohibited.

Allowed:

- token exchange differences;
- provider webhooks/signatures;
- provider-specific scopes and health checks;
- provider-specific effect and reconciliation adapters.

Forbidden:

- hardcoding one provider from a broad category such as `accounting`;
- browser-selected Manager tool names;
- generic redirect of unknown authorization URLs;
- treating hosted onboarding, service accounts, or API keys as OAuth;
- bypassing assignment, approval, effect, or receipt boundaries because a provider SDK offers a direct call.

## Verification

```bash
npm run test:standard
npm run test:ui:contracts
npm run test:production-boundary
npm run typecheck
npm run build
```

Release acceptance additionally requires real connector setup, health, revocation, failure-path, runtime capability, and provider receipt evidence on the exact deployed candidate.
