import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFile(join(root, path), "utf8");

describe("P0 assignment relationship graph remediation", () => {
  it("creates first-class labor relationships before policy checks", async () => {
    const migration = await source("packages/db/migrations/0039_assignment_relationship_authority.sql");
    for (const table of [
      "organizations",
      "organization_accounts",
      "employee_principals",
      "employee_employment_relationships",
      "employee_assignments",
      "assignment_principals",
      "assignment_resource_grants",
      "assignment_authority_policies",
      "assignment_commercial_relationships",
      "assignment_memory_partitions",
      "assignment_connector_partitions",
      "assignment_billing_partitions",
    ]) {
      expect(migration).toContain(`create table if not exists ${table}`);
    }
    expect(migration).toContain("validation-vector((pass-vector: every consequential row can resolve one current assignment");
    expect(migration).toContain("legacy_default boolean not null default false");
    expect(migration).toContain("employee_assignments_legacy_default_idx");
  });

  it("assignment-scopes existing work rows and replaces account-wide owner RLS", async () => {
    const migration = await source("packages/db/migrations/0039_assignment_relationship_authority.sql");
    expect(migration).toContain("add column if not exists assignment_id text");
    expect(migration).toContain("execution_context_type = 'assignment'");
    expect(migration).toContain("execution_context_type = 'platform_system'");
    expect(migration).toContain("drop policy if exists accounts_sel on accounts");
    expect(migration).toContain("create policy accounts_assignment_sel");
    expect(migration).toContain("drop policy if exists employees_sel on employees");
    expect(migration).toContain("create policy employees_assignment_sel");
    expect(migration).toContain("amtech_authorized_assignment_ids");
    expect(migration).toContain("assignment_id in (select amtech_authorized_assignment_ids())");
  });

  it("rebuilds approvals as principal-bound immutable command claims", async () => {
    const migration = await source("packages/db/migrations/0039_assignment_relationship_authority.sql");
    expect(migration).toContain("requester_principal_type");
    expect(migration).toContain("required_resolver_role");
    expect(migration).toContain("action_snapshot_hash");
    expect(migration).toContain("approval_effect_receipts");
    expect(migration).toContain("resolve_assignment_approval");
    expect(migration).toContain("a.claim_state = 'requested'");
    expect(migration).toContain("a.action_snapshot_hash = p_action_snapshot_hash");
    expect(migration).toContain("ap.principal_id = p_resolver_principal_id");
  });

  it("turns signed links into atomic relationship leases", async () => {
    const migration = await source("packages/db/migrations/0039_assignment_relationship_authority.sql");
    expect(migration).toContain("claim_relationship_lease");
    expect(migration).toContain("claim_state = 'available'");
    expect(migration).toContain("consumed_by_principal_id = p_principal_id");
    expect(migration).toContain("relationship_checked_at = now()");
    expect(migration).toContain("exists (\n        select 1\n        from assignment_principals ap");
  });

  it("lays P1 accounting groundwork without enabling paid launch by default", async () => {
    const migration = await source("packages/db/migrations/0039_assignment_relationship_authority.sql");
    expect(migration).toContain("assignment_budget_accounts");
    expect(migration).toContain("assignment_usage_ledger");
    expect(migration).toContain("monthly_limit_cents integer not null default 0");
    expect(migration).toContain("status text not null default 'reserved'");
  });
});

describe("runtime credentials are assignment-bound", () => {
  it("binds model-gateway credentials, claims, headers, and usage records to assignment_id", async () => {
    const contracts = await source("packages/shared/src/model-gateway.ts");
    const gateway = await source("apps/manager/src/lib/model-gateway.ts");
    const http = await source("apps/manager/src/lib/model-gateway-http.ts");
    expect(contracts).toContain("assignment_id: string");
    expect(gateway).toContain("resolveCurrentAssignmentId");
    expect(gateway).toContain("assignment_id,");
    expect(gateway).toContain("execution_context_type: \"assignment\"");
    expect(http).toContain("X-Amtech-Assignment-Id");
    expect(http).toContain("amtech_gateway: {\n          request_id: requestId,\n          assignment_id: claims.assignment_id");
  });

  it("binds Manager MCP credentials to current assignments", async () => {
    const mcp = await source("apps/manager/src/lib/mcp-auth.ts");
    expect(mcp).toContain("assignment_id: string");
    expect(mcp).toContain("mcp_assignment_not_resolved");
    expect(mcp).toContain("execution_context_type: \"assignment\"");
    expect(mcp).toContain("return { assignment_id: row.assignment_id");
  });
});
