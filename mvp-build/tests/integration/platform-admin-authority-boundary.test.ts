import { createHash } from "node:crypto";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL;
let db: Client | undefined;

const ids = {
  account: "acct_s8_matrix",
  user: "user_s8_matrix",
  employee: "emp_s8_matrix",
  employeeOther: "emp_s8_other",
  organization: "org_s8_matrix",
  employeePrincipal: "epr_s8_matrix",
  employeePrincipalOther: "epr_s8_other",
  assignment: "asn_s8_matrix",
  assignmentOther: "asn_s8_other",
  platformPrincipal: "ppr_s8_owner",
  platformRole: "pprr_s8_owner",
  session: "pads_s8_owner",
  lease: "psl_s8_owner",
};
const token = "pad_s8_matrix_token_not_stored_raw";
const tokenHash = createHash("sha256").update(token).digest("hex");
const payloadHash = `sha256:${createHash("sha256").update("{}").digest("hex")}`;

async function seed(client: Client) {
  await client.query("begin");
  try {
    await client.query(`insert into accounts(id,display_name,slug) values($1,'S8 Matrix','s8-matrix') on conflict(id) do update set display_name=excluded.display_name`, [ids.account]);
    await client.query(`insert into users(id,email,full_name) values($1,'s8@example.invalid','S8 Owner') on conflict(id) do update set email=excluded.email`, [ids.user]);
    await client.query(`insert into employees(id,account_id,name,status) values($1,$3,'S8 Employee','live'),($2,$3,'S8 Other','live') on conflict(id) do update set account_id=excluded.account_id,status='live'`, [ids.employee, ids.employeeOther, ids.account]);
    await client.query(`insert into organizations(id,display_name,status) values($1,'S8 Organization','active') on conflict(id) do update set status='active'`, [ids.organization]);
    await client.query(`insert into employee_principals(id,employee_id,status) values($1,$3,'active'),($2,$4,'active') on conflict(id) do update set status='active'`, [ids.employeePrincipal, ids.employeePrincipalOther, ids.employee, ids.employeeOther]);
    await client.query(`
      insert into employee_assignments(id,organization_id,account_id,employee_principal_id,status,starts_at,policy_version,provenance)
      values($1,$3,$4,$5,'active',now()-interval '1 day','authorization-v1','{"source":"test"}'::jsonb),
            ($2,$3,$4,$6,'active',now()-interval '1 day','authorization-v1','{"source":"test"}'::jsonb)
      on conflict(id) do update set status='active',ends_at=null
    `, [ids.assignment, ids.assignmentOther, ids.organization, ids.account, ids.employeePrincipal, ids.employeePrincipalOther]);
    await client.query(`
      insert into platform_principals(id,user_id,status,session_version,starts_at,ends_at,provenance)
      values($1,$2,'active',7,now()-interval '1 day',null,'{"source":"test"}'::jsonb)
      on conflict(user_id) do update set id=excluded.id,status='active',session_version=7,ends_at=null
    `, [ids.platformPrincipal, ids.user]);
    await client.query(`
      insert into platform_principal_roles(id,principal_id,role,status,starts_at,ends_at,provenance)
      values($1,$2,'platform_owner','active',now()-interval '1 day',null,'{"source":"test"}'::jsonb)
      on conflict(id) do update set status='active',ends_at=null
    `, [ids.platformRole, ids.platformPrincipal]);
    await client.query(`delete from platform_support_leases where id=$1`, [ids.lease]);
    await client.query(`delete from platform_admin_sessions where id=$1 or token_hash=$2`, [ids.session, tokenHash]);
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

describe.skipIf(!databaseUrl)("S8 platform admin PostgreSQL boundary", () => {
  it("mints a versioned audience-bound session, verifies bounded step-up, and issues an exact lease", async () => {
    const session = await db!.query(`select * from mint_platform_admin_session($1,$2,'manager-admin',$3,3600,'integration-test')`, [ids.session, ids.user, tokenHash]);
    expect(session.rows[0]).toMatchObject({ id: ids.session, principal_id: ids.platformPrincipal, audience: "manager-admin", session_version: 7, revoked_at: null });
    expect(session.rows[0].token_hash).toBe(tokenHash);
    expect(JSON.stringify(session.rows[0])).not.toContain(token);

    const stepped = await db!.query(`select * from step_up_platform_admin_session($1,'integration-mfa',300)`, [tokenHash]);
    expect(stepped.rows[0].step_up_at).toBeTruthy();
    expect(stepped.rows[0].step_up_expires_at).toBeTruthy();

    const lease = await db!.query(`select * from issue_platform_support_lease($1,$2,$3,$4,$5,$6,$7,600)`, [
      ids.lease,
      tokenHash,
      ids.account,
      ids.employee,
      ids.assignment,
      ["admin:employee:inspect", "admin:suspend_employee"],
      "Customer requested exact incident remediation.",
    ]);
    expect(lease.rows[0]).toMatchObject({
      id: ids.lease,
      principal_id: ids.platformPrincipal,
      account_id: ids.account,
      employee_id: ids.employee,
      assignment_id: ids.assignment,
      issued_by_session_id: ids.session,
      policy_version: "platform-admin-v1",
    });
  });

  it("rejects cross-employee assignment leases and non-step-up sessions", async () => {
    await expect(db!.query(`select * from issue_platform_support_lease('psl_s8_wrong',$1,$2,$3,$4,array['admin:employee:inspect'],'Wrong assignment request',300)`, [
      tokenHash, ids.account, ids.employee, ids.assignmentOther,
    ])).rejects.toThrow(/support_lease_assignment_scope_mismatch/);

    await db!.query(`update platform_admin_sessions set step_up_at=null,step_up_expires_at=null where id=$1`, [ids.session]);
    await expect(db!.query(`select * from issue_platform_support_lease('psl_s8_no_step',$1,$2,$3,$4,array['admin:employee:inspect'],'No step up request',300)`, [
      tokenHash, ids.account, ids.employee, ids.assignment,
    ])).rejects.toThrow(/platform_step_up_required/);
    await db!.query(`select * from step_up_platform_admin_session($1,'integration-mfa',300)`, [tokenHash]);
  });

  it("allows C3 registration only for a current durable platform principal", async () => {
    const valid = await db!.query(`
      select * from register_durable_command(
        'intent_s8_valid',$1,$2,'platform',$3,'platform-admin:valid','cmd_s8_valid',
        'platform.admin.support_action','1.0.0','platform-admin-v1','{}'::jsonb,$4,
        'corr_s8_valid',null
      )
    `, [ids.assignment, ids.platformPrincipal, `platform_admin_session:${ids.session}`, payloadHash]);
    expect(valid.rows[0]).toMatchObject({ intent_id: "intent_s8_valid", command_id: "cmd_s8_valid", duplicate: false, status: "requested" });

    await expect(db!.query(`
      select * from register_durable_command(
        'intent_s8_fake',$1,'ppr_s8_fake','platform','fake','platform-admin:fake','cmd_s8_fake',
        'platform.admin.support_action','1.0.0','platform-admin-v1','{}'::jsonb,$2,
        'corr_s8_fake',null
      )
    `, [ids.assignment, payloadHash])).rejects.toThrow(/unauthorized_platform_command_actor/);

    await expect(db!.query(`
      select * from register_durable_command(
        'intent_s8_policy',$1,$2,'platform','fake','platform-admin:policy','cmd_s8_policy',
        'platform.admin.support_action','1.0.0','authorization-v1','{}'::jsonb,$3,
        'corr_s8_policy',null
      )
    `, [ids.assignment, ids.platformPrincipal, payloadHash])).rejects.toThrow(/platform_command_policy_version_invalid/);
  });

  it("terminates a platform write only through an accepted C3 receipt and replay", async () => {
    const leaseToken = "lease_s8_valid";
    await db!.query(`select * from claim_durable_command('cmd_s8_valid',$1,120)`, [leaseToken]);
    await db!.query(`select * from reserve_effect_attempt('eff_s8_valid','cmd_s8_valid','platform-admin:suspend','manager','suspend_employee','consumer_dedupe',$1,null,$2,120)`, [payloadHash, leaseToken]);
    await db!.query(`select * from record_effect_receipt('erec_s8_valid','eff_s8_valid','accepted','admin-action:adact_s8',null,null,$1,$2,'{"admin_action_id":"adact_s8"}'::jsonb)`, [payloadHash, leaseToken]);
    const completed = await db!.query(`select * from complete_durable_command('cmd_s8_valid',$1,'erec_s8_valid','replay_s8_valid',$2,'{"result":{"status":"ok"}}'::jsonb)`, [
      leaseToken,
      `sha256:${createHash("sha256").update('{"result":{"status":"ok"}}').digest("hex")}`,
    ]);
    expect(completed.rows[0]).toMatchObject({ status: "succeeded", terminal_receipt_id: "erec_s8_valid" });
    const replay = await db!.query(`select status,terminal_receipt_id,response from command_replay_responses where command_id='cmd_s8_valid'`);
    expect(replay.rows[0]).toMatchObject({ status: "succeeded", terminal_receipt_id: "erec_s8_valid", response: { result: { status: "ok" } } });
  });

  it("serializes append-only platform audit evidence and rejects mutation", async () => {
    const first = await db!.query(`select * from append_platform_admin_audit('pada_s8_1',$1,$2,$3,'manager-admin','admin:suspend_employee','support_write',$4,$5,$6,'allowed',null,$7,'{"c3":true}'::jsonb)`, [
      ids.platformPrincipal, ids.session, ids.lease, ids.account, ids.employee, ids.assignment, "Customer requested exact incident remediation.",
    ]);
    const second = await db!.query(`select * from append_platform_admin_audit('pada_s8_2',$1,$2,$3,'manager-admin','admin:suspend_employee','support_write',$4,$5,$6,'failed','provider_failed',$7,'{"c3":true}'::jsonb)`, [
      ids.platformPrincipal, ids.session, ids.lease, ids.account, ids.employee, ids.assignment, "Customer requested exact incident remediation.",
    ]);
    expect(second.rows[0].previous_hash).toBe(first.rows[0].entry_hash);
    expect(second.rows[0].entry_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    await expect(db!.query(`update platform_admin_audit_chain set reason='changed' where id='pada_s8_1'`)).rejects.toThrow(/platform_admin_audit_append_only/);
    await expect(db!.query(`delete from platform_admin_audit_chain where id='pada_s8_1'`)).rejects.toThrow(/platform_admin_audit_append_only/);
  });
});
