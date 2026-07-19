import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL;
let db: Client | undefined;

interface OwnerFixture {
  accountId: string;
  userId: string;
  humanId: string;
}

async function createOwner(suffix: string): Promise<OwnerFixture> {
  const accountId = `acct_s10_${suffix}`;
  const userId = `user_s10_${suffix}`;
  await db!.query(`
    insert into accounts(id, display_name, slug)
    values($1,$2,$3)
    on conflict (id) do update set display_name = excluded.display_name
  `, [accountId, `S10 ${suffix}`, `s10-${suffix}`]);
  await db!.query(`
    insert into users(id, email, full_name)
    values($1,$2,$3)
    on conflict (id) do update set email = excluded.email
  `, [userId, `s10-${suffix}@example.invalid`, `S10 ${suffix}`]);
  await db!.query(`
    insert into account_memberships(id, account_id, user_id, role)
    values($1,$2,$3,'owner')
    on conflict (account_id,user_id) do update set role = 'owner'
  `, [`mem_s10_${suffix}`, accountId, userId]);
  const human = await db!.query(`select id from human_principals where user_id = $1`, [userId]);
  return { accountId, userId, humanId: String(human.rows[0].id) };
}

async function createAccountMember(accountId: string, suffix: string, role: string): Promise<OwnerFixture> {
  const userId = `user_s10_${suffix}`;
  await db!.query(`
    insert into users(id, email, full_name)
    values($1,$2,$3)
    on conflict (id) do update set email = excluded.email
  `, [userId, `s10-${suffix}@example.invalid`, `S10 ${suffix}`]);
  await db!.query(`
    insert into account_memberships(id, account_id, user_id, role)
    values($1,$2,$3,$4)
    on conflict (account_id,user_id) do update set role = excluded.role
  `, [`mem_s10_${suffix}`, accountId, userId, role]);
  const human = await db!.query(`select id from human_principals where user_id = $1`, [userId]);
  return { accountId, userId, humanId: String(human.rows[0].id) };
}

function reserveArgs(owner: OwnerFixture, suffix: string, idempotencyKey: string) {
  return [
    `oid_s10_${suffix}`,
    `oia_s10_${suffix}_${idempotencyKey}`,
    owner.accountId,
    owner.humanId,
    "contractor",
    `S10 ${suffix}`,
    { address_line1: "123 Main St", city: "Santa Barbara", state: "CA", postal_code: "93101", country: "US" },
    `sealed:s10:${suffix}`,
    `sha256:${"a".repeat(64)}`,
    "6789",
    "middesk_tin",
    "middesk",
    "onboarding-identity-v1",
    `corr_s10_${suffix}`,
    idempotencyKey,
  ];
}

async function reserve(owner: OwnerFixture, suffix: string, key: string) {
  return db!.query(`
    select * from reserve_onboarding_identity_verification(
      $1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15
    )
  `, reserveArgs(owner, suffix, key));
}

async function verifyIdentity(owner: OwnerFixture, suffix: string) {
  const reserved = await reserve(owner, suffix, `verify-${suffix}`);
  const identityId = String(reserved.rows[0].identity_id);
  const attemptId = String(reserved.rows[0].attempt_id);
  const businessId = `middesk_${suffix}`;
  await db!.query(`select mark_onboarding_identity_provider_submission($1,$2,'pending',$3)`, [attemptId, businessId, `req_${suffix}`]);
  await db!.query(`
    select * from complete_onboarding_identity_verification($1,$2,'business.updated',$3,$4,'verified','approved')
  `, [`oiw_${suffix}`, `evt_${suffix}`, businessId, `sha256:${"b".repeat(64)}`]);
  return identityId;
}

beforeAll(async () => {
  if (!databaseUrl) return;
  db = new Client({ connectionString: databaseUrl });
  await db.connect();
});

afterAll(async () => {
  await db?.end();
});

describe.skipIf(!databaseUrl)("S10.1 onboarding identity PostgreSQL boundary", () => {
  it("blocks employee activation for an unverified owner", async () => {
    const owner = await createOwner("unverified");
    const decision = await db!.query(`select * from amtech_onboarding_identity_decision($1,$2)`, [owner.accountId, owner.humanId]);
    expect(decision.rows[0].allowed).toBe(false);
    expect(decision.rows[0].error).toBe("identity_unverified");
    await expect(db!.query(`
      select * from amtech_activate_verified_employee(
        'oid_missing',$1,$2,'Avery','contractor_estimator','{}'::jsonb,'{}'::jsonb,null,
        '{}'::jsonb,'[]'::jsonb,'[]'::jsonb,'unverified-key','authorization-v1','corr-unverified'
      )
    `, [owner.accountId, owner.humanId])).rejects.toThrow(/identity_unverified/);
  });

  it("rate limits the third verification request in a rolling 24 hour window", async () => {
    const owner = await createOwner("rate");
    const first = await reserve(owner, "rate", "attempt-one");
    const second = await reserve(owner, "rate", "attempt-two");
    const third = await reserve(owner, "rate", "attempt-three");
    expect(first.rows[0].attempt_status).toBe("requested");
    expect(second.rows[0].attempt_status).toBe("requested");
    expect(third.rows[0].attempt_status).toBe("rate_limited");
    const retryMs = new Date(third.rows[0].retry_after_at).getTime() - Date.now();
    expect(retryMs).toBeGreaterThan(86_000_000);
  });

  it("permanently blocks retry after provider rejection", async () => {
    const owner = await createOwner("rejected");
    const reserved = await reserve(owner, "rejected", "reject-one");
    const attemptId = String(reserved.rows[0].attempt_id);
    await db!.query(`select mark_onboarding_identity_provider_submission($1,'middesk_rejected','pending','req_rejected')`, [attemptId]);
    await db!.query(`
      select * from complete_onboarding_identity_verification(
        'oiw_rejected','evt_rejected','business.updated','middesk_rejected',$1,'rejected','rejected'
      )
    `, [`sha256:${"c".repeat(64)}`]);
    await expect(reserve(owner, "rejected", "reject-two")).rejects.toThrow(/identity_rejected_permanent/);
    const decision = await db!.query(`select * from amtech_onboarding_identity_decision($1,$2)`, [owner.accountId, owner.humanId]);
    expect(decision.rows[0].allowed).toBe(false);
    expect(decision.rows[0].error).toBe("identity_rejected_permanent");
  });

  it("persists a verifiable immutable identity snapshot", async () => {
    const owner = await createOwner("snapshot");
    const identityId = await verifyIdentity(owner, "snapshot");
    const snapshot = await db!.query(`
      select immutable_snapshot_hash, amtech_verify_onboarding_identity_snapshot(id) as valid
      from onboarding_identities where id = $1
    `, [identityId]);
    expect(snapshot.rows[0].immutable_snapshot_hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(snapshot.rows[0].valid).toBe(true);
    await expect(db!.query(`update onboarding_identities set business_name = 'Mutated' where id = $1`, [identityId]))
      .rejects.toThrow(/verified_identity_snapshot_immutable/);
  });

  it("atomically creates the employee assignment and accepted C3 activation receipt", async () => {
    const owner = await createOwner("activation");
    const coOwner = await createAccountMember(owner.accountId, "activation-admin", "admin");
    const unassignedViewer = await createAccountMember(owner.accountId, "activation-viewer", "viewer");
    const identityId = await verifyIdentity(owner, "activation");
    const resourceGraph = [
      { resource_key: "account", resource_type: "account", desired_state: "present", idempotency_key: "s10:account" },
      { resource_key: "employee_record", resource_type: "employee_record", desired_state: "present", idempotency_key: "s10:employee" },
      { resource_key: "runtime", resource_type: "runtime", desired_state: "started", idempotency_key: "s10:runtime" },
    ];
    const args = [
      identityId,
      owner.accountId,
      owner.humanId,
      "Avery",
      "contractor_estimator",
      JSON.stringify({ employee_name: "Avery", business_display_name: "S10 activation" }),
      JSON.stringify({}),
      "onb_s10_activation",
      JSON.stringify({ runtime_backend: "docker", effect_keys: {} }),
      JSON.stringify(resourceGraph),
      JSON.stringify([]),
      "activation-key",
      "authorization-v1",
      "corr-s10-activation",
    ];
    const activation = await db!.query(`
      select * from amtech_activate_verified_employee(
        $1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14
      )
    `, args);
    const row = activation.rows[0];
    expect(row.duplicate).toBe(false);

    const lateOwner = await createAccountMember(owner.accountId, "activation-late-owner", "owner");
    const requiredSurfaceActions = ["read", "message:create", "stream:read", "materialize", "heartbeat", "turn:create"];
    const authority = await db!.query(`
      select
        ap.principal_id,
        ap.status,
        bool_or(
          g.status = 'active'
          and g.resource_class = 'employee'
          and g.resource_id = $2
          and g.actions @> $3::text[]
        ) as has_full_surface_grant
      from assignment_principals ap
      left join assignment_resource_grants g
        on g.assignment_id = ap.assignment_id
       and g.principal_id = ap.principal_id
      where ap.assignment_id = $1
        and ap.principal_id = any($4::text[])
      group by ap.principal_id, ap.status
      order by ap.principal_id
    `, [row.assignment_id, row.employee_id, requiredSurfaceActions, [owner.humanId, coOwner.humanId, lateOwner.humanId, unassignedViewer.humanId]]);
    expect(authority.rows.map((entry) => entry.principal_id).sort()).toEqual([owner.humanId, coOwner.humanId, lateOwner.humanId].sort());
    for (const entry of authority.rows) {
      expect(entry.status).toBe("active");
      expect(entry.has_full_surface_grant).toBe(true);
    }

    await db!.query(`
      update account_memberships
         set role = 'viewer'
       where account_id = $1 and user_id = $2
    `, [owner.accountId, coOwner.userId]);
    const revoked = await db!.query(`
      select ap.status as principal_status, g.status as grant_status
        from assignment_principals ap
        join assignment_resource_grants g
          on g.assignment_id = ap.assignment_id
         and g.principal_id = ap.principal_id
         and g.resource_class = 'employee'
         and g.resource_id = $3
       where ap.assignment_id = $1
         and ap.principal_id = $2
         and g.id = 'grant_' || substr(md5('owner_employee_surface:' || ap.assignment_id || ':' || ap.principal_id), 1, 26)
    `, [row.assignment_id, coOwner.humanId, row.employee_id]);
    expect(revoked.rows[0].principal_status).toBe("revoked");
    expect(revoked.rows[0].grant_status).toBe("revoked");

    const proof = await db!.query(`
      select
        dc.status as command_status,
        er.state as receipt_status,
        er.provider_receipt_id,
        ea.status as assignment_status,
        lr.status as employment_status,
        pj.worker_context ->> 'onboarding_command_id' as job_command_id,
        oi.employee_principal_id
      from durable_commands dc
      join effect_receipts er on er.id = dc.terminal_receipt_id
      join employee_assignments ea on ea.id = dc.assignment_id
      join labor_relationships lr on lr.assignment_id = ea.id and lr.relationship_type = 'employment'
      join provisioning_jobs pj on pj.id = $2
      join onboarding_identities oi on oi.id = $3
      where dc.id = $1
    `, [row.command_id, row.provisioning_job_id, identityId]);
    expect(proof.rows[0].command_status).toBe("succeeded");
    expect(proof.rows[0].receipt_status).toBe("accepted");
    expect(proof.rows[0].provider_receipt_id).toBe(`postgres-activation:${row.provisioning_job_id}`);
    expect(proof.rows[0].assignment_status).toBe("active");
    expect(proof.rows[0].employment_status).toBe("active");
    expect(proof.rows[0].job_command_id).toBe(row.command_id);
    expect(proof.rows[0].employee_principal_id).toBe(row.employee_principal_id);

    const replay = await db!.query(`
      select * from amtech_activate_verified_employee(
        $1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14
      )
    `, args);
    expect(replay.rows[0].duplicate).toBe(true);
    expect(replay.rows[0].command_id).toBe(row.command_id);
    const commands = await db!.query(`select count(*)::int as count from durable_commands where id = $1`, [row.command_id]);
    expect(commands.rows[0].count).toBe(1);
  });
});
