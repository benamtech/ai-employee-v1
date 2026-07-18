import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL;
let db: Client | undefined;

const ids = {
  account: "acct_reconcile_matrix",
  user: "user_reconcile_matrix",
  employee: "emp_reconcile_matrix",
  organization: "org_reconcile_matrix",
  orgAccount: "rel_reconcile_org_account",
  human: "hpr_reconcile_owner",
  employeePrincipal: "epr_reconcile_employee",
  assignment: "asn_reconcile_matrix",
  employment: "rel_reconcile_employment",
  ownerPrincipal: "aspr_reconcile_owner",
  intent: "intent_reconcile_matrix",
  command: "cmd_reconcile_matrix",
  effect: "eff_reconcile_matrix",
  receipt: "erec_reconcile_matrix",
  replay: "replay_reconcile_matrix",
};

const payloadHash = `sha256:${"a".repeat(64)}`;
const requestHash = `sha256:${"b".repeat(64)}`;
const ambiguousResponseHash = `sha256:${"c".repeat(64)}`;
const acceptedResponseHash = `sha256:${"d".repeat(64)}`;

async function seed(client: Client): Promise<void> {
  await client.query("begin");
  try {
    await client.query(`
      insert into accounts(id, display_name, slug)
      values($1, 'Reconcile Matrix', 'reconcile-matrix')
      on conflict (id) do update set display_name = excluded.display_name
    `, [ids.account]);
    await client.query(`
      insert into users(id, email, full_name)
      values($1, 'reconcile-owner@example.invalid', 'Reconcile Owner')
      on conflict (id) do update set email = excluded.email
    `, [ids.user]);
    await client.query(`
      insert into employees(id, account_id, name, status)
      values($1, $2, 'Reconcile Employee', 'live')
      on conflict (id) do update set account_id = excluded.account_id, status = excluded.status
    `, [ids.employee, ids.account]);
    await client.query(`
      insert into organizations(id, display_name, status)
      values($1, 'Reconcile Organization', 'active')
      on conflict (id) do update set status = 'active'
    `, [ids.organization]);
    await client.query(`
      insert into organization_accounts(id, organization_id, account_id, status, starts_at, provenance)
      values($1, $2, $3, 'active', now() - interval '1 day', '{"source":"test"}'::jsonb)
      on conflict (id) do update set status = 'active', ends_at = null
    `, [ids.orgAccount, ids.organization, ids.account]);
    await client.query(`
      insert into human_principals(id, user_id, status)
      values($1, $2, 'active')
      on conflict (user_id) do update set id = excluded.id, status = 'active'
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
      on conflict (id) do update set role = 'owner', status = 'active', ends_at = null, policy_version = 'authorization-v1'
    `, [ids.ownerPrincipal, ids.assignment, ids.human]);
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

describe.skipIf(!databaseUrl)("C3 ambiguous command reconciliation", () => {
  it("reconciles queryable durable downstream proof without executing a second effect", async () => {
    await db!.query(`
      select * from register_durable_command(
        $1,$2,$3,'human','owner_web_session:test','owner-web:test-intent',$4,
        'owner.web.turn','1.0.0','authorization-v1',$5::jsonb,$6,'corr-reconcile',null
      )
    `, [
      ids.intent,
      ids.assignment,
      ids.human,
      ids.command,
      JSON.stringify({ employee_id: ids.employee, intent_id: "test-intent", body_hash: payloadHash }),
      payloadHash,
    ]);
    const lease = "lease_reconcile_matrix";
    await db!.query(`select * from claim_durable_command($1,$2,60)`, [ids.command, lease]);
    await db!.query(`
      select * from reserve_effect_attempt(
        $1,$2,'owner-web-turn:test-intent','hermes','owner_turn','consumer_dedupe',
        $3,null,$4,60
      )
    `, [ids.effect, ids.command, requestHash, lease]);
    await db!.query(`
      select * from record_effect_receipt(
        $1,$2,'ambiguous',null,null,'hermes_turn_queued',$3,$4,
        '{"turn_job_id":"turn_reconcile_matrix","run_id":"run_reconcile_matrix"}'::jsonb
      )
    `, [ids.receipt, ids.effect, requestHash, lease]);
    await db!.query(`
      select * from complete_durable_command(
        $1,$2,$3,$4,$5,'{"result":null,"ambiguity_code":"hermes_turn_queued"}'::jsonb
      )
    `, [ids.command, lease, ids.receipt, ids.replay, ambiguousResponseHash]);

    const acceptedResponse = {
      result: {
        assignment_id: ids.assignment,
        employee_id: ids.employee,
        reply: "Reconciled reply",
        turn_job_id: "turn_reconcile_matrix",
        run_id: "run_reconcile_matrix",
      },
    };
    const reconciled = await db!.query(`
      select * from reconcile_ambiguous_command(
        $1,'accepted','hermes-turn-job:turn_reconcile_matrix',null,$2,$3::jsonb,$4::jsonb
      )
    `, [
      ids.command,
      acceptedResponseHash,
      JSON.stringify(acceptedResponse),
      JSON.stringify({ source: "employee_turn_jobs", turn_job_id: "turn_reconcile_matrix" }),
    ]);
    expect(reconciled.rows[0]).toMatchObject({ id: ids.command, status: "succeeded" });

    const state = await db!.query(`
      select
        (select state from effect_attempts where id = $1) as effect_state,
        (select state from effect_receipts where id = $2) as receipt_state,
        (select provider_receipt_id from effect_receipts where id = $2) as provider_receipt_id,
        (select status from command_replay_responses where command_id = $3) as replay_status,
        (select response from command_replay_responses where command_id = $3) as response,
        (select count(*)::int from effect_attempts where command_id = $3) as effect_count
    `, [ids.effect, ids.receipt, ids.command]);
    expect(state.rows[0]).toMatchObject({
      effect_state: "reconciled",
      receipt_state: "accepted",
      provider_receipt_id: "hermes-turn-job:turn_reconcile_matrix",
      replay_status: "succeeded",
      effect_count: 1,
    });
    expect(state.rows[0].response).toEqual(acceptedResponse);

    const duplicate = await db!.query(`
      select * from reconcile_ambiguous_command(
        $1,'accepted','hermes-turn-job:turn_reconcile_matrix',null,$2,$3::jsonb,$4::jsonb
      )
    `, [
      ids.command,
      acceptedResponseHash,
      JSON.stringify(acceptedResponse),
      JSON.stringify({ source: "employee_turn_jobs", turn_job_id: "turn_reconcile_matrix" }),
    ]);
    expect(duplicate.rows[0]).toMatchObject({ id: ids.command, status: "succeeded" });

    await expect(db!.query(`
      select * from reconcile_ambiguous_command(
        $1,'failed',null,'contradictory_failure',$2,'{"result":null}'::jsonb,'{}'::jsonb
      )
    `, [ids.command, `sha256:${"e".repeat(64)}`])).rejects.toThrow(/command_already_reconciled/);
  });
});
