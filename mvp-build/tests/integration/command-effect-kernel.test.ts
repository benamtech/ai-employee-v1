import { Client, Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL;
const REQUIRED_TABLES = [
  "command_intents",
  "durable_commands",
  "effect_attempts",
  "effect_receipts",
  "command_replay_responses",
] as const;

const HASH_A = `sha256:${"a".repeat(64)}`;
const HASH_B = `sha256:${"b".repeat(64)}`;
const HASH_C = `sha256:${"c".repeat(64)}`;

let admin: Client | undefined;
let pool: Pool | undefined;

async function assertKernelSchemaExists(client: Client): Promise<void> {
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
      `durable command/effect kernel missing: ${missing.join(", ")}. This is the expected audited RED state before Lane 3 migration implementation.`,
    );
  }
}

async function seedAssignment(client: Client): Promise<void> {
  await client.query("begin");
  try {
    await client.query(`
      insert into accounts (id, display_name, slug) values
        ('acct_kernel', 'Kernel Account', 'kernel-account')
      on conflict (id) do update set display_name = excluded.display_name;

      insert into users (id, auth_user_id, email, full_name) values
        ('user_kernel', '44444444-4444-4444-8444-444444444444', 'kernel@example.invalid', 'Kernel Owner')
      on conflict (id) do update set email = excluded.email;

      insert into employees (id, account_id, name, status) values
        ('emp_kernel', 'acct_kernel', 'Kernel Employee', 'live')
      on conflict (id) do update set account_id = excluded.account_id, status = excluded.status;

      insert into organizations (id, display_name, status) values
        ('org_kernel', 'Kernel Organization', 'active')
      on conflict (id) do update set status = excluded.status;

      insert into organization_accounts
        (id, organization_id, account_id, status, starts_at, provenance)
      values
        ('rel_kernel_org_account', 'org_kernel', 'acct_kernel', 'active', now() - interval '1 day', '{"source":"explicit","sourceRef":"kernel-test","confidence":"high"}'::jsonb)
      on conflict (organization_id, account_id) do update set status = excluded.status;

      insert into human_principals (id, user_id, status) values
        ('hpr_kernel', 'user_kernel', 'active')
      on conflict (id) do update set status = excluded.status;

      insert into employee_principals (id, employee_id, status) values
        ('epr_kernel', 'emp_kernel', 'active')
      on conflict (id) do update set status = excluded.status;

      insert into employee_assignments
        (id, organization_id, account_id, employee_principal_id, status, starts_at,
         policy_version, provenance)
      values
        ('asn_kernel', 'org_kernel', 'acct_kernel', 'epr_kernel', 'active', now() - interval '1 day',
         'assignment-v1', '{"source":"explicit","sourceRef":"kernel-test","confidence":"high"}'::jsonb)
      on conflict (id) do update set status = excluded.status;

      insert into labor_relationships
        (id, relationship_type, subject_principal_id, subject_principal_class,
         organization_id, account_id, assignment_id, role, status, starts_at,
         policy_version, provenance)
      values
        ('rel_kernel_employment', 'employment', 'epr_kernel', 'employee',
         'org_kernel', 'acct_kernel', 'asn_kernel', 'employee', 'active', now() - interval '1 day',
         'labor-v1', '{"source":"explicit","sourceRef":"kernel-test","confidence":"high"}'::jsonb)
      on conflict (id) do update set status = excluded.status;

      insert into assignment_principals
        (id, assignment_id, principal_id, principal_class, role, status, starts_at,
         policy_version, provenance)
      values
        ('aspr_kernel_owner', 'asn_kernel', 'hpr_kernel', 'human', 'owner', 'active', now() - interval '1 day',
         'authorization-v1', '{"source":"explicit","sourceRef":"kernel-test","confidence":"high"}'::jsonb)
      on conflict (assignment_id, principal_id, role) do update set status = excluded.status;
    `);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function registerCommand(input: {
  intentId: string;
  commandId: string;
  intentKey: string;
  payloadHash?: string;
  commandType?: string;
}): Promise<{ intent_id: string; command_id: string; duplicate: boolean; status: string }> {
  if (!pool) throw new Error("pool unavailable");
  const result = await pool.query(
    `select * from register_durable_command(
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14
    )`,
    [
      input.intentId,
      "asn_kernel",
      "hpr_kernel",
      "human",
      "owner-session-v2",
      input.intentKey,
      input.commandId,
      input.commandType ?? "send_estimate_email",
      "1.0.0",
      "authorization-v1",
      JSON.stringify({ estimate_id: "estimate_kernel", recipient: "customer@example.invalid" }),
      input.payloadHash ?? HASH_A,
      `corr:${input.intentKey}`,
      "turn_kernel",
    ],
  );
  return result.rows[0] as {
    intent_id: string;
    command_id: string;
    duplicate: boolean;
    status: string;
  };
}

async function claimCommand(commandId: string, leaseToken: string): Promise<Record<string, unknown> | null> {
  if (!pool) throw new Error("pool unavailable");
  const result = await pool.query(
    "select * from claim_durable_command($1,$2,$3)",
    [commandId, leaseToken, 30],
  );
  return (result.rows[0] as Record<string, unknown> | undefined) ?? null;
}

beforeAll(async () => {
  if (!databaseUrl) return;
  admin = new Client({ connectionString: databaseUrl });
  await admin.connect();
  pool = new Pool({ connectionString: databaseUrl, max: 40 });
  await assertKernelSchemaExists(admin);
  await seedAssignment(admin);
});

afterAll(async () => {
  await pool?.end();
  await admin?.end();
});

describe.skipIf(!databaseUrl)("durable command and effect kernel", () => {
  it("deduplicates one stable intent to one immutable command and rejects changed payload", async () => {
    const first = await registerCommand({
      intentId: "intent_kernel_dedupe_a",
      commandId: "cmd_kernel_dedupe_a",
      intentKey: "web:session_kernel:submit_001",
    });
    const duplicate = await registerCommand({
      intentId: "intent_kernel_dedupe_b",
      commandId: "cmd_kernel_dedupe_b",
      intentKey: "web:session_kernel:submit_001",
    });

    expect(first).toMatchObject({
      intent_id: "intent_kernel_dedupe_a",
      command_id: "cmd_kernel_dedupe_a",
      duplicate: false,
    });
    expect(duplicate).toMatchObject({
      intent_id: "intent_kernel_dedupe_a",
      command_id: "cmd_kernel_dedupe_a",
      duplicate: true,
    });

    await expect(
      registerCommand({
        intentId: "intent_kernel_conflict",
        commandId: "cmd_kernel_conflict",
        intentKey: "web:session_kernel:submit_001",
        payloadHash: HASH_B,
      }),
    ).rejects.toThrow(/idempotency_conflict/i);
  });

  it("allows exactly one winner across 100 concurrent command claims", async () => {
    await registerCommand({
      intentId: "intent_kernel_claim",
      commandId: "cmd_kernel_claim",
      intentKey: "web:session_kernel:claim_001",
    });

    const claims = await Promise.all(
      Array.from({ length: 100 }, (_, index) =>
        claimCommand("cmd_kernel_claim", `lease-${index}`),
      ),
    );
    const winners = claims.filter((claim) => claim !== null);

    expect(winners).toHaveLength(1);
    expect(winners[0]).toMatchObject({
      id: "cmd_kernel_claim",
      status: "claimed",
      claim_version: 1,
      attempt_count: 1,
    });
  });

  it("reserves one effect key across retries and rejects request-hash mutation", async () => {
    await registerCommand({
      intentId: "intent_kernel_effect",
      commandId: "cmd_kernel_effect",
      intentKey: "web:session_kernel:effect_001",
    });
    await claimCommand("cmd_kernel_effect", "lease-effect");

    if (!pool) throw new Error("pool unavailable");
    const reservations = await Promise.all(
      Array.from({ length: 50 }, (_, index) =>
        pool!.query(
          `select * from reserve_effect_attempt(
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
          )`,
          [
            `eff_kernel_effect_${index}`,
            "cmd_kernel_effect",
            "gmail:send:estimate_kernel:customer_kernel",
            "gmail",
            "messages.send",
            "queryable_receipt",
            HASH_B,
            null,
            `effect-lease-${index}`,
            30,
          ],
        ),
      ),
    );
    const effectIds = new Set(reservations.map((result) => result.rows[0]?.effect_id));
    expect(effectIds).toEqual(new Set(["eff_kernel_effect_0"]));

    await expect(
      pool.query(
        `select * from reserve_effect_attempt(
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
        )`,
        [
          "eff_kernel_effect_conflict",
          "cmd_kernel_effect",
          "gmail:send:estimate_kernel:customer_kernel",
          "gmail",
          "messages.send",
          "queryable_receipt",
          HASH_C,
          null,
          "effect-lease-conflict",
          30,
        ],
      ),
    ).rejects.toThrow(/idempotency_conflict/i);
  });

  it("cannot report command success before a matching accepted receipt is durable", async () => {
    await registerCommand({
      intentId: "intent_kernel_no_receipt",
      commandId: "cmd_kernel_no_receipt",
      intentKey: "web:session_kernel:no_receipt_001",
    });
    await claimCommand("cmd_kernel_no_receipt", "lease-no-receipt");

    if (!pool) throw new Error("pool unavailable");
    await expect(
      pool.query(
        `select * from complete_durable_command(
          $1,$2,$3,$4,$5,$6::jsonb
        )`,
        [
          "cmd_kernel_no_receipt",
          "lease-no-receipt",
          "erec_missing",
          "replay_kernel_no_receipt",
          HASH_A,
          JSON.stringify({ status: "ok" }),
        ],
      ),
    ).rejects.toThrow(/durable_receipt_required/i);
  });

  it("persists accepted receipt before success and replays the same response without a second effect", async () => {
    await registerCommand({
      intentId: "intent_kernel_success",
      commandId: "cmd_kernel_success",
      intentKey: "web:session_kernel:success_001",
    });
    await claimCommand("cmd_kernel_success", "lease-success");

    if (!pool) throw new Error("pool unavailable");
    const reserved = await pool.query(
      `select * from reserve_effect_attempt(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )`,
      [
        "eff_kernel_success",
        "cmd_kernel_success",
        "gmail:send:success",
        "gmail",
        "messages.send",
        "queryable_receipt",
        HASH_B,
        null,
        "effect-lease-success",
        30,
      ],
    );
    expect(reserved.rows[0]?.duplicate).toBe(false);

    await pool.query(
      `select * from record_effect_receipt(
        $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb
      )`,
      [
        "erec_kernel_success",
        "eff_kernel_success",
        "accepted",
        "gmail-message-success",
        null,
        null,
        HASH_B,
        "effect-lease-success",
        JSON.stringify({ message_id: "gmail-message-success" }),
      ],
    );

    const completed = await pool.query(
      `select * from complete_durable_command(
        $1,$2,$3,$4,$5,$6::jsonb
      )`,
      [
        "cmd_kernel_success",
        "lease-success",
        "erec_kernel_success",
        "replay_kernel_success",
        HASH_A,
        JSON.stringify({ status: "ok", provider_id: "gmail-message-success" }),
      ],
    );
    expect(completed.rows[0]).toMatchObject({ status: "succeeded" });

    const replayA = await pool.query(
      "select * from replay_durable_command($1,$2)",
      ["asn_kernel", "web:session_kernel:success_001"],
    );
    const replayB = await pool.query(
      "select * from replay_durable_command($1,$2)",
      ["asn_kernel", "web:session_kernel:success_001"],
    );
    expect(replayA.rows).toEqual(replayB.rows);
    expect(replayA.rows[0]).toMatchObject({
      command_id: "cmd_kernel_success",
      terminal_receipt_id: "erec_kernel_success",
      status: "succeeded",
    });

    const effects = await pool.query(
      "select count(*)::int as count from effect_attempts where effect_key = $1",
      ["gmail:send:success"],
    );
    expect(effects.rows).toEqual([{ count: 1 }]);
  });

  it("rejects contradictory terminal receipts and preserves ambiguous outcomes", async () => {
    await registerCommand({
      intentId: "intent_kernel_ambiguous",
      commandId: "cmd_kernel_ambiguous",
      intentKey: "web:session_kernel:ambiguous_001",
    });
    await claimCommand("cmd_kernel_ambiguous", "lease-ambiguous");

    if (!pool) throw new Error("pool unavailable");
    await pool.query(
      `select * from reserve_effect_attempt(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )`,
      [
        "eff_kernel_ambiguous",
        "cmd_kernel_ambiguous",
        "gmail:send:ambiguous",
        "gmail",
        "messages.send",
        "non_idempotent_ambiguous",
        HASH_C,
        null,
        "effect-lease-ambiguous",
        30,
      ],
    );

    await pool.query(
      `select * from record_effect_receipt(
        $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb
      )`,
      [
        "erec_kernel_ambiguous",
        "eff_kernel_ambiguous",
        "ambiguous",
        null,
        null,
        "timeout_after_request_write",
        HASH_C,
        "effect-lease-ambiguous",
        JSON.stringify({ timeout_ms: 30000 }),
      ],
    );

    await expect(
      pool.query(
        `select * from record_effect_receipt(
          $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb
        )`,
        [
          "erec_kernel_contradiction",
          "eff_kernel_ambiguous",
          "accepted",
          "gmail-message-late",
          null,
          null,
          HASH_C,
          "effect-lease-ambiguous",
          JSON.stringify({ message_id: "gmail-message-late" }),
        ],
      ),
    ).rejects.toThrow(/contradictory_terminal_receipt/i);

    const completed = await pool.query(
      `select * from complete_durable_command(
        $1,$2,$3,$4,$5,$6::jsonb
      )`,
      [
        "cmd_kernel_ambiguous",
        "lease-ambiguous",
        "erec_kernel_ambiguous",
        "replay_kernel_ambiguous",
        HASH_C,
        JSON.stringify({ status: "ambiguous", repair_required: true }),
      ],
    );
    expect(completed.rows[0]).toMatchObject({ status: "ambiguous" });
  });

  it("permits bounded lease reclaim while preserving one reserved effect", async () => {
    await registerCommand({
      intentId: "intent_kernel_reclaim",
      commandId: "cmd_kernel_reclaim",
      intentKey: "web:session_kernel:reclaim_001",
    });
    await claimCommand("cmd_kernel_reclaim", "lease-reclaim-a");

    if (!pool || !admin) throw new Error("database unavailable");
    const first = await pool.query(
      `select * from reserve_effect_attempt(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )`,
      [
        "eff_kernel_reclaim_a",
        "cmd_kernel_reclaim",
        "provider:operation:reclaim",
        "provider",
        "operation",
        "consumer_dedupe",
        HASH_B,
        null,
        "effect-reclaim-a",
        30,
      ],
    );
    expect(first.rows[0]?.duplicate).toBe(false);

    await admin.query(
      "update durable_commands set lease_expires_at = now() - interval '1 second' where id = 'cmd_kernel_reclaim'",
    );
    const reclaimed = await claimCommand("cmd_kernel_reclaim", "lease-reclaim-b");
    expect(reclaimed).toMatchObject({ claim_version: 2, attempt_count: 2 });

    const second = await pool.query(
      `select * from reserve_effect_attempt(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )`,
      [
        "eff_kernel_reclaim_b",
        "cmd_kernel_reclaim",
        "provider:operation:reclaim",
        "provider",
        "operation",
        "consumer_dedupe",
        HASH_B,
        null,
        "effect-reclaim-b",
        30,
      ],
    );
    expect(second.rows[0]).toMatchObject({
      effect_id: "eff_kernel_reclaim_a",
      duplicate: true,
    });

    const effects = await pool.query(
      "select count(*)::int as count from effect_attempts where effect_key = $1",
      ["provider:operation:reclaim"],
    );
    expect(effects.rows).toEqual([{ count: 1 }]);
  });
});
