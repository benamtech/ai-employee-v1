# 01 — Product, Business, and System Context

Status: **[VERIFIED] current product primitives; [INCOMPLETE] launch acceptance**

## Product purpose

AMTECH packages a managed Hermes runtime as an accountable business employee. The product is not the model endpoint, a chat wrapper, an estimate-only application, or unrestricted remote shell access. The product boundary consists of:

- a named employee with a durable profile, memory, runtime, session, and assignment;
- an owner and operator experience for giving direction, reviewing work, approving effects, and inspecting evidence;
- Manager-owned tools, resources, authority, connectors, approvals, commercial attribution, audit, and repair;
- a per-employee Model Gateway credential that separates provider master credentials from employee runtimes;
- durable event and command/effect paths that preserve idempotency, ambiguity, and proof.

Primary source surfaces:

- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/hermes-client.ts`
- `apps/manager/src/lib/mcp-server.ts`
- `apps/manager/src/lib/operating-surface.ts`
- `apps/web/app/agent/[employeeId]/AgentSurface.tsx`
- `packages/db/migrations/0039_labor_relationship_authorization_foundation.sql`
- `packages/db/migrations/0041_command_effect_assignment_kernel.sql`
- `packages/db/migrations/0064_onboarding_identity_activation_authority.sql`
- `packages/db/migrations/0069_owner_activation_surface_authority.sql`

## Actors and relationship primitives

### Business owner

[VERIFIED] A human authenticates through Supabase Auth. Manager resolves the public user and current owner/admin account membership, then mints a bounded owner session. Account membership establishes access to account selection and activation, but employee operation requires an explicit assignment principal and resource grant.

Sources:

- `apps/web/app/api/auth/login/route.ts`
- `apps/manager/src/lib/onboarding-identity-routes.ts`
- `apps/manager/src/lib/owner-session.ts`
- `apps/manager/src/lib/owner-assignment-authority.ts`

### Employee principal

[VERIFIED] An AI employee is represented by an employee row and an employee principal. Assignment, employment, commercial, policy, credential, and runtime records bind to that identity. Hermes is the runtime substrate for the employee principal; Hermes itself is not the authority record.

### Manager control plane

[VERIFIED] Manager resolves identity, assignment, grants, policy, approvals, commercial scope, resources, and tool schemas. It is the only application plane that can bind model-produced intent to durable AMTECH authority.

### Platform operator

[VERIFIED] Platform-admin roles and bounded support leases exist separately from owner authority. Operator actions require server-side role checks, support reason/lease context where applicable, and audit records.

### External providers

[VERIFIED] Gmail, Stripe, Twilio, QuickBooks, identity, and model providers are treated as external systems with independently verified ingress and receipt-bearing egress. Provider payloads are normalized before entering owner or employee context.

## Authority hierarchy

The operative relationship is:

```text
human identity
  → account membership
  → explicit assignment principal
  → current resource grant
  → current assignment authority policy
  → optional approval/step-up gate
  → durable command/effect claim
  → provider or runtime effect
  → durable receipt/evidence
```

Account membership alone is not employee authority. A model-provided account, employee, assignment, principal, approval, payer, or policy identifier is not authority. Manager derives or verifies those values from the authenticated boundary.

## System planes

### Plane A — Identity and organization

Persistent entities include users, accounts, organizations, human/employee/service/platform principals, account memberships, assignments, labor relationships, assignment principals, grants, policies, payer relationships, and beneficiary relationships.

Emergent capability: the same employee can be described across employment, management, custody, payer, and beneficiary relationships without collapsing those meanings into one role string.

### Plane B — Runtime and cognition

The employee profile renderer creates the Hermes-facing configuration, memory files, Manager MCP configuration, Model Gateway configuration, workspace pointer, and checksum manifest. The Host Provisioner starts a Hermes gateway container from that rendered profile. Manager uses Hermes sessions or runs through `hermes-client.ts`.

Emergent capability: employee continuity is independent of one browser session because identity, assignment, profile, runtime endpoint, session key, work runs, messages, artifacts, and events are durable outside the browser.

### Plane C — Context and goals

Static or slowly changing business context is compiled from onboarding manifest/profile slots and durable business-brain facts. Live state remains in Manager resources: connectors, work queue, artifacts, approvals, capabilities, and runtime health. Prior conversational context is available through Hermes session continuity and session search.

Emergent capability: the employee can understand a business goal without requiring every task to be pre-modeled as a bespoke workflow. The operating-surface compiler projects task-agnostic loops, active saves, decisions, delegated work, changes, and evidence from shared primitives.

### Plane D — Work and effects

Work enters through owner turns, scheduled jobs, provider events, ambient events, or operator commands. Read-only work can be served from resources and snapshots. Consequential work is registered and executed through durable command/effect or approval paths.

Emergent capability: proposals, drafts, estimates, invoices, messages, schedule changes, connector operations, and future tools can share the same authority and evidence kernel.

### Plane E — Experience

The owner experience is rendered from `ResourcePayload`, `OperatingSurfaceState`, `SurfaceEnvelope`, `WorkResource`, `WorkAction`, `CapabilityGraphNode`, `ConnectionSurface`, and `ResurfaceItem`. Generated UI is a typed presentation layer compiled by Manager and hosted by the same resource/action model.

Emergent capability: Web, SMS, signed mobile review, admin, and future desktop/email surfaces can represent the same work object without letting channel-specific UI become the source of truth.

### Plane F — Commercial attribution

Model and provider usage is bound to assignment, payer relationship, beneficiary relationship, and price version. Model Gateway credentials embed the current scope and are checked against durable commercial state before dispatch.

Emergent capability: one managed employee can serve a beneficiary while another organization pays, without attributing cost solely from account ownership.

### Plane G — Evidence, recovery, and operations

Audit rows, work-run IDs, command/effect receipts, ambient effect receipts, provider receipts, accounting receipts, runtime health, provisioning resource state, and profile checksums establish reconstructable lineage.

Emergent capability: support, compliance, billing, incident response, and owner trust can inspect the same underlying proof chain.

## Business experiences established by current primitives

### Owner activates an employee

1. Owner authenticates and selects an account.
2. Identity verification establishes an immutable verified snapshot.
3. Canonical activation creates employee, employee principal, assignment, employment relationship, commercial relationships, profile build, desired runtime graph, command, and accepted activation receipt.
4. Explicit owner assignment authority receives the canonical surface grant.
5. Reconciler and Host Provisioner create runtime/profile/network/routing/provider resources.
6. Owner opens the operating surface and receives a strict assignment-scoped snapshot.

Tag: [VERIFIED] source and blank-PostgreSQL matrix; [INCOMPLETE] approved staging/provider/target-host proof.

### Owner delegates a business goal

1. Browser sends a stable intent ID with the owner message.
2. Manager resolves exact session and assignment authority.
3. A durable owner web turn is claimed.
4. Manager compiles current business/operating context and delivers the turn to Hermes.
5. Hermes can reason, read Manager resources, use employee-callable Manager tools, and use bounded runtime tools.
6. Work progress, events, decisions, artifacts, and receipts materialize back to the owner surface.

Tag: [VERIFIED] source; [INCOMPLETE] broad provider-backed acceptance matrix.

### Owner approves consequential work

1. A consequential deliverable obtains a durable approval row.
2. The approval becomes a WorkResource with exact actions.
3. Web, SMS, or signed review presents the same resource boundary.
4. Owner decision resolves through assignment and policy authority.
5. The resulting effect executes only through the existing tool/command boundary.
6. Provider and accounting receipts determine terminal success, failure, or ambiguity.

Tag: [VERIFIED] source/contracts; [INCOMPLETE] fixture-free cross-channel proof on deployed SHA.

## Commercial model implications

| Primitive | Commercial unit enabled | Current implementation state |
|---|---|---|
| Employee runtime | managed employee subscription / capacity | [VERIFIED] runtime identity and provisioning source |
| Model Gateway | token/model/provider usage | [VERIFIED] request audit and cost estimate; [INCOMPLETE] cumulative budget enforcement |
| Assignment | customer, employee, and work scope | [VERIFIED] |
| Payer/beneficiary | third-party or shared service delivery | [VERIFIED] relationship model; [INCOMPLETE] full reconciliation/product policy |
| Approval | governed high-impact work | [VERIFIED] |
| Evidence retention | compliance/support tier | [VERIFIED] proof primitives; [INCOMPLETE] packaged retention/export product |
| Runtime recovery/SLA | reliability tier | [VERIFIED] reconciler/checkpoint primitives; [INCOMPLETE] live crash/restore SLA proof |
| Operator support | managed service tier | [VERIFIED] support authority/audit; [INCOMPLETE] complete operator UX and capacity proof |

## Product boundaries that remain intentionally incomplete

- [INCOMPLETE] Direct arbitrary Internet/MCP egress from an employee runtime is not part of the current isolated production network. External business systems are reached through Manager-mediated connectors and Model Gateway. A future direct-MCP egress substrate requires policy, custody, DNS, audit, and traffic enforcement.
- [INCOMPLETE] Shared/fractional employee product policy is not fully encoded even though payer/beneficiary and assignment primitives exist.
- [INCOMPLETE] Fleet-wide capacity, fairness, shared rate limits, and cumulative provider budgets are not fully enforced for 500+ simultaneously active runtimes.
- [INCOMPLETE] Live staging migrations, target-host Caddy/Docker acceptance, provider packets, failure injection, rollback, and fixture-free channel evidence remain launch gates.
