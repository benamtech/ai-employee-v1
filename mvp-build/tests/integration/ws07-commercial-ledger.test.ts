import { createHash } from "node:crypto";
import { Client, Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL;
let db: Client | undefined;
let pool: Pool | undefined;
const ids = {
  account: "acct_ws07_ledger",
  employee: "emp_ws07_ledger",
  organization: "org_ws07_ledger",
  employeePrincipal: "epr_ws07_ledger",
  assignment: "asn_ws07_ledger",
  employment: "rel_ws07_employment",
  payer: "crel_ws07_payer",
  beneficiary: "crel_ws07_beneficiary",
  price: "price_ws07_provider",
  credential: "mgwc_ws07_ledger",
};

function sha(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

async function seed(client: Client): Promise<void> {
  await client.query("begin");
  try {
    await client.query(`insert into accounts(id,display_name,slug) values($1,'WS07 Ledger','ws07-ledger') on conflict(id) do nothing`, [ids.account]);
    await client.query(`insert into employees(id,account_id,name,status) values($1,$2,'WS07 Employee','live') on conflict(id) do update set status='live'`, [ids.employee, ids.account]);
    await client.query(`insert into organizations(id,display_name,status) values($1,'WS07 Org','active') on conflict(id) do update set status='active'`, [ids.organization]);
    await client.query(`insert into employee_principals(id,employee_id,status) values($1,$2,'active') on conflict(id) do update set status='active'`, [ids.employeePrincipal, ids.employee]);
    await client.query(`
      insert into employee_assignments(id,organization_id,account_id,employee_principal_id,status,starts_at,policy_version,provenance)
      values($1,$2,$3,$4,'active',now()-interval '1 day','authorization-v1','{"source":"test"}')
      on conflict(id) do update set status='active',ends_at=null
    `, [ids.assignment, ids.organization, ids.account, ids.employeePrincipal]);
    await client.query(`
      insert into labor_relationships(id,relationship_type,subject_principal_id,subject_principal_class,organization_id,account_id,assignment_id,role,status,starts_at,policy_version,provenance)
      values($1,'employment',$2,'employee',$3,$4,$5,'employee','active',now()-interval '1 day','authorization-v1','{"source":"test"}')
      on conflict(id) do update set status='active',ends_at=null
    `, [ids.employment, ids.employeePrincipal, ids.organization, ids.account, ids.assignment]);
    await client.query(`
      insert into commercial_relationships(id,assignment_id,relationship_type,organization_id,account_id,status,starts_at,provenance)
      values
        ($1,$3,'payer',$4,$5,'active',now()-interval '1 day','{"source":"test"}'),
        ($2,$3,'beneficiary',$4,$5,'active',now()-interval '1 day','{"source":"test"}')
      on conflict(id) do update set status='active',ends_at=null
    `, [ids.payer, ids.beneficiary, ids.assignment, ids.organization, ids.account]);
    await client.query(`
      insert into commercial_price_versions(id,assignment_id,policy_key,version,currency,unit,unit_price_minor,status,effective_at)
      values($1,$2,'provider-cost-observation','1.0.0','USD','provider_request',0,'active',now()-interval '1 day')
      on conflict(id) do update set status='active',expires_at=null
    `, [ids.price, ids.assignment]);
    await client.query(`
      insert into model_gateway_credentials(id,account_id,employee_id,assignment_id,payer_relationship_id,beneficiary_relationship_id,price_version_id,credential_version,token_hash,token_secret_ref,gateway_url,model_alias,allowed_providers,allowed_models,spend_limit_cents,rate_limit_per_minute,expires_at)
      values($1,$2,$3,$4,$5,$6,$7,1,'hash','sealed:test','http://gateway.invalid/v1/employees/emp_ws07_ledger','amtech-primary',array['openai_compatible'],array['provider-model'],100,2,now()+interval '1 day')
      on conflict(id) do update set revoked_at=null,expires_at=excluded.expires_at,spend_limit_cents=100,rate_limit_per_minute=2
    `, [ids.credential, ids.account, ids.employee, ids.assignment, ids.payer, ids.beneficiary, ids.price]);
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

beforeEach(async () => {
  if (!db) return;
  await db.query("delete from model_gateway_rate_windows where credential_id = $1", [ids.credential]);
});

afterAll(async () => {
  await pool?.end();
  await db?.end();
});

describe.skipIf(!databaseUrl)("WS-07 PostgreSQL commercial authority", () => {
  it("deduplicates concurrent admission and prevents caller-selected rate-window sharding", async () => {
    const requestKey = "mgreq_ws07_concurrent";
    const args = [requestKey, ids.assignment, ids.credential, "rev-1", sha("request-1"), "openai_compatible:model", "amtech-idem-1", "caller-window-a", 20, "corr-1"];
    const calls = await Promise.all(Array.from({ length: 6 }, () => pool!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, args)));
    expect(calls.flatMap((result) => result.rows).filter((row) => row.admission_kind === "admitted")).toHaveLength(1);
    expect(calls.flatMap((result) => result.rows).filter((row) => row.admission_kind === "replay")).toHaveLength(5);

    const metadataReplay = await pool!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
      requestKey, ids.assignment, ids.credential, "rev-1", sha("request-1"), "openai_compatible:model", "amtech-idem-1", "different-caller-window", 20, "different-correlation",
    ]);
    expect(metadataReplay.rows[0]).toMatchObject({ admission_kind: "replay", request_key: requestKey });

    const second = await pool!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
      "mgreq_ws07_second", ids.assignment, ids.credential, "rev-2", sha("request-2"), "openai_compatible:model", "amtech-idem-2", "caller-window-b", 20, "corr-2",
    ]);
    expect(second.rows[0].admission_kind).toBe("admitted");
    const exhausted = await pool!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
      "mgreq_ws07_third", ids.assignment, ids.credential, "rev-3", sha("request-3"), "openai_compatible:model", "amtech-idem-3", "caller-window-c", 20, "corr-3",
    ]);
    expect(exhausted.rows[0]).toMatchObject({ admission_kind: "denied", error_code: "rate_limit_exceeded" });

    const storedWindows = await db!.query(`
      select request_key, rate_window_key, evidence
        from model_gateway_request_reservations
       where request_key = any($1::text[])
       order by request_key
    `, [[requestKey, "mgreq_ws07_second", "mgreq_ws07_third"]]);
    expect(new Set(storedWindows.rows.map((row) => row.rate_window_key)).size).toBe(1);
    expect(String(storedWindows.rows[0].rate_window_key)).toMatch(new RegExp(`^${ids.credential}:\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$`));
    expect(storedWindows.rows.every((row) => row.evidence.rate_window_authority === "database_statement_minute")).toBe(true);
  });

  it("binds accepted effect, accounting, and reservation settlement and conserves value through refund", async () => {
    const admitted = await db!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
      "mgreq_ws07_accept", ids.assignment, ids.credential, "rev-accept", sha("request-accept"), "openai_compatible:model", "amtech-idem-accept", "caller-window-accept", 30, "corr-accept",
    ]);
    const row = admitted.rows[0];
    const lease = "lease-ws07";
    await db!.query(`select * from claim_durable_command($1,$2,120)`, [row.command_id, lease]);
    const effectId = "eff_ws07_accept";
    await db!.query(`select * from reserve_effect_attempt($1,$2,$3,'openai_compatible','model.request','native_idempotency',$4,$5,$6,120)`, [
      effectId, row.command_id, row.effect_key, sha("request-accept"), "amtech-idem-accept", lease,
    ]);
    const effectReceipt = "erec_ws07_accept";
    await db!.query(`select * from record_effect_receipt($1,$2,'accepted','provider-ws07',null,null,$3,$4,$5::jsonb)`, [
      effectReceipt, effectId, sha("request-accept"), lease, JSON.stringify({ revision_id: "rev-accept" }),
    ]);
    const accounting = "usage_ws07_accept";
    await db!.query(`
      insert into commercial_usage_receipts(id,assignment_id,payer_relationship_id,beneficiary_relationship_id,price_version_id,meter_event_id,effect_receipt_id,receipt_kind,provider,provider_receipt_id,state,quantity,amount_minor,currency,correlation_id,evidence,observed_at)
      values($1,$2,$3,$4,$5,$6,$7,'provider_usage','openai_compatible','provider-ws07','accepted',5,18,'USD','corr-accept','{}',now())
    `, [accounting, ids.assignment, ids.payer, ids.beneficiary, ids.price, "meter_ws07_accept", effectReceipt]);
    const settled = await db!.query(`select * from settle_model_gateway_request($1,'accepted',18,'provider-ws07',$2,$3,null,null,$4::jsonb)`, [
      "mgreq_ws07_accept", effectReceipt, accounting, JSON.stringify({ revision_id: "rev-accept" }),
    ]);
    expect(settled.rows[0]).toMatchObject({ state: "accepted", committed_amount_minor: 18, released_amount_minor: 12, effect_receipt_id: effectReceipt, accounting_receipt_id: accounting });
    const refunded = await db!.query(`select * from refund_model_gateway_request($1,8,'customer_credit','refund-ws07')`, ["mgreq_ws07_accept"]);
    expect(refunded.rows[0]).toMatchObject({ committed_amount_minor: 18, released_amount_minor: 12, refunded_amount_minor: 8 });
    const conservation = await db!.query(`select * from gateway_commercial_conservation($1,'USD')`, [ids.assignment]);
    expect(conservation.rows[0].delta_minor).toBe(0);
  });

  it("keeps response-loss ambiguity durable and blocks ordinary retry", async () => {
    await db!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
      "mgreq_ws07_ambiguous", ids.assignment, ids.credential, "rev-ambiguous", sha("request-ambiguous"), "openai_compatible:model", "amtech-idem-ambiguous", "caller-window-ambiguous", 10, "corr-ambiguous",
    ]);
    const ambiguous = await db!.query(`select * from settle_model_gateway_request($1,'ambiguous',0,null,null,null,null,'provider_response_lost_after_dispatch',$2::jsonb)`, [
      "mgreq_ws07_ambiguous", JSON.stringify({ accepted_possible: true }),
    ]);
    expect(ambiguous.rows[0]).toMatchObject({ state: "ambiguous", ambiguity_code: "provider_response_lost_after_dispatch", released_amount_minor: 0 });
    const replay = await db!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
      "mgreq_ws07_ambiguous", ids.assignment, ids.credential, "rev-ambiguous", sha("request-ambiguous"), "openai_compatible:model", "amtech-idem-ambiguous", "new-caller-window", 10, "new-correlation",
    ]);
    expect(replay.rows[0]).toMatchObject({ admission_kind: "replay", state: "ambiguous" });
  });
});
