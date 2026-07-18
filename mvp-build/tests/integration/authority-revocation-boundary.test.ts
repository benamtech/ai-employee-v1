import { Client, Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL;
let db: Client | undefined;
let pool: Pool | undefined;

const ids = {
  account: "acct_s9_matrix",
  user: "user_s9_matrix",
  employee: "emp_s9_matrix",
  organization: "org_s9_matrix",
  orgAccount: "rel_s9_org_account",
  human: "hpr_s9_owner",
  employeePrincipal: "epr_s9_employee",
  assignment: "asn_s9_matrix",
  employment: "rel_s9_employment",
  ownerPrincipal: "aspr_s9_owner",
  ownerSession: "ows_s9_matrix",
  mcpCredential: "mcpcred_s9_matrix",
  previewLink: "prev_s9_matrix",
};

async function seed(client: Client): Promise<void> {
  await client.query("begin");
  try {
    await client.query(`
      insert into accounts(id, display_name, slug)
      values($1, 'S9 Matrix', 's9-matrix')
      on conflict (id) do update set display_name = excluded.display_name
    `, [ids.account]);
    await client.query(`
      insert into users(id, email, full_name)
      values($1, 's9-owner@example.invalid', 'S9 Owner')
      on conflict (id) do update set email = excluded.email
    `, [ids.user]);
    await client.query(`
      insert into employees(id, account_id, name, status)
      values($1, $2, 'S9 Employee', 'live')
      on conflict (id) do update set account_id = excluded.account_id, status = excluded.status
    `, [ids.employee, ids.account]);
    await client.query(`
      insert into organizations(id, display_name, status)
      values($1, 'S9 Organization', 'active')
      on conflict (id) do update set status = 'active'
    `, [ids.organization]);
    await client.query(`
      insert into organization_accounts(id, organization_id, account_id, status, starts_at, provenance)
      values($1, $2, $3, 'active', now() - interval '1 day', '{"source":"test"}'::jsonb)
      on conflict (id) do update set status = 'active', ends_at = null
    `, [ids.orgAccount, ids.organization, ids.account]);
    await client.query(`
      insert into human_principals(id, user_id, status, session_version)
      values($1, $2, 'active', 1)
      on conflict (id) do update set status = 'active', credentials_revoked_at = null
    `, [ids.human, ids.user]);
    await client.query(`
      insert into employee_principals(id, employee_id, status)
      values($1, $2, 'active')
      on conflict (id) do update set status = 'active'
    `, [ids.employeePrincipal, ids.employee]);
    await client.query(`
      insert into employee_assignments(
        id, organization_id, account_id, employee_principal_id, status,
        starts_at, policy_version, provenance
      ) values($1,$2,$3,$4,'active',now() - interval '1 day','authorization-v1','{"source":"test"}'::jsonb)
      on conflict (id) do update set status = 'active', ends_at = null, policy_version = 'authorization-v1'
    `, [ids.assignment, ids.organization, ids.account, ids.employeePrincipal]);
    await client.query(`
      insert into labor_relationships(
        id, relationship_type, subject_principal_id, subject_principal_class,
        organization_id, account_id, assignment_id, role, status,
        starts_at, policy_version, provenance
      ) values(
        $1,'employment',$2,'employee',$3,$4,$5,'employee','active',
        now() - interval '1 day','authorization-v1','{"source":"test"}'::jsonb
      )
      on conflict (id) do update set status = 'active', ends_at = null
    `, [ids.employment, ids.employeePrincipal, ids.organization, ids.account, ids.assignment]);
    await client.query(`
      insert into assignment_principals(
        id, assignment_id, principal_id, principal_class, role, status,
        starts_at, policy_version, provenance
      ) values(
        $1,$2,$3,'human','owner','active',now() - interval '1 day',
        'authorization-v1','{"source":"test"}'::jsonb
      )
      on conflict (id) do update set role = 'owner', status = 'active', ends_at = null
    `, [ids.ownerPrincipal, ids.assignment, ids.human]);
    await client.query(`delete from owner_web_sessions where id = $1`, [ids.ownerSession]);
    await client.query(`delete from employee_mcp_credentials where id = $1`, [ids.mcpCredential]);
    await client.query(`delete from preview_links where id = $1`, [ids.previewLink]);
    await client.query(`
      insert into owner_web_sessions(
        id, account_id, user_id, human_principal_id, session_version,
        token_hash, expires_at
      ) values($1,$2,$3,$4,1,'s9-owner-session-hash',now() + interval '1 hour')
    `, [ids.ownerSession, ids.account, ids.user, ids.human]);
    await client.query(`
      insert into employee_mcp_credentials(
        id, account_id, employee_id, assignment_id, principal_id, policy_version,
        token_hash, token_prefix, token_secret_ref, audience, status
      ) values(
        $1,$2,$3,$4,$5,'authorization-v1',
        's9-mcp-token-hash','mcp_s9_token','sealed:s9','/manager/mcp','active'
      )
    `, [ids.mcpCredential, ids.account, ids.employee, ids.assignment, ids.employeePrincipal]);
    await client.query(`
      insert into preview_links(
        id, account_id, employee_id, assignment_id, resolver_principal_id,
        policy_version, approval_snapshot_hash, token_jti,
        resource_type, resource_id, token_hash, actions, audience, expires_at
      ) values(
        $1,$2,$3,$4,$5,'authorization-v1',$6,'jti-s9-matrix',
        'approval','approval-s9-matrix','s9-preview-token-hash',array['approve','reject'],'owner',now() + interval '1 hour'
      )
    `, [ids.previewLink, ids.account, ids.employee, ids.assignment, ids.human, `sha256:${"a".repeat(64)}`]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

beforeAll(async () => {
  if (!databaseUrl) return;
  db = new Client({ connectionString: databaseUrl });
  await db.connect();
  pool = new Pool({ connectionString: databaseUrl, max: 8 });
  await seed(db);
});

afterAll(async () => {
  await pool?.end();
  await db?.end();
});

describe.skipIf(!databaseUrl)("S9 authority revocation PostgreSQL boundary", () => {
  it("stamps current authority versions onto owner, Hermes, and signed-preview credentials", async () => {
    const versions = await db!.query(`
      select
        (select current_version from authority_versions where scope_type = 'human_principal' and scope_id = $1) as human_version,
        (select current_version from authority_versions where scope_type = 'employee_assignment' and scope_id = $2) as assignment_version,
        (select authority_version from owner_web_sessions where id = $3) as session_version,
        (select assignment_authority_version from employee_mcp_credentials where id = $4) as mcp_version,
        (select assignment_authority_version from preview_links where id = $5) as preview_assignment_version,
        (select resolver_authority_version from preview_links where id = $5) as preview_resolver_version
    `, [ids.human, ids.assignment, ids.ownerSession, ids.mcpCredential, ids.previewLink]);
    expect(Number(versions.rows[0].session_version)).toBe(Number(versions.rows[0].human_version));
    expect(Number(versions.rows[0].mcp_version)).toBe(Number(versions.rows[0].assignment_version));
    expect(Number(versions.rows[0].preview_assignment_version)).toBe(Number(versions.rows[0].assignment_version));
    expect(Number(versions.rows[0].preview_resolver_version)).toBe(Number(versions.rows[0].human_version));
  });

  it("revokes stale Hermes and preview credentials after a role change without revoking the owner session", async () => {
    const before = await db!.query(`
      select current_version from authority_versions
       where scope_type = 'employee_assignment' and scope_id = $1
    `, [ids.assignment]);
    await db!.query(`update assignment_principals set role = 'manager' where id = $1`, [ids.ownerPrincipal]);
    const after = await db!.query(`
      select
        (select current_version from authority_versions where scope_type = 'employee_assignment' and scope_id = $1) as authority_version,
        (select status from employee_mcp_credentials where id = $2) as mcp_status,
        (select revoked_at from preview_links where id = $3) as preview_revoked_at,
        (select revoked_at from owner_web_sessions where id = $4) as owner_session_revoked_at
    `, [ids.assignment, ids.mcpCredential, ids.previewLink, ids.ownerSession]);
    expect(Number(after.rows[0].authority_version)).toBe(Number(before.rows[0].current_version) + 1);
    expect(after.rows[0].mcp_status).toBe("revoked");
    expect(after.rows[0].preview_revoked_at).toBeTruthy();
    expect(after.rows[0].owner_session_revoked_at).toBeNull();
  });

  it("revokes stale owner sessions after a human credential-version change", async () => {
    const before = await db!.query(`
      select current_version from authority_versions
       where scope_type = 'human_principal' and scope_id = $1
    `, [ids.human]);
    await db!.query(`update human_principals set session_version = session_version + 1 where id = $1`, [ids.human]);
    const after = await db!.query(`
      select
        (select current_version from authority_versions where scope_type = 'human_principal' and scope_id = $1) as authority_version,
        (select revoked_at from owner_web_sessions where id = $2) as owner_session_revoked_at
    `, [ids.human, ids.ownerSession]);
    expect(Number(after.rows[0].authority_version)).toBe(Number(before.rows[0].current_version) + 1);
    expect(after.rows[0].owner_session_revoked_at).toBeTruthy();
  });

  it("leases revocation events with skip-locked concurrency and deterministic acknowledgement", async () => {
    const claims = await Promise.all([
      pool!.query(`select * from claim_authority_revocations('worker-s9-a', 1, 60)`),
      pool!.query(`select * from claim_authority_revocations('worker-s9-b', 1, 60)`),
    ]);
    const rows = claims.flatMap((claim) => claim.rows);
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => String(row.id))).size).toBe(2);
    await db!.query(`select complete_authority_revocation($1,'worker-s9-a',null)`, [claims[0]!.rows[0]!.id]);
    await db!.query(`select complete_authority_revocation($1,'worker-s9-b','runtime-cache-retry')`, [claims[1]!.rows[0]!.id]);
    const states = await db!.query(`
      select id, dispatched_at, last_error
        from authority_revocation_outbox
       where id = any($1::bigint[])
       order by id
    `, [rows.map((row) => row.id)]);
    expect(states.rows.filter((row) => row.dispatched_at)).toHaveLength(1);
    expect(states.rows.filter((row) => row.last_error === "runtime-cache-retry")).toHaveLength(1);
  });
});
