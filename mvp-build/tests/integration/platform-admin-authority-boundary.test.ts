import { createHash } from "node:crypto";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL ?? process.env.DATABASE_URL;
let db: Client | undefined;
const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const id = (prefix: string) => `${prefix}_${suffix}`;

const ids = {
  account: id("acct_s8"),
  user: id("user_s8"),
  employee: id("emp_s8"),
  employeeOther: id("emp_s8_other"),
  organization: id("org_s8"),
  employeePrincipal: id("epr_s8"),
  employeePrincipalOther: id("epr_s8_other"),
  assignment: id("asn_s8"),
  assignmentOther: id("asn_s8_other"),
  platformPrincipal: id("ppr_s8_owner"),
  platformRole: id("pprr_s8_owner"),
  session: id("pads_s8_owner"),
  lease: id("psl_s8_owner"),
  wrongLease: id("psl_s8_wrong"),
  noStepLease: id("psl_s8_no_step"),
  validIntent: id("intent_s8_valid"),
  validCommand: id("cmd_s8_valid"),
  fakeIntent: id("intent_s8_fake"),
  fakeCommand: id("cmd_s8_fake"),
  policyIntent: id("intent_s8_policy"),
  policyCommand: id("cmd_s8_policy"),
  effect: id("eff_s8_valid"),
  effectReceipt: id("erec_s8_valid"),
  replay: id("replay_s8_valid"),
  auditOne: id("pada_s8_1"),
  auditTwo: id("pada_s8_2"),
};
const token = id("pad_s8_token_not_stored_raw");
const tokenHash = createHash("sha256").update(token).digest("hex");
const payloadHash = `sha256:${createHash("sha256").update("{}").digest("hex")}`;

async function seed(client: Client) {
  await client.query("begin");
  try {
    await client.query(`insert into accounts(id,display_name,slug) values($1,'S8 Matrix',$2)`, [ids.account, `s8-${suffix}`]);
    await client.query(`insert into users(id,email,full_name) values($1,$2,'S8 Owner')`, [ids.user, `s8-${suffix}@example.invalid`]);
    await client.query(`insert into employees(id,account_id,name,status) values($1,$3,'S8 Employee','live'),($2,$3,'S8 Other','live')`, [ids.employee, ids.employeeOther, ids.account]);
    await client.query(`insert into organizations(id,display_name,status) values($1,'S8 Organization','active')`, [ids.organization]);
    await client.query(`insert into employee_principals(id,employee_id,status) values($1,$3,'active'),($2,$4,'active')`, [ids.employeePrincipal, ids.employeePrincipalOther, ids.employee, ids.employeeOther]);
    await client.query(`
      insert into employee_assignments(id,organization_id,account_id,employee_principal_id,status,starts_at,policy_version,provenance)
      values($1,$3,$4,$5,'active',now()-interval '1 day','authorization-v1','{"source":"test"}'::jsonb),
            ($2,$3,$4,$6,'active',now()-interval '1 day','authorization-v1','{"source":"test"}'::jsonb)
    `, [ids.assignment, ids.assignmentOther, ids.organization, ids.account, ids.employeePrincipal, ids.employeePrincipalOther]);
    await client.query(`
      insert into platform_principals(id,user_id,status,session_version,starts_at,ends_at,provenance)
      values($1,$2,'active',7,now()-interval '1 day',null,'{"source":"test"}'::jsonb)
    `, [ids.platformPrincipal, ids.user]);
    await client.query(`
      insert into platform_principal_roles(id,principal_id,role,status,starts_at,ends_at,provenance)
      values($1,$2,'platform_owner','active',now()-interval '1 day',null,'{"source":"test"}'::jsonb)
    `, [ids.platformRole, ids.platformPrincipal]);
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
    await expect(db!.query(`select * from issue_platform_support_lease($1,$2,$3,$4,$5,array['admin:employee:inspect'],'Wrong assignment request',300)`, [
      ids.wrongLease, tokenHash, ids.account, ids.employee, ids.assignmentOther,
    ])).rejects.toThrow(/support_lease_assignment_scope_mismatch/);

    await db!.query(`update platform_admin_sessions set step_up_at=null,step_up_expires_at=null where id=$1`, [ids.session]);
    await expect(db!.query(`select * from issue_platform_support_lease($1,$2,$3,$4,$5,array['admin:employee:inspect'],'No step up request',300)`, [
      ids.noStepLease, tokenHash, ids.account, ids.employee, ids.assignment,
    ])).rejects.toThrow(/platform_step_up_required/);
    await db!.query(`select * from step_up_platform_admin_session($1,'integration-mfa',300)`, [tokenHash]);
  });

  it("allows C3 registration only for a current durable platform principal", async () => {
    const valid = await db!.query(`
      select * from register_durable_command(
        $1,$2,$3,'platform',$4,$5,$6,
        'platform.admin.support_action','1.0.0','platform-admin-v1','{}'::jsonb,$7,
        $8,null
      )
    `, [ids.validIntent, ids.assignment, ids.platformPrincipal, `platform_admin_session:${ids.session}`, `platform-admin:${ids.validCommand}`, ids.validCommand, payloadHash, id("corr_s8_valid")]);
    expect(valid.rows[0]).toMatchObject({ intent_id: ids.validIntent, command_id: ids.validCommand, duplicate: false, status: "requested" });

    await expect(db!.query(`
      select * from register_durable_command(
        $1,$2,$3,'platform','fake',$4,$5,
        'platform.admin.support_action','1.0.0','platform-admin-v1','{}'::jsonb,$6,
        $7,null
      )
    `, [ids.fakeIntent, ids.assignment, id("ppr_s8_fake"), `platform-admin:${ids.fakeCommand}`, ids.fakeCommand, payloadHash, id("corr_s8_fake")])).rejects.toThrow(/unauthorized_platform_command_actor/);

    await expect(db!.query(`
      select * from register_durable_command(
        $1,$2,$3,'platform','fake',$4,$5,
        'platform.admin.support_action','1.0.0','authorization-v1','{}'::jsonb,$6,
        $7,null
      )
    `, [ids.policyIntent, ids.assignment, ids.platformPrincipal, `platform-admin:${ids.policyCommand}`, ids.policyCommand, payloadHash, id("corr_s8_policy")])).rejects.toThrow(/platform_command_policy_version_invalid/);
  });

  it("terminates a platform write only through an accepted C3 receipt and replay", async () => {
    const leaseToken = id("lease_s8_valid");
    await db!.query(`select * from claim_durable_command($1,$2,120)`, [ids.validCommand, leaseToken]);
    await db!.query(`select * from reserve_effect_attempt($1,$2,$3,'manager','suspend_employee','consumer_dedupe',$4,null,$5,120)`, [ids.effect, ids.validCommand, id("platform-admin-suspend"), payloadHash, leaseToken]);
    await db!.query(`select * from record_effect_receipt($1,$2,'accepted',$3,null,null,$4,$5,$6::jsonb)`, [ids.effectReceipt, ids.effect, id("admin-action"), payloadHash, leaseToken, JSON.stringify({ admin_action_id: id("adact_s8") })]);
    const response = '{"result":{"status":"ok"}}';
    const completed = await db!.query(`select * from complete_durable_command($1,$2,$3,$4,$5,$6::jsonb)`, [
      ids.validCommand,
      leaseToken,
      ids.effectReceipt,
      ids.replay,
      `sha256:${createHash("sha256").update(response).digest("hex")}`,
      response,
    ]);
    expect(completed.rows[0]).toMatchObject({ status: "succeeded", terminal_receipt_id: ids.effectReceipt });
    const replay = await db!.query(`select status,terminal_receipt_id,response from command_replay_responses where command_id=$1`, [ids.validCommand]);
    expect(replay.rows[0]).toMatchObject({ status: "succeeded", terminal_receipt_id: ids.effectReceipt, response: { result: { status: "ok" } } });
  });

  it("serializes append-only platform audit evidence and rejects mutation", async () => {
    const first = await db!.query(`select * from append_platform_admin_audit($1,$2,$3,$4,'manager-admin','admin:suspend_employee','support_write',$5,$6,$7,'allowed',null,$8,'{"c3":true}'::jsonb)`, [
      ids.auditOne, ids.platformPrincipal, ids.session, ids.lease, ids.account, ids.employee, ids.assignment, "Customer requested exact incident remediation.",
    ]);
    const second = await db!.query(`select * from append_platform_admin_audit($1,$2,$3,$4,'manager-admin','admin:suspend_employee','support_write',$5,$6,$7,'failed','provider_failed',$8,'{"c3":true}'::jsonb)`, [
      ids.auditTwo, ids.platformPrincipal, ids.session, ids.lease, ids.account, ids.employee, ids.assignment, "Customer requested exact incident remediation.",
    ]);
    expect(second.rows[0].previous_hash).toBe(first.rows[0].entry_hash);
    expect(second.rows[0].entry_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    await expect(db!.query(`update platform_admin_audit_chain set reason='changed' where id=$1`, [ids.auditOne])).rejects.toThrow(/platform_admin_audit_append_only/);
    await expect(db!.query(`delete from platform_admin_audit_chain where id=$1`, [ids.auditOne])).rejects.toThrow(/platform_admin_audit_append_only/);
  });
});
