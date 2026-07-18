import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL;
let db: Client | undefined;

const ids = {
  account: "acct_signed_s9",
  user: "user_signed_s9",
  employee: "emp_signed_s9",
  organization: "org_signed_s9",
  orgAccount: "rel_signed_s9_org_account",
  human: "hpr_signed_s9",
  employeePrincipal: "epr_signed_s9",
  assignment: "asn_signed_s9",
  employment: "rel_signed_s9_employment",
  ownerPrincipal: "aspr_signed_s9_owner",
  artifact: "art_signed_s9",
  artifactLink: "alink_signed_s9",
  preview: "prev_signed_s9",
};

async function seed(client: Client): Promise<void> {
  await client.query("begin");
  try {
    await client.query(`
      insert into accounts(id, display_name, slug)
      values($1, 'Signed S9', 'signed-s9')
      on conflict (id) do update set display_name = excluded.display_name;

      insert into users(id, email, full_name)
      values($2, 'signed-s9@example.invalid', 'Signed S9 Owner')
      on conflict (id) do update set email = excluded.email;

      insert into employees(id, account_id, name, status)
      values($3, $1, 'Signed S9 Employee', 'live')
      on conflict (id) do update set account_id = excluded.account_id, status = 'live';

      insert into organizations(id, display_name, status)
      values($4, 'Signed S9 Organization', 'active')
      on conflict (id) do update set status = 'active';

      insert into organization_accounts(id, organization_id, account_id, status, starts_at, provenance)
      values($5, $4, $1, 'active', now() - interval '1 day', '{"source":"test"}'::jsonb)
      on conflict (id) do update set status = 'active', ends_at = null;

      insert into human_principals(id, user_id, status)
      values($6, $2, 'active')
      on conflict (id) do update set status = 'active', credentials_revoked_at = null;

      insert into employee_principals(id, employee_id, status)
      values($7, $3, 'active')
      on conflict (id) do update set status = 'active';

      insert into employee_assignments(
        id, organization_id, account_id, employee_principal_id, status,
        starts_at, policy_version, provenance
      ) values(
        $8,$4,$1,$7,'active',now() - interval '1 day',
        'authorization-v1','{"source":"test"}'::jsonb
      )
      on conflict (id) do update set status = 'active', ends_at = null, policy_version = 'authorization-v1';

      insert into labor_relationships(
        id, relationship_type, subject_principal_id, subject_principal_class,
        organization_id, account_id, assignment_id, role, status,
        starts_at, policy_version, provenance
      ) values(
        $9,'employment',$7,'employee',$4,$1,$8,'employee','active',
        now() - interval '1 day','authorization-v1','{"source":"test"}'::jsonb
      )
      on conflict (id) do update set status = 'active', ends_at = null;

      insert into assignment_principals(
        id, assignment_id, principal_id, principal_class, role, status,
        starts_at, policy_version, provenance
      ) values(
        $10,$8,$6,'human','owner','active',now() - interval '1 day',
        'authorization-v1','{"source":"test"}'::jsonb
      )
      on conflict (id) do update set role = 'owner', status = 'active', ends_at = null;
    `, [
      ids.account,
      ids.user,
      ids.employee,
      ids.organization,
      ids.orgAccount,
      ids.human,
      ids.employeePrincipal,
      ids.assignment,
      ids.employment,
      ids.ownerPrincipal,
    ]);

    await client.query(`delete from preview_links where id = $1`, [ids.preview]);
    await client.query(`delete from artifact_links where id = $1`, [ids.artifactLink]);
    await client.query(`delete from artifacts where id = $1`, [ids.artifact]);

    await client.query(`
      insert into artifacts(id, employee_id, account_id, assignment_id, kind, payload)
      values($1,$2,$3,$4,'report','{}'::jsonb)
    `, [ids.artifact, ids.employee, ids.account, ids.assignment]);
    await client.query(`
      insert into artifact_links(id, artifact_id, assignment_id, token_hash, audience, expires_at)
      values($1,$2,$3,'signed-s9-artifact-hash','owner',now() + interval '1 hour')
    `, [ids.artifactLink, ids.artifact, ids.assignment]);
    await client.query(`
      insert into preview_links(
        id, account_id, employee_id, assignment_id, resolver_principal_id,
        token_jti, resource_type, resource_id, token_hash, actions, audience, expires_at
      ) values(
        $1,$2,$3,$4,$5,'signed-s9-jti','artifact',$6,
        'signed-s9-preview-hash',array['view','respond'],'owner',now() + interval '1 hour'
      )
    `, [ids.preview, ids.account, ids.employee, ids.assignment, ids.human, ids.artifact]);
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
  await seed(db);
});

afterAll(async () => {
  await db?.end();
});

describe.skipIf(!databaseUrl)("S9 signed resource revocation boundary", () => {
  it("stamps every assignment-bound preview and artifact credential", async () => {
    const result = await db!.query(`
      select
        (select current_version from authority_versions
          where scope_type = 'employee_assignment' and scope_id = $1) as assignment_version,
        (select current_version from authority_versions
          where scope_type = 'human_principal' and scope_id = $2) as human_version,
        (select assignment_authority_version from artifact_links where id = $3) as artifact_version,
        (select assignment_authority_version from preview_links where id = $4) as preview_assignment_version,
        (select resolver_authority_version from preview_links where id = $4) as preview_resolver_version
    `, [ids.assignment, ids.human, ids.artifactLink, ids.preview]);
    expect(Number(result.rows[0].artifact_version)).toBe(Number(result.rows[0].assignment_version));
    expect(Number(result.rows[0].preview_assignment_version)).toBe(Number(result.rows[0].assignment_version));
    expect(Number(result.rows[0].preview_resolver_version)).toBe(Number(result.rows[0].human_version));
  });

  it("denies issuance of a signed preview without one exact assignment", async () => {
    await expect(db!.query(`
      insert into preview_links(
        id, account_id, employee_id, token_jti,
        resource_type, resource_id, token_hash, actions, audience, expires_at
      ) values(
        'prev_signed_s9_unscoped',$1,$2,'signed-s9-unscoped-jti',
        'artifact',$3,'signed-s9-unscoped-hash',array['view'],'owner',now() + interval '1 hour'
      )
    `, [ids.account, ids.employee, ids.artifact])).rejects.toThrow(/preview_assignment_required/);
  });

  it("revokes both credentials synchronously after an assignment role change", async () => {
    await db!.query(`update assignment_principals set role = 'manager' where id = $1`, [ids.ownerPrincipal]);
    const result = await db!.query(`
      select
        (select revoked_at from artifact_links where id = $1) as artifact_revoked_at,
        (select revoked_at from preview_links where id = $2) as preview_revoked_at
    `, [ids.artifactLink, ids.preview]);
    expect(result.rows[0].artifact_revoked_at).toBeTruthy();
    expect(result.rows[0].preview_revoked_at).toBeTruthy();
  });
});
