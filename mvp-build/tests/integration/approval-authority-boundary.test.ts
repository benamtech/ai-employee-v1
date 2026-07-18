import { createHash } from "node:crypto";
import { Client, Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL;
let db: Client | undefined;
let racePool: Pool | undefined;

const ids = {
  account: "acct_s7_matrix",
  user: "user_s7_matrix",
  employee: "emp_s7_matrix",
  organization: "org_s7_matrix",
  orgAccount: "rel_s7_org_account",
  human: "hpr_s7_owner",
  employeePrincipal: "epr_s7_employee",
  assignment: "asn_s7_matrix",
  employment: "rel_s7_employment",
  ownerPrincipal: "aspr_s7_owner",
  employeeAssignmentPrincipal: "aspr_s7_employee",
  connector: "conn_s7_qbo",
  policy: "apol_s7_qbo",
};

const action = "commit_quickbooks_expense";
const resourceClass = "quickbooks_pending_write";
const policyVersion = "authorization-v1";

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function sha256(value: string): string {
  return `sha256:${digest(value)}`;
}

async function seedBase(client: Client): Promise<void> {
  await client.query("begin");
  try {
    await client.query(`
      insert into accounts(id, display_name, slug)
      values($1, 'S7 Matrix', 's7-matrix')
      on conflict (id) do update set display_name = excluded.display_name
    `, [ids.account]);
    await client.query(`
      insert into users(id, email, full_name)
      values($1, 's7-owner@example.invalid', 'S7 Owner')
      on conflict (id) do update set email = excluded.email
    `, [ids.user]);
    await client.query(`
      insert into employees(id, account_id, name, status)
      values($1, $2, 'S7 Employee', 'live')
      on conflict (id) do update set account_id = excluded.account_id, status = excluded.status
    `, [ids.employee, ids.account]);
    await client.query(`
      insert into organizations(id, display_name, status)
      values($1, 'S7 Organization', 'active')
      on conflict (id) do update set status = excluded.status
    `, [ids.organization]);
    await client.query(`
      insert into organization_accounts(id, organization_id, account_id, status, starts_at, provenance)
      values($1, $2, $3, 'active', now() - interval '1 day', '{"source":"test"}'::jsonb)
      on conflict (id) do update set status = 'active', ends_at = null
    `, [ids.orgAccount, ids.organization, ids.account]);
    await client.query(`
      insert into human_principals(id, user_id, status)
      values($1, $2, 'active')
      on conflict (id) do update set status = 'active'
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
      ) values($1,$2,$3,$4,'active',now() - interval '1 day',$5,'{"source":"test"}'::jsonb)
      on conflict (id) do update set status = 'active', ends_at = null, policy_version = excluded.policy_version
    `, [ids.assignment, ids.organization, ids.account, ids.employeePrincipal, policyVersion]);
    await client.query(`
      insert into labor_relationships(
        id, relationship_type, subject_principal_id, subject_principal_class,
        organization_id, account_id, assignment_id, role, status,
        starts_at, policy_version, provenance
      ) values(
        $1,'employment',$2,'employee',$3,$4,$5,'employee','active',
        now() - interval '1 day',$6,'{"source":"test"}'::jsonb
      )
      on conflict (id) do update set status = 'active', ends_at = null
    `, [ids.employment, ids.employeePrincipal, ids.organization, ids.account, ids.assignment, policyVersion]);
    await client.query(`
      insert into assignment_principals(
        id, assignment_id, principal_id, principal_class, role, status,
        starts_at, policy_version, provenance
      ) values
        ($1,$2,$3,'human','owner','active',now() - interval '1 day',$5,'{"source":"test"}'::jsonb),
        ($4,$2,$6,'employee','operator','active',now() - interval '1 day',$5,'{"source":"test"}'::jsonb)
      on conflict (id) do update set status = 'active', ends_at = null, policy_version = excluded.policy_version
    `, [
      ids.ownerPrincipal, ids.assignment, ids.human,
      ids.employeeAssignmentPrincipal, policyVersion, ids.employeePrincipal,
    ]);
    await client.query(`
      insert into assignment_authority_policies(
        id, assignment_id, policy_version, action, required_roles,
        risk_class, step_up_required, status
      ) values($1,$2,$3,$4,array['owner','billing','approver'],'high',true,'active')
      on conflict (assignment_id, policy_version, action) do update set
        required_roles = excluded.required_roles, risk_class = excluded.risk_class,
        step_up_required = true, status = 'active'
    `, [ids.policy, ids.assignment, policyVersion, action]);
    await client.query(`
      insert into connector_accounts(
        id, employee_id, account_id, connector_key, provider, status,
        scopes, token_secret_ref, environment, realm_id
      ) values($1,$2,$3,'accounting','quickbooks','connected',array['com.intuit.quickbooks.accounting'],'sealed:test','sandbox','realm-s7')
      on conflict (id) do update set status = 'connected', token_secret_ref = 'sealed:test'
    `, [ids.connector, ids.employee, ids.account]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function createPendingWrite(client: Client, suffix: string, payload: Record<string, unknown> = { AccountRef: { value: "1" }, TotalAmt: 42 }): Promise<string> {
  const id = `qbpw_s7_${suffix}`;
  const serialized = JSON.stringify(payload);
  await client.query(`
    insert into quickbooks_pending_writes(
      id, account_id, employee_id, connector_id, assignment_id,
      action_key, entity_type, canonical_payload, payload_hash, status
    ) values($1,$2,$3,$4,$5,$6,'Purchase',$7,$8,'pending_approval')
    on conflict (id) do update set
      canonical_payload = excluded.canonical_payload,
      payload_hash = excluded.payload_hash,
      status = 'pending_approval',
      assignment_id = excluded.assignment_id,
      approval_id = null,
      qbo_entity_id = null,
      qbo_sync_token = null,
      intuit_tid = null,
      committed_at = null
  `, [id, ids.account, ids.employee, ids.connector, ids.assignment, action, serialized, digest(serialized)]);
  return id;
}

async function createApproval(client: Client, suffix: string, options: { expiresAt?: string; resourceId?: string } = {}) {
  const resourceId = options.resourceId ?? await createPendingWrite(client, suffix);
  const approvalId = `appr_s7_${suffix}`;
  const intentId = `intent_s7_${suffix}`;
  const commandId = `cmd_s7_${suffix}`;
  const effectKey = `approval:${approvalId}:${action}`;
  const result = await client.query<{
    id: string;
    snapshot_hash: string;
    command_intent_id: string;
    command_id: string;
    effect_key: string;
  }>(`
    select id, snapshot_hash, command_intent_id, command_id, effect_key
      from create_approval_authority_request(
        $1,$2,$3,$4,$5,'employee',$6,$7,$8,
        'Approve the exact QuickBooks expense','high','web',$9,$10,$11,$12
      )
  `, [
    approvalId, ids.account, ids.employee, ids.assignment, ids.employeePrincipal,
    action, resourceClass, resourceId,
    options.expiresAt ?? new Date(Date.now() + 60 * 60_000).toISOString(),
    intentId, commandId, effectKey,
  ]);
  return { ...result.rows[0]!, approvalId, resourceId };
}

async function resolve(client: Client, approvalId: string, snapshotHash: string, resolution: "approved" | "rejected", channel = "web") {
  return client.query<{
    approval_id: string;
    resolution: string;
    resolver_role: string;
    command_id: string;
    effect_key: string;
    duplicate: boolean;
  }>(`
    select * from resolve_approval_authority($1,$2,$3,$4,$5,'test:human-principal')
  `, [approvalId, ids.human, resolution, channel, snapshotHash]);
}

beforeAll(async () => {
  if (!databaseUrl) return;
  db = new Client({ connectionString: databaseUrl });
  await db.connect();
  racePool = new Pool({ connectionString: databaseUrl, max: 50 });
  await seedBase(db);
});

afterAll(async () => {
  await racePool?.end();
  await db?.end();
});

describe.skipIf(!databaseUrl)("S7 approval authority PostgreSQL boundary", () => {
  it("persists an immutable principal-bound request with exact snapshot, policy, grant, and C3 identity", async () => {
    const approval = await createApproval(db!, "immutable");
    const row = await db!.query(`
      select status, assignment_id, requester_principal_id, requester_principal_class,
             action_key, resource_class, resource_id, snapshot, snapshot_hash,
             policy_version, required_resolver_roles, required_resolver_action,
             command_intent_id, command_id, effect_key, execution_state
        from approvals where id = $1
    `, [approval.approvalId]);
    expect(row.rows[0]).toMatchObject({
      status: "pending",
      assignment_id: ids.assignment,
      requester_principal_id: ids.employeePrincipal,
      requester_principal_class: "employee",
      action_key: action,
      resource_class: resourceClass,
      resource_id: approval.resourceId,
      snapshot_hash: approval.snapshot_hash,
      policy_version: policyVersion,
      command_intent_id: approval.command_intent_id,
      command_id: approval.command_id,
      effect_key: approval.effect_key,
      execution_state: "not_started",
    });
    expect(row.rows[0].required_resolver_roles).toEqual(["owner", "billing", "approver"]);
    expect(row.rows[0].required_resolver_action).toBe(`approval:resolve:${action}`);
    expect(row.rows[0].snapshot.payload_hash).toMatch(/^sha256:/);
    const grant = await db!.query(`
      select assignment_id, resource_class, resource_id, actions, status
        from assignment_resource_grants
       where assignment_id = $1 and resource_class = 'approval' and resource_id = $2
    `, [ids.assignment, approval.approvalId]);
    expect(grant.rows[0]).toMatchObject({ assignment_id: ids.assignment, resource_class: "approval", resource_id: approval.approvalId, status: "active" });
    expect(grant.rows[0].actions).toEqual([`approval:resolve:${action}`]);

    await expect(db!.query(`update approvals set snapshot_hash = $2 where id = $1`, [approval.approvalId, `sha256:${"f".repeat(64)}`]))
      .rejects.toThrow(/approval_immutable_authority_changed/);
  });

  it("denies self-resolution, changed resources, expired requests, and revoked resolver roles", async () => {
    const self = await createApproval(db!, "self");
    await expect(db!.query(`
      select * from resolve_approval_authority($1,$2,'approved','web',$3,'test:employee')
    `, [self.approvalId, ids.employeePrincipal, self.snapshot_hash])).rejects.toThrow(/approval_self_resolution_denied/);

    const changed = await createApproval(db!, "changed");
    const changedPayload = JSON.stringify({ AccountRef: { value: "1" }, TotalAmt: 99 });
    await db!.query(`
      update quickbooks_pending_writes
         set canonical_payload = $2, payload_hash = $3
       where id = $1
    `, [changed.resourceId, changedPayload, digest(changedPayload)]);
    await expect(resolve(db!, changed.approvalId, changed.snapshot_hash, "approved"))
      .rejects.toThrow(/approval_snapshot_changed/);

    const expired = await createApproval(db!, "expired");
    await db!.query(`update approvals set expires_at = now() - interval '1 second' where id = $1`, [expired.approvalId]);
    await expect(resolve(db!, expired.approvalId, expired.snapshot_hash, "approved"))
      .rejects.toThrow(/approval_expired/);

    const revoked = await createApproval(db!, "revoked-role");
    await db!.query(`update assignment_principals set status = 'revoked' where id = $1`, [ids.ownerPrincipal]);
    await expect(resolve(db!, revoked.approvalId, revoked.snapshot_hash, "approved"))
      .rejects.toThrow(/approval_resolver_role_denied/);
    await db!.query(`update assignment_principals set status = 'active' where id = $1`, [ids.ownerPrincipal]);
  });

  it("serializes 100 concurrent approve/reject attempts into one terminal decision", async () => {
    const approval = await createApproval(db!, "race");
    const attempts = Array.from({ length: 100 }, (_, index) => {
      const resolution = index % 2 === 0 ? "approved" : "rejected";
      return racePool!.query(
        `select * from resolve_approval_authority($1,$2,$3,'web',$4,'test:race')`,
        [approval.approvalId, ids.human, resolution, approval.snapshot_hash],
      );
    });
    const results = await Promise.allSettled(attempts);
    const final = await db!.query(`select status, resolution, resolved_by_principal_id from approvals where id = $1`, [approval.approvalId]);
    expect(["approved", "rejected"]).toContain(final.rows[0].status);
    expect(final.rows[0].resolution).toBe(final.rows[0].status);
    expect(final.rows[0].resolved_by_principal_id).toBe(ids.human);

    const fulfilled = results.filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled");
    const rows = fulfilled.flatMap((result) => result.value.rows);
    expect(rows.filter((row) => row.duplicate === false)).toHaveLength(1);
    expect(rows.every((row) => row.resolution === final.rows[0].resolution)).toBe(true);
    const commandCount = await db!.query(`select count(*)::int as count from durable_commands where id = $1`, [approval.command_id]);
    expect(commandCount.rows[0].count).toBe(final.rows[0].status === "approved" ? 1 : 0);
  }, 30_000);

  it("consumes one principal-bound signed preview link atomically with the decision", async () => {
    const approval = await createApproval(db!, "signed");
    const linkId = "prev_s7_signed";
    await db!.query(`
      insert into preview_links(
        id, account_id, employee_id, assignment_id, resolver_principal_id,
        policy_version, approval_snapshot_hash, token_jti,
        resource_type, resource_id, token_hash, actions, audience, expires_at
      ) values(
        $1,$2,$3,$4,$5,$6,$7,'jti-s7-signed','approval',$8,
        'token-hash-s7-signed',array['approve','reject'],'owner',now() + interval '1 hour'
      )
    `, [linkId, ids.account, ids.employee, ids.assignment, ids.human, policyVersion, approval.snapshot_hash, approval.approvalId]);
    const result = await resolve(db!, approval.approvalId, approval.snapshot_hash, "approved", "sms");
    expect(result.rows[0]).toMatchObject({ approval_id: approval.approvalId, resolution: "approved", resolver_role: "owner", duplicate: false });
    const link = await db!.query(`select consumed_at from preview_links where id = $1`, [linkId]);
    expect(link.rows[0].consumed_at).toBeTruthy();
    await expect(resolve(db!, approval.approvalId, approval.snapshot_hash, "rejected", "sms"))
      .rejects.toThrow(/approval_already_resolved/);
  });

  it("revalidates authority at execution and links exactly one C3 receipt", async () => {
    const approval = await createApproval(db!, "execute");
    await resolve(db!, approval.approvalId, approval.snapshot_hash, "approved");
    const authorized = await db!.query(`
      select id, assignment_id, command_id, effect_key, snapshot_hash
        from assert_approved_action_execution($1,$2,$3,$4,$5)
    `, [approval.approvalId, action, resourceClass, approval.resourceId, approval.snapshot_hash]);
    expect(authorized.rows[0]).toMatchObject({ id: approval.approvalId, assignment_id: ids.assignment, command_id: approval.command_id, effect_key: approval.effect_key });

    const lease = "lease_s7_execute";
    const effectId = "eff_s7_execute";
    const receiptId = "erec_s7_execute";
    const requestHash = sha256("s7 approved provider request");
    const response = { result: { qbo_entity_id: "qbo-s7-1" } };
    const responseHash = sha256(JSON.stringify(response));
    const claimed = await db!.query(`select id from claim_durable_command($1,$2,120)`, [approval.command_id, lease]);
    expect(claimed.rows[0].id).toBe(approval.command_id);
    await db!.query(`
      select * from reserve_effect_attempt(
        $1,$2,$3,'quickbooks','create.Purchase','native_idempotency',$4,$5,$6,120
      )
    `, [effectId, approval.command_id, approval.effect_key, requestHash, approval.resourceId, lease]);
    await db!.query(`
      select * from record_effect_receipt(
        $1,$2,'accepted','intuit-tid-s7',null,null,$3,$4,
        '{"qbo_entity_id":"qbo-s7-1"}'::jsonb
      )
    `, [receiptId, effectId, requestHash, lease]);
    await db!.query(`
      select * from complete_durable_command($1,$2,$3,'replay_s7_execute',$4,$5::jsonb)
    `, [approval.command_id, lease, receiptId, responseHash, JSON.stringify(response)]);
    await db!.query(`select * from record_approval_execution_receipt($1,$2)`, [approval.approvalId, receiptId]);

    const final = await db!.query(`
      select status, resolution, execution_state, execution_receipt_id
        from approvals where id = $1
    `, [approval.approvalId]);
    expect(final.rows[0]).toMatchObject({
      status: "approved",
      resolution: "approved",
      execution_state: "succeeded",
      execution_receipt_id: receiptId,
    });
    const counts = await db!.query(`
      select
        (select count(*)::int from durable_commands where id = $1) as commands,
        (select count(*)::int from effect_attempts where command_id = $1) as effects,
        (select count(*)::int from effect_receipts where command_id = $1) as receipts
    `, [approval.command_id]);
    expect(counts.rows[0]).toEqual({ commands: 1, effects: 1, receipts: 1 });

    await db!.query(`update assignment_principals set status = 'revoked' where id = $1`, [ids.ownerPrincipal]);
    await expect(db!.query(`
      select * from assert_approved_action_execution($1,$2,$3,$4,$5)
    `, [approval.approvalId, action, resourceClass, approval.resourceId, approval.snapshot_hash]))
      .rejects.toThrow(/approval_resolver_role_revoked/);
    await db!.query(`update assignment_principals set status = 'active' where id = $1`, [ids.ownerPrincipal]);
  });
});
