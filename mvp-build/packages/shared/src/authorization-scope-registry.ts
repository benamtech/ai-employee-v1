export const CONSEQUENTIAL_SURFACE_CATEGORIES = [
  "table",
  "manager_route",
  "sms_path",
  "signed_resource",
  "connector_binding",
  "owner_session",
  "admin_support_action",
  "commercial_row",
  "service_worker",
  "public_claim",
] as const;

export type ConsequentialSurfaceCategory = (typeof CONSEQUENTIAL_SURFACE_CATEGORIES)[number];

export const SCOPE_REQUIREMENTS = [
  "explicit_assignment",
  "assignment_resolver",
  "approved_platform_context",
  "approved_system_context",
  "noncanonical_diagnostic",
] as const;

export type ScopeRequirement = (typeof SCOPE_REQUIREMENTS)[number];

export const FORBIDDEN_AUTHORIZERS = [
  "account_membership_only",
  "employees_account_id_only",
  "bearer_possession_only",
  "caller_selected_account_or_employee",
  "mutable_header_identity",
  "phone_number_only",
  "signed_payload_without_resource_lookup",
] as const;

export type ForbiddenAuthorizer = (typeof FORBIDDEN_AUTHORIZERS)[number];

export interface ConsequentialSurfaceScope {
  key: string;
  category: ConsequentialSurfaceCategory;
  subject: string;
  source: string;
  laneOwner: "Lane 1" | "Lane 2" | "Lane 3" | "Lane 5" | "Lane 6" | "Lane 7" | "Lane 8" | "Lane 10";
  enabled: boolean;
  customerConsequential: boolean;
  scopeRequirement: ScopeRequirement;
  authorizationContract: "C1" | "C2" | "C3" | "C5" | "C6";
  allowedAuthorizers: readonly string[];
  deniedAuthorizers: readonly ForbiddenAuthorizer[];
  requiredEvidence: readonly string[];
  notes: string;
}

const allForbidden = FORBIDDEN_AUTHORIZERS;

export const ASSIGNMENT_SCOPE_REGISTRY = [
  {
    key: "table:employees",
    category: "table",
    subject: "employees",
    source: "accounts/employees compatibility rows consumed by owner dashboard and runtime lookup",
    laneOwner: "Lane 1",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["employee_principals -> employee_assignments", "amtech_authorize_assignment_action"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["cross-employee-denial", "revocation-denial-le-60s", "assignment-compatible-backfill"],
    notes: "employee_id remains identity; assignment_id or resolver owns access.",
  },
  {
    key: "table:employee_assignments",
    category: "table",
    subject: "employee_assignments",
    source: "packages/db/migrations/0039_labor_relationship_authorization_foundation.sql",
    laneOwner: "Lane 1",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "explicit_assignment",
    authorizationContract: "C1",
    allowedAuthorizers: ["assignment_principals", "assignment_resource_grants", "assignment_authority_policies"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["relationship-matrix", "disabled-cross-org-denial", "current-relationship-window"],
    notes: "canonical execution scope.",
  },
  {
    key: "table:assignment_principals",
    category: "table",
    subject: "assignment_principals",
    source: "packages/db/migrations/0039_labor_relationship_authorization_foundation.sql",
    laneOwner: "Lane 1",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "explicit_assignment",
    authorizationContract: "C2",
    allowedAuthorizers: ["current principal relationship", "role in assignment scope"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["wrong-role-denial", "revoked-principal-denial", "multi-account-user-isolation"],
    notes: "human, employee, service, and platform principals are relationship records, not bearer claims.",
  },
  {
    key: "table:assignment_resource_grants",
    category: "table",
    subject: "assignment_resource_grants",
    source: "packages/db/migrations/0039_labor_relationship_authorization_foundation.sql",
    laneOwner: "Lane 1",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "explicit_assignment",
    authorizationContract: "C2",
    allowedAuthorizers: ["resource_class/resource_id/action grant in assignment"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["resource-denial", "wildcard-grant-boundary", "revoked-grant-denial"],
    notes: "resource grants are the only permitted customer-resource widening mechanism.",
  },
  {
    key: "table:labor_relationships",
    category: "table",
    subject: "labor_relationships",
    source: "packages/db/migrations/0039_labor_relationship_authorization_foundation.sql",
    laneOwner: "Lane 1",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C1",
    allowedAuthorizers: ["relationship_type/status/timebox", "assignment_id for custody and assignment-specific work"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["custody-requires-assignment", "employment-subject-class", "ended-relationship-denial"],
    notes: "employment/management/supervision/custody are separate from account ownership.",
  },
  {
    key: "table:commercial_relationships",
    category: "commercial_row",
    subject: "commercial_relationships",
    source: "packages/db/migrations/0039_labor_relationship_authorization_foundation.sql",
    laneOwner: "Lane 5",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "explicit_assignment",
    authorizationContract: "C1",
    allowedAuthorizers: ["assignment_id", "payer_or_beneficiary_relationship"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["payer-beneficiary-split", "commercial-cross-assignment-denial", "invoice-reconciliation"],
    notes: "payer and beneficiary cannot be inferred from account membership alone.",
  },
  {
    key: "table:employee_messages",
    category: "table",
    subject: "employee_messages",
    source: "apps/manager/src/server.ts owner web and signed-preview message writes",
    laneOwner: "Lane 1",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["owner_session -> assignment", "signed_preview_link -> assignment", "employee_id/account_id compatibility resolver"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["wrong-employee-message-denial", "signed-preview-scope-denial", "sms-web-continuity"],
    notes: "message write/read must resolve through the same assignment as the visible employee surface.",
  },
  {
    key: "table:employee_sessions",
    category: "table",
    subject: "employee_sessions",
    source: "apps/manager/src/server.ts agent-context primer and CE-3 carryover",
    laneOwner: "Lane 7",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["mcp_credential -> employee/account -> assignment", "transcript_session_id under assignment"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["cross-session-context-denial", "rotation-carryover-once", "revoked-credential-denial"],
    notes: "session memory scope cannot authorize outside the credential assignment.",
  },
  {
    key: "table:runtime_endpoints",
    category: "table",
    subject: "runtime_endpoints",
    source: "owner dashboard runtime endpoint projection",
    laneOwner: "Lane 7",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["assignment-authorized owner dashboard", "runtime credential scoped to employee assignment"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["runtime-endpoint-cross-employee-denial", "credential-rotation-proof", "owner-projection-filter"],
    notes: "endpoint metadata is customer resource location and must not leak across assignments.",
  },
  {
    key: "table:artifacts",
    category: "table",
    subject: "artifacts",
    source: "artifact resolve route and work surface materialization",
    laneOwner: "Lane 8",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["artifact_link resource lookup", "owner_session -> assignment"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["artifact-wrong-employee-denial", "artifact-link-revocation", "storage-signed-url-scope"],
    notes: "artifact account/employee compatibility checks must be upgraded to assignment checks before launch acceptance.",
  },
  {
    key: "table:artifact_links",
    category: "signed_resource",
    subject: "artifact_links",
    source: "MANAGER_API.artifactResolve",
    laneOwner: "Lane 2",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["valid signed token", "token_hash row", "resource row account/employee/assignment match", "unexpired/unrevoked link"],
    deniedAuthorizers: ["bearer_possession_only", "signed_payload_without_resource_lookup", "caller_selected_account_or_employee", "mutable_header_identity"],
    requiredEvidence: ["forged-link-denial", "expired-link-denial", "revoked-link-denial"],
    notes: "signed payload is never enough without durable link/resource lookup.",
  },
  {
    key: "table:preview_links",
    category: "signed_resource",
    subject: "preview_links",
    source: "MANAGER_API.previewResolve and MANAGER_API.previewAction",
    laneOwner: "Lane 2",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["resolvePreviewLink", "token_hash row", "scoped allowed actions", "resource lookup"],
    deniedAuthorizers: ["bearer_possession_only", "signed_payload_without_resource_lookup", "caller_selected_account_or_employee", "mutable_header_identity"],
    requiredEvidence: ["wrong-action-denial", "terminal-single-consume", "preview-resource-cross-assignment-denial"],
    notes: "preview links bind action, resource, and assignment before exposing WorkAction.",
  },
  {
    key: "table:approvals",
    category: "table",
    subject: "approvals",
    source: "resolve_approval tool and preview action route",
    laneOwner: "Lane 2",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "explicit_assignment",
    authorizationContract: "C2",
    allowedAuthorizers: ["assignment authority policy", "principal-bound resolver grant", "durable command/effect claim"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["employee-self-approval-denial", "changed-snapshot-denial", "concurrent-resolve-single-claim"],
    notes: "approval resolution is consequential and must become command/effect-backed.",
  },
  {
    key: "table:owner_web_sessions",
    category: "owner_session",
    subject: "owner_web_sessions",
    source: "lib/owner-session.ts and owner dashboard/resource routes",
    laneOwner: "Lane 2",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["session token hash", "human principal", "current assignment principal"],
    deniedAuthorizers: ["bearer_possession_only", "account_membership_only", "caller_selected_account_or_employee", "mutable_header_identity"],
    requiredEvidence: ["revoked-session-denial", "role-change-denial-le-60s", "multi-account-session-isolation"],
    notes: "session proves the principal; it does not independently authorize every employee/resource.",
  },
  {
    key: "route:/manager/employee/:employeeId/message",
    category: "manager_route",
    subject: "owner web message route",
    source: "apps/manager/src/server.ts",
    laneOwner: "Lane 1",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["requireOwnerSession", "employee->assignment resolver", "amtech_authorize_assignment_action(message:create)"],
    deniedAuthorizers: ["account_membership_only", "employees_account_id_only", "bearer_possession_only", "caller_selected_account_or_employee"],
    requiredEvidence: ["wrong-employee-message-denial", "revoked-owner-message-denial", "message-audit-correlation"],
    notes: "current account_id + employee_id guard is compatibility only and remains a Lane 1 consumer target.",
  },
  {
    key: "route:owner-dashboard",
    category: "manager_route",
    subject: "MANAGER_API.ownerDashboard",
    source: "apps/manager/src/server.ts",
    laneOwner: "Lane 1",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["owner_session -> current assignments", "role-safe projection filter"],
    deniedAuthorizers: ["account_membership_only", "bearer_possession_only", "caller_selected_account_or_employee"],
    requiredEvidence: ["dashboard-cross-assignment-filter", "revoked-assignment-hidden", "multi-employee-isolation"],
    notes: "dashboard listing must be an assignment projection, not account-wide employee leakage.",
  },
  {
    key: "route:employee-resources",
    category: "manager_route",
    subject: "MANAGER_API.employeeResources",
    source: "apps/manager/src/server.ts",
    laneOwner: "Lane 1",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["owner_session -> assignment", "role-safe materialization"],
    deniedAuthorizers: ["account_membership_only", "employees_account_id_only", "bearer_possession_only"],
    requiredEvidence: ["resource-cross-assignment-denial", "role-safe-projection", "revoked-resource-denial"],
    notes: "work resources inherit assignment scope from the selected employee assignment.",
  },
  {
    key: "route:employee-stream",
    category: "manager_route",
    subject: "MANAGER_API.employeeStream",
    source: "apps/manager/src/server.ts",
    laneOwner: "Lane 1",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["owner_session query token", "employee->assignment resolver", "stream cursor scoped to assignment"],
    deniedAuthorizers: ["account_membership_only", "bearer_possession_only", "caller_selected_account_or_employee"],
    requiredEvidence: ["stream-cross-assignment-denial", "revoked-stream-close", "cursor-scope-proof"],
    notes: "SSE cannot keep emitting after assignment/session revocation.",
  },
  {
    key: "route:materialization-diagnostics",
    category: "manager_route",
    subject: "/manager/materialization/diagnostics",
    source: "apps/manager/src/server.ts",
    laneOwner: "Lane 8",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "approved_platform_context",
    authorizationContract: "C2",
    allowedAuthorizers: ["internal bearer", "platform support role", "support lease/customer reason before customer rows"],
    deniedAuthorizers: ["account_membership_only", "employees_account_id_only", "mutable_header_identity"],
    requiredEvidence: ["support-lease-required", "diagnostics-audit-event", "wrong-role-denial"],
    notes: "diagnostics is platform access to customer state and must be support-lease gated.",
  },
  {
    key: "route:admin-account-detail",
    category: "admin_support_action",
    subject: "/manager/admin/accounts/:accountId",
    source: "apps/manager/src/server.ts",
    laneOwner: "Lane 2",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "approved_platform_context",
    authorizationContract: "C2",
    allowedAuthorizers: ["platform role", "recordSupportAccess", "reason", "support lease"],
    deniedAuthorizers: ["mutable_header_identity", "account_membership_only", "bearer_possession_only"],
    requiredEvidence: ["support-reason-required", "support-role-denial", "customer-access-audit"],
    notes: "admin customer access is approved platform context, not customer assignment authority.",
  },
  {
    key: "route:admin-employee-detail-readiness",
    category: "admin_support_action",
    subject: "/manager/admin/employees/:employeeId and readiness",
    source: "apps/manager/src/server.ts",
    laneOwner: "Lane 2",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "approved_platform_context",
    authorizationContract: "C2",
    allowedAuthorizers: ["platform role", "recordSupportAccess", "employee account/assignment resolver", "support lease"],
    deniedAuthorizers: ["mutable_header_identity", "employees_account_id_only", "bearer_possession_only"],
    requiredEvidence: ["support-employee-scope-proof", "support-lease-required", "customer-access-audit"],
    notes: "support reads must identify the customer assignment being inspected where available.",
  },
  {
    key: "route:manager-tools",
    category: "manager_route",
    subject: "/manager/tools/:name",
    source: "apps/manager/src/server.ts",
    laneOwner: "Lane 3",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C3",
    allowedAuthorizers: ["tool schema", "assignment authorization", "durable intent/command/effect for consequential tools"],
    deniedAuthorizers: ["caller_selected_account_or_employee", "bearer_possession_only", "mutable_header_identity"],
    requiredEvidence: ["tool-cross-assignment-denial", "duplicate-effect-denial", "success-requires-receipt"],
    notes: "global internal bearer authenticates Manager, but the tool payload still needs assignment authorization.",
  },
  {
    key: "route:manager-mcp",
    category: "manager_route",
    subject: "/manager/mcp and /manager/agent-context",
    source: "apps/manager/src/server.ts and lib/mcp-auth.ts",
    laneOwner: "Lane 7",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["mcp_credential", "credential employee/account", "current assignment resolver"],
    deniedAuthorizers: ["bearer_possession_only", "caller_selected_account_or_employee", "mutable_header_identity"],
    requiredEvidence: ["wrong-audience-credential-denial", "revoked-credential-denial", "context-cross-assignment-denial"],
    notes: "employee runtime credentials authenticate the employee principal only inside the credential assignment.",
  },
  {
    key: "sms:twilio-inbound-owner-turn",
    category: "sms_path",
    subject: "Twilio inbound SMS owner turn",
    source: "apps/manager/src/webhooks/twilio.ts",
    laneOwner: "Lane 6",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C5",
    allowedAuthorizers: ["verified Twilio signature", "phone binding", "channel session", "assignment resolver"],
    deniedAuthorizers: ["phone_number_only", "bearer_possession_only", "caller_selected_account_or_employee"],
    requiredEvidence: ["twilio-signature-denial", "wrong-phone-assignment-denial", "revoked-channel-denial"],
    notes: "phone possession alone cannot select the employee or assignment.",
  },
  {
    key: "sms:signed-preview-action",
    category: "sms_path",
    subject: "SMS signed preview approval/reply action",
    source: "MANAGER_API.previewAction",
    laneOwner: "Lane 2",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["signed preview token", "preview_links row", "action scope", "approval/resource assignment"],
    deniedAuthorizers: ["signed_payload_without_resource_lookup", "phone_number_only", "bearer_possession_only"],
    requiredEvidence: ["forged-action-denial", "consumed-link-replay-denial", "wrong-resource-action-denial"],
    notes: "SMS action is authorized by durable signed resource scope, not by URL possession alone.",
  },
  {
    key: "connector:gmail",
    category: "connector_binding",
    subject: "Gmail watches and inbound email events",
    source: "apps/manager/src/webhooks/gmail.ts",
    laneOwner: "Lane 6",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C5",
    allowedAuthorizers: ["verified provider event", "connector custody binding", "assignment resolver", "duplicate event ledger"],
    deniedAuthorizers: ["account_membership_only", "caller_selected_account_or_employee", "bearer_possession_only"],
    requiredEvidence: ["unverified-provider-denial", "cross-assignment-connector-denial", "duplicate-provider-event-idempotent"],
    notes: "connector custody is assignment/resource scoped before business processing.",
  },
  {
    key: "connector:stripe",
    category: "connector_binding",
    subject: "Stripe connection, invoice, and webhook events",
    source: "apps/manager/src/webhooks/stripe.ts",
    laneOwner: "Lane 5",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C5",
    allowedAuthorizers: ["verified Stripe signature", "commercial relationship", "assignment/payer resolver"],
    deniedAuthorizers: ["account_membership_only", "caller_selected_account_or_employee", "bearer_possession_only"],
    requiredEvidence: ["stripe-signature-denial", "payer-beneficiary-attribution", "invoice-reconciliation"],
    notes: "billing/provider events must bind payer, beneficiary, and assignment before claims.",
  },
  {
    key: "connector:quickbooks",
    category: "connector_binding",
    subject: "QuickBooks pending writes and inbound events",
    source: "apps/manager/src/webhooks/quickbooks.ts",
    laneOwner: "Lane 6",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C5",
    allowedAuthorizers: ["verified connector binding", "assignment custody grant", "durable command/effect receipt"],
    deniedAuthorizers: ["account_membership_only", "caller_selected_account_or_employee", "bearer_possession_only"],
    requiredEvidence: ["revoked-connector-denial", "ambiguous-provider-receipt-visible", "duplicate-write-deduped"],
    notes: "writes into business systems are consequential external effects.",
  },
  {
    key: "worker:scheduler-run",
    category: "service_worker",
    subject: "/manager/scheduler/run and scheduled work consumers",
    source: "apps/manager/src/server.ts and scheduler runner",
    laneOwner: "Lane 7",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "approved_system_context",
    authorizationContract: "C3",
    allowedAuthorizers: ["internal system context", "assignment on each scheduled work item", "durable command claim"],
    deniedAuthorizers: ["caller_selected_account_or_employee", "bearer_possession_only", "mutable_header_identity"],
    requiredEvidence: ["system-context-audit", "assignment-per-work-item", "restart-no-duplicate-effect"],
    notes: "the scheduler may be system-authenticated, but each customer work item is assignment-scoped.",
  },
  {
    key: "worker:provisioning-reconciler",
    category: "service_worker",
    subject: "provisioning jobs, runtime credentials, and reconciler effects",
    source: "apps/manager/src/provisioner.ts and provisioning reconciler",
    laneOwner: "Lane 4",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C3",
    allowedAuthorizers: ["onboarding intent", "assignment creation saga", "durable command/effect kernel"],
    deniedAuthorizers: ["caller_selected_account_or_employee", "account_membership_only", "bearer_possession_only"],
    requiredEvidence: ["duplicate-submit-single-assignment", "auth-db-compensation", "runtime-credential-assignment-scope"],
    notes: "onboarding may start as system context, but provisioned runtime/customer work resolves to one assignment.",
  },
  {
    key: "commercial:meter-events",
    category: "commercial_row",
    subject: "meter_events, usage_rollups, budget_policies, provider receipts",
    source: "model gateway and commercial lane consumers",
    laneOwner: "Lane 5",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "explicit_assignment",
    authorizationContract: "C1",
    allowedAuthorizers: ["assignment_id", "payer relationship", "beneficiary relationship", "price version"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["provider-cost-receipt", "budget-deny-enforced", "invoice-delta-within-threshold"],
    notes: "billable work must identify assignment, payer, beneficiary, price version, and accounting receipt.",
  },
  {
    key: "signed:claim-token",
    category: "signed_resource",
    subject: "claim_tokens and /manager/claim/consume",
    source: "apps/manager/src/server.ts",
    laneOwner: "Lane 4",
    enabled: true,
    customerConsequential: true,
    scopeRequirement: "assignment_resolver",
    authorizationContract: "C2",
    allowedAuthorizers: ["claim token hash", "onboarding session", "single consume", "post-claim assignment saga"],
    deniedAuthorizers: ["signed_payload_without_resource_lookup", "phone_number_only", "bearer_possession_only"],
    requiredEvidence: ["claim-replay-denial", "wrong-session-denial", "post-claim-assignment-created"],
    notes: "claim token can continue onboarding but cannot become launch proof without assignment creation.",
  },
  {
    key: "public:estimator",
    category: "public_claim",
    subject: "public estimator and prod-like public estimator scripts",
    source: "root CODEGRAPH and normal-employee runbook boundary",
    laneOwner: "Lane 10",
    enabled: false,
    customerConsequential: false,
    scopeRequirement: "noncanonical_diagnostic",
    authorizationContract: "C6",
    allowedAuthorizers: ["non-canonical diagnostic only"],
    deniedAuthorizers: allForbidden,
    requiredEvidence: ["must-not-enter-release-proof", "public-claim-consistency"],
    notes: "estimator evidence cannot promote AI Employee release state.",
  },
] as const satisfies readonly ConsequentialSurfaceScope[];

export interface AssignmentScopeRegistryValidation {
  ok: boolean;
  problems: string[];
  categories: Record<ConsequentialSurfaceCategory, number>;
}

export function validateAssignmentScopeRegistry(
  registry: readonly ConsequentialSurfaceScope[] = ASSIGNMENT_SCOPE_REGISTRY,
): AssignmentScopeRegistryValidation {
  const problems: string[] = [];
  const seen = new Set<string>();
  const categories = Object.fromEntries(
    CONSEQUENTIAL_SURFACE_CATEGORIES.map((category) => [category, 0]),
  ) as Record<ConsequentialSurfaceCategory, number>;

  for (const item of registry) {
    if (seen.has(item.key)) problems.push(`duplicate registry key: ${item.key}`);
    seen.add(item.key);
    categories[item.category] += 1;

    const forbiddenUsed = item.allowedAuthorizers.filter((authorizer) =>
      FORBIDDEN_AUTHORIZERS.includes(authorizer as ForbiddenAuthorizer),
    );
    if (forbiddenUsed.length > 0) {
      problems.push(`${item.key} allows forbidden authorizer(s): ${forbiddenUsed.join(", ")}`);
    }

    if (item.enabled && item.customerConsequential && item.scopeRequirement === "noncanonical_diagnostic") {
      problems.push(`${item.key} is enabled customer work but marked noncanonical diagnostic`);
    }

    if (item.enabled && item.category === "commercial_row" && item.scopeRequirement !== "explicit_assignment") {
      problems.push(`${item.key} is commercial but does not require explicit assignment`);
    }

    if (item.enabled && item.scopeRequirement === "approved_platform_context" && item.category !== "admin_support_action" && item.category !== "manager_route") {
      problems.push(`${item.key} uses platform context outside an approved admin/route boundary`);
    }

    if (item.enabled && item.scopeRequirement === "approved_system_context" && item.category !== "service_worker") {
      problems.push(`${item.key} uses system context outside a service worker boundary`);
    }

    if (item.enabled && item.requiredEvidence.length < 2) {
      problems.push(`${item.key} has insufficient evidence requirements`);
    }
  }

  for (const category of CONSEQUENTIAL_SURFACE_CATEGORIES) {
    if (categories[category] === 0) problems.push(`missing required category: ${category}`);
  }

  return { ok: problems.length === 0, problems, categories };
}

export function assertAssignmentScopeRegistryValid(
  registry: readonly ConsequentialSurfaceScope[] = ASSIGNMENT_SCOPE_REGISTRY,
): void {
  const result = validateAssignmentScopeRegistry(registry);
  if (!result.ok) throw new Error(result.problems.join("\n"));
}

export function assignmentScopeSubjectsByCategory(
  category: ConsequentialSurfaceCategory,
  registry: readonly ConsequentialSurfaceScope[] = ASSIGNMENT_SCOPE_REGISTRY,
): readonly string[] {
  return registry
    .filter((item) => item.category === category)
    .map((item) => item.subject);
}

export function enabledCustomerConsequentialSurfaces(
  registry: readonly ConsequentialSurfaceScope[] = ASSIGNMENT_SCOPE_REGISTRY,
): readonly ConsequentialSurfaceScope[] {
  return registry.filter((item) => item.enabled && item.customerConsequential);
}
