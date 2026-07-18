import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL;
const REQUIRED_TABLES = [
  "organizations",
  "organization_accounts",
  "human_principals",
  "employee_principals",
  "labor_relationships",
  "employee_assignments",
  "assignment_principals",
  "assignment_resource_grants",
  "assignment_authority_policies",
  "commercial_relationships",
] as const;

const AUTH = {
  owner: "11111111-1111-4111-8111-111111111111",
  operator: "22222222-2222-4222-8222-222222222222",
  multiAccount: "33333333-3333-4333-8333-333333333333",
};

let admin: Client | undefined;

async function queryAsAuthUser<T extends Record<string, unknown>>(
  authUserId: string,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (!databaseUrl) throw new Error("STAGING_DATABASE_URL is required");
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [authUserId]);
    await client.query("set local role authenticated");
    const result = await client.query<T>(sql, params);
    await client.query("rollback");
    return result.rows;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function assertRelationshipSchemaExists(client: Client): Promise<void> {
  const result = await client.query<{ table_name: string }>(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])`,
    [REQUIRED_TABLES],
  );
  const existing = new Set(result.rows.map((row) => row.table_name));
  const missing = REQUIRED_TABLES.filter((table) => !existing.has(table));
  if (missing.length > 0) {
    throw new Error(
      `relationship schema missing: ${missing.join(", ")}. This is the expected audited RED state before Lane 1 migration implementation.`,
    );
  }
}

async function seedMatrix(client: Client): Promise<void> {
  await client.query(`
    create or replace function auth.uid()
    returns uuid
    language sql
    stable
    as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;

    grant usage on schema public to authenticated;
    grant select on accounts, users, account_memberships, employees,
      organizations, organization_accounts, human_principals, employee_principals,
      labor_relationships, employee_assignments, assignment_principals,
      assignment_resource_grants, assignment_authority_policies, commercial_relationships
    to authenticated;
  `);

  await client.query("begin");
  try {
    await client.query(`
      insert into accounts (id, display_name, slug) values
        ('acct_matrix_a', 'Matrix A', 'matrix-a'),
        ('acct_matrix_b', 'Matrix B', 'matrix-b'),
        ('acct_matrix_c', 'Matrix C', 'matrix-c')
      on conflict (id) do update set display_name = excluded.display_name;

      insert into users (id, auth_user_id, email, full_name) values
        ('user_matrix_owner', '${AUTH.owner}', 'matrix-owner@example.invalid', 'Matrix Owner'),
        ('user_matrix_operator', '${AUTH.operator}', 'matrix-operator@example.invalid', 'Matrix Operator'),
        ('user_matrix_multi', '${AUTH.multiAccount}', 'matrix-multi@example.invalid', 'Matrix Multi')
      on conflict (id) do update set auth_user_id = excluded.auth_user_id, email = excluded.email;

      insert into account_memberships (id, account_id, user_id, role) values
        ('mem_matrix_owner_a', 'acct_matrix_a', 'user_matrix_owner', 'owner'),
        ('mem_matrix_operator_a', 'acct_matrix_a', 'user_matrix_operator', 'owner'),
        ('mem_matrix_multi_a', 'acct_matrix_a', 'user_matrix_multi', 'owner'),
        ('mem_matrix_multi_b', 'acct_matrix_b', 'user_matrix_multi', 'owner')
      on conflict (account_id, user_id) do update set role = excluded.role;

      insert into employees (id, account_id, name, status) values
        ('emp_matrix_a1', 'acct_matrix_a', 'Avery A1', 'live'),
        ('emp_matrix_a2', 'acct_matrix_a', 'Avery A2', 'live'),
        ('emp_matrix_shared', 'acct_matrix_a', 'Avery Shared', 'live'),
        ('emp_matrix_b1', 'acct_matrix_b', 'Avery B1', 'live'),
        ('emp_matrix_cross', 'acct_matrix_c', 'Avery Cross Org', 'live')
      on conflict (id) do update set account_id = excluded.account_id, name = excluded.name, status = excluded.status;

      insert into organizations (id, display_name, status) values
        ('org_matrix_a', 'Organization A', 'active'),
        ('org_matrix_b', 'Organization B', 'active')
      on conflict (id) do update set display_name = excluded.display_name, status = excluded.status;

      insert into organization_accounts
        (id, organization_id, account_id, status, starts_at, ends_at, provenance)
      values
        ('rel_matrix_org_a_acct_a', 'org_matrix_a', 'acct_matrix_a', 'active', now() - interval '1 day', null, '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('rel_matrix_org_a_acct_b', 'org_matrix_a', 'acct_matrix_b', 'active', now() - interval '1 day', null, '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('rel_matrix_org_b_acct_c', 'org_matrix_b', 'acct_matrix_c', 'active', now() - interval '1 day', null, '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb)
      on conflict (id) do update set status = excluded.status, ends_at = excluded.ends_at;

      insert into human_principals (id, user_id, status) values
        ('hpr_matrix_owner', 'user_matrix_owner', 'active'),
        ('hpr_matrix_operator', 'user_matrix_operator', 'active'),
        ('hpr_matrix_multi', 'user_matrix_multi', 'active')
      on conflict (user_id) do update set id = excluded.id, status = excluded.status;

      insert into employee_principals (id, employee_id, status) values
        ('epr_matrix_a1', 'emp_matrix_a1', 'active'),
        ('epr_matrix_a2', 'emp_matrix_a2', 'active'),
        ('epr_matrix_shared', 'emp_matrix_shared', 'active'),
        ('epr_matrix_b1', 'emp_matrix_b1', 'active'),
        ('epr_matrix_cross', 'emp_matrix_cross', 'active')
      on conflict (id) do update set status = excluded.status;

      insert into labor_relationships
        (id, relationship_type, subject_principal_id, subject_principal_class,
         organization_id, account_id, assignment_id, role, status, starts_at, ends_at,
         policy_version, provenance)
      values
        ('rel_matrix_employ_a1', 'employment', 'epr_matrix_a1', 'employee', 'org_matrix_a', 'acct_matrix_a', null, 'employee', 'active', now() - interval '1 day', null, 'labor-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('rel_matrix_employ_a2', 'employment', 'epr_matrix_a2', 'employee', 'org_matrix_a', 'acct_matrix_a', null, 'employee', 'active', now() - interval '1 day', null, 'labor-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('rel_matrix_employ_shared', 'employment', 'epr_matrix_shared', 'employee', 'org_matrix_a', 'acct_matrix_a', null, 'employee', 'active', now() - interval '1 day', null, 'labor-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('rel_matrix_employ_b1', 'employment', 'epr_matrix_b1', 'employee', 'org_matrix_a', 'acct_matrix_b', null, 'employee', 'active', now() - interval '1 day', null, 'labor-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('rel_matrix_employ_cross', 'employment', 'epr_matrix_cross', 'employee', 'org_matrix_a', 'acct_matrix_a', null, 'employee', 'active', now() - interval '1 day', null, 'labor-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb)
      on conflict (id) do update set status = excluded.status, ends_at = excluded.ends_at;

      insert into employee_assignments
        (id, organization_id, account_id, employee_principal_id, status, starts_at, ends_at,
         policy_version, provenance)
      values
        ('asn_matrix_a1', 'org_matrix_a', 'acct_matrix_a', 'epr_matrix_a1', 'active', now() - interval '1 day', null, 'assignment-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('asn_matrix_a2', 'org_matrix_a', 'acct_matrix_a', 'epr_matrix_a2', 'active', now() - interval '1 day', null, 'assignment-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('asn_matrix_shared_a', 'org_matrix_a', 'acct_matrix_a', 'epr_matrix_shared', 'active', now() - interval '1 day', null, 'assignment-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('asn_matrix_shared_b', 'org_matrix_a', 'acct_matrix_b', 'epr_matrix_shared', 'active', now() - interval '1 day', null, 'assignment-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('asn_matrix_b1', 'org_matrix_a', 'acct_matrix_b', 'epr_matrix_b1', 'active', now() - interval '1 day', null, 'assignment-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('asn_matrix_cross', 'org_matrix_b', 'acct_matrix_c', 'epr_matrix_cross', 'active', now() - interval '1 day', null, 'assignment-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb)
      on conflict (id) do update set status = excluded.status, ends_at = excluded.ends_at;

      update labor_relationships set assignment_id = 'asn_matrix_cross'
       where id = 'rel_matrix_employ_cross';

      insert into assignment_principals
        (id, assignment_id, principal_id, principal_class, role, status, starts_at, ends_at,
         policy_version, provenance)
      values
        ('aspr_matrix_owner_a1', 'asn_matrix_a1', 'hpr_matrix_owner', 'human', 'owner', 'active', now() - interval '1 day', null, 'authorization-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('aspr_matrix_operator_a2', 'asn_matrix_a2', 'hpr_matrix_operator', 'human', 'operator', 'active', now() - interval '1 day', null, 'authorization-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('aspr_matrix_owner_shared', 'asn_matrix_shared_a', 'hpr_matrix_owner', 'human', 'manager', 'active', now() - interval '1 day', null, 'authorization-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('aspr_matrix_operator_shared', 'asn_matrix_shared_a', 'hpr_matrix_operator', 'human', 'viewer', 'active', now() - interval '1 day', null, 'authorization-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('aspr_matrix_multi_shared_b', 'asn_matrix_shared_b', 'hpr_matrix_multi', 'human', 'viewer', 'active', now() - interval '1 day', null, 'authorization-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('aspr_matrix_multi_cross', 'asn_matrix_cross', 'hpr_matrix_multi', 'human', 'owner', 'active', now() - interval '1 day', null, 'authorization-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb)
      on conflict (id) do update set status = excluded.status, ends_at = excluded.ends_at;

      insert into assignment_resource_grants
        (id, assignment_id, principal_id, resource_class, resource_id, actions, status,
         starts_at, ends_at, policy_version, provenance)
      values
        ('grant_matrix_owner_messages', 'asn_matrix_a1', 'hpr_matrix_owner', 'employee_message', null, array['read','write'], 'active', now() - interval '1 day', null, 'authorization-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('grant_matrix_operator_messages', 'asn_matrix_a2', 'hpr_matrix_operator', 'employee_message', null, array['read'], 'active', now() - interval '1 day', null, 'authorization-v1', '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb)
      on conflict (id) do update set status = excluded.status, actions = excluded.actions;

      insert into commercial_relationships
        (id, assignment_id, relationship_type, organization_id, account_id, status,
         starts_at, ends_at, provenance)
      values
        ('crel_matrix_payer', 'asn_matrix_shared_a', 'payer', 'org_matrix_a', 'acct_matrix_a', 'active', now() - interval '1 day', null, '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb),
        ('crel_matrix_beneficiary', 'asn_matrix_shared_a', 'beneficiary', 'org_matrix_a', 'acct_matrix_b', 'active', now() - interval '1 day', null, '{"source":"explicit","sourceRef":"matrix","confidence":"high"}'::jsonb)
      on conflict (id) do update set status = excluded.status;
    `);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

beforeAll(async () => {
  if (!databaseUrl) return;
  admin = new Client({ connectionString: databaseUrl });
  await admin.connect();
  await assertRelationshipSchemaExists(admin);
  await seedMatrix(admin);
});

afterAll(async () => {
  await admin?.end();
});

describe.skipIf(!databaseUrl)("assignment-aware relationship and RLS matrix", () => {
  it("does not let account membership substitute for employee assignment", async () => {
    const rows = await queryAsAuthUser<{ id: string }>(
      AUTH.multiAccount,
      "select id from employees where id like 'emp_matrix_%' order by id",
    );

    expect(rows.map((row) => row.id)).toEqual(["emp_matrix_shared"]);
    expect(rows.map((row) => row.id)).not.toContain("emp_matrix_a1");
    expect(rows.map((row) => row.id)).not.toContain("emp_matrix_a2");
    expect(rows.map((row) => row.id)).not.toContain("emp_matrix_b1");
  });

  it("supports authorized shared employees and two assignments without widening access", async () => {
    const ownerEmployees = await queryAsAuthUser<{ id: string }>(
      AUTH.owner,
      "select id from employees where id like 'emp_matrix_%' order by id",
    );
    const operatorEmployees = await queryAsAuthUser<{ id: string }>(
      AUTH.operator,
      "select id from employees where id like 'emp_matrix_%' order by id",
    );
    const multiAssignments = await queryAsAuthUser<{ assignment_id: string }>(
      AUTH.multiAccount,
      "select assignment_id from amtech_authorized_assignment_ids('read', 'employee', null) order by assignment_id",
    );

    expect(ownerEmployees.map((row) => row.id)).toEqual(["emp_matrix_a1", "emp_matrix_shared"]);
    expect(operatorEmployees.map((row) => row.id)).toEqual(["emp_matrix_a2", "emp_matrix_shared"]);
    expect(multiAssignments.map((row) => row.assignment_id)).toEqual(["asn_matrix_shared_b"]);
  });

  it("denies revoked and expired assignment relationships immediately", async () => {
    if (!admin) throw new Error("admin client unavailable");

    await admin.query("update assignment_principals set status = 'revoked' where id = 'aspr_matrix_operator_a2'");
    let rows = await queryAsAuthUser<{ id: string }>(
      AUTH.operator,
      "select id from employees where id = 'emp_matrix_a2'",
    );
    expect(rows).toEqual([]);

    await admin.query(`
      update assignment_principals
         set status = 'active', ends_at = now() - interval '1 second'
       where id = 'aspr_matrix_operator_a2'
    `);
    rows = await queryAsAuthUser<{ id: string }>(
      AUTH.operator,
      "select id from employees where id = 'emp_matrix_a2'",
    );
    expect(rows).toEqual([]);
  });

  it("keeps payer and beneficiary separate and fails closed on cross-organization assignments", async () => {
    const commercial = await queryAsAuthUser<{ relationship_type: string; account_id: string }>(
      AUTH.owner,
      `select relationship_type, account_id
         from commercial_relationships
        where assignment_id = 'asn_matrix_shared_a'
        order by relationship_type`,
    );
    const crossOrg = await queryAsAuthUser<{ assignment_id: string }>(
      AUTH.multiAccount,
      "select assignment_id from amtech_authorized_assignment_ids('read', 'employee', null) where assignment_id = 'asn_matrix_cross'",
    );

    expect(commercial).toEqual([
      { relationship_type: "beneficiary", account_id: "acct_matrix_b" },
      { relationship_type: "payer", account_id: "acct_matrix_a" },
    ]);
    expect(crossOrg).toEqual([]);
  });

  it("enforces resource-class grants rather than account-wide role assumptions", async () => {
    const ownerWrite = await queryAsAuthUser<{ allowed: boolean }>(
      AUTH.owner,
      "select amtech_authorize_assignment_action('asn_matrix_a1', 'employee_message', null, 'write', 'authorization-v1') as allowed",
    );
    const operatorWrite = await queryAsAuthUser<{ allowed: boolean }>(
      AUTH.operator,
      "select amtech_authorize_assignment_action('asn_matrix_a2', 'employee_message', null, 'write', 'authorization-v1') as allowed",
    );

    expect(ownerWrite).toEqual([{ allowed: true }]);
    expect(operatorWrite).toEqual([{ allowed: false }]);
  });
});
