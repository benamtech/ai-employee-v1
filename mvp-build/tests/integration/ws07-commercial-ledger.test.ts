import { createHash } from "node:crypto";
import { Client, Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL ?? process.env.DATABASE_URL;
let db: Client | undefined;
let pool: Pool | undefined;
const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const id = (prefix: string) => `${prefix}_${suffix}`;
const ids = {
  account: id("acct_ws07"), employee: id("emp_ws07"), organization: id("org_ws07"),
  employeePrincipal: id("epr_ws07"), assignment: id("asn_ws07"), employment: id("rel_ws07_employment"),
  payer: id("crel_ws07_payer"), beneficiary: id("crel_ws07_beneficiary"), price: id("price_ws07_provider"),
};
const credentialVersions = { concurrent: 1, accepted: 2, ambiguous: 3 } as const;

function sha(value: string): string { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }

async function seed(client: Client): Promise<void> {
  await client.query("begin");
  try {
    await client.query(`insert into accounts(id,display_name,slug) values($1,'WS07 Ledger',$2)`, [ids.account, `ws07-${suffix}`]);
    await client.query(`insert into employees(id,account_id,name,status) values($1,$2,'WS07 Employee','live')`, [ids.employee, ids.account]);
    await client.query(`insert into organizations(id,display_name,status) values($1,'WS07 Org','active')`, [ids.organization]);
    await client.query(`insert into employee_principals(id,employee_id,status) values($1,$2,'active')`, [ids.employeePrincipal, ids.employee]);
    await client.query(`insert into employee_assignments(id,organization_id,account_id,employee_principal_id,status,starts_at,policy_version,provenance) values($1,$2,$3,$4,'active',now()-interval '1 day','authorization-v1','{"source":"test"}')`, [ids.assignment, ids.organization, ids.account, ids.employeePrincipal]);
    await client.query(`insert into labor_relationships(id,relationship_type,subject_principal_id,subject_principal_class,organization_id,account_id,assignment_id,role,status,starts_at,policy_version,provenance) values($1,'employment',$2,'employee',$3,$4,$5,'employee','active',now()-interval '1 day','authorization-v1','{"source":"test"}')`, [ids.employment, ids.employeePrincipal, ids.organization, ids.account, ids.assignment]);
    await client.query(`insert into commercial_relationships(id,assignment_id,relationship_type,organization_id,account_id,status,starts_at,provenance) values ($1,$3,'payer',$4,$5,'active',now()-interval '1 day','{"source":"test"}'), ($2,$3,'beneficiary',$4,$5,'active',now()-interval '1 day','{"source":"test"}')`, [ids.payer, ids.beneficiary, ids.assignment, ids.organization, ids.account]);
    await client.query(`insert into commercial_price_versions(id,assignment_id,policy_key,version,currency,unit,unit_price_minor,status,effective_at) values($1,$2,'provider-cost-observation','1.0.0','USD','provider_request',0,'active',now()-interval '1 day')`, [ids.price, ids.assignment]);
    await client.query("commit");
  } catch (error) { await client.query("rollback"); throw error; }
}

async function createCredential(client: Client, testName: keyof typeof credentialVersions): Promise<string> {
  const credential = id(`mgwc_${testName}`);
  await client.query(`
    insert into model_gateway_credentials(id,account_id,employee_id,assignment_id,payer_relationship_id,beneficiary_relationship_id,price_version_id,credential_version,token_hash,token_secret_ref,gateway_url,model_alias,allowed_providers,allowed_models,spend_limit_cents,rate_limit_per_minute,expires_at)
    values($1,$2,$3,$4,$5,$6,$7,$8,'hash','sealed:test',$9,'amtech-primary',array['openai_compatible'],array['provider-model'],100,2,now()+interval '1 day')
  `, [credential, ids.account, ids.employee, ids.assignment, ids.payer, ids.beneficiary, ids.price, credentialVersions[testName], `http://gateway.invalid/v1/employees/${ids.employee}`]);
  return credential;
}

beforeAll(async () => {
  if (!databaseUrl) return;
  db = new Client({ connectionString: databaseUrl }); await db.connect();
  pool = new Pool({ connectionString: databaseUrl, max: 8 }); await seed(db);
});
afterAll(async () => { await pool?.end(); await db?.end(); });

describe.skipIf(!databaseUrl)("WS-07 PostgreSQL commercial authority", () => {
  it("deduplicates concurrent admission and prevents caller-selected rate-window sharding", async () => {
    const credential = await createCredential(db!, "concurrent");
    const requestKey = id("mgreq_concurrent");
    const args = [requestKey, ids.assignment, credential, "rev-1", sha(id("request-1")), "openai_compatible:model", id("amtech-idem-1"), "caller-window-a", 20, id("corr-1")];
    const calls = await Promise.all(Array.from({ length: 6 }, () => pool!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, args)));
    expect(calls.flatMap((result) => result.rows).filter((row) => row.admission_kind === "admitted")).toHaveLength(1);
    expect(calls.flatMap((result) => result.rows).filter((row) => row.admission_kind === "replay")).toHaveLength(5);
    const metadataReplay = await pool!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [requestKey, ids.assignment, credential, "rev-1", sha(id("request-1")), "openai_compatible:model", id("amtech-idem-1"), "different-caller-window", 20, id("different-correlation")]);
    expect(metadataReplay.rows[0]).toMatchObject({ admission_kind: "replay", request_key: requestKey });
    const secondKey = id("mgreq_second"); const thirdKey = id("mgreq_third");
    const second = await pool!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [secondKey, ids.assignment, credential, "rev-2", sha(id("request-2")), "openai_compatible:model", id("amtech-idem-2"), "caller-window-b", 20, id("corr-2")]);
    expect(second.rows[0].admission_kind).toBe("admitted");
    const exhausted = await pool!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [thirdKey, ids.assignment, credential, "rev-3", sha(id("request-3")), "openai_compatible:model", id("amtech-idem-3"), "caller-window-c", 20, id("corr-3")]);
    expect(exhausted.rows[0]).toMatchObject({ admission_kind: "denied", error_code: "rate_limit_exceeded" });
    const storedWindows = await db!.query(`select request_key, rate_window_key, evidence from model_gateway_request_reservations where request_key = any($1::text[]) order by request_key`, [[requestKey, secondKey, thirdKey]]);
    expect(new Set(storedWindows.rows.map((row) => row.rate_window_key)).size).toBe(1);
    expect(String(storedWindows.rows[0].rate_window_key)).toMatch(new RegExp(`^${credential}:\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$`));
    expect(storedWindows.rows.every((row) => row.evidence.rate_window_authority === "database_statement_minute")).toBe(true);
  });

  it("binds accepted effect, accounting, and reservation settlement and conserves value through refund", async () => {
    const credential = await createCredential(db!, "accepted"); const requestKey = id("mgreq_accept"); const requestHash = sha(id("request-accept"));
    const admitted = await db!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [requestKey, ids.assignment, credential, "rev-accept", requestHash, "openai_compatible:model", id("amtech-idem-accept"), "caller-window-accept", 30, id("corr-accept")]);
    const row = admitted.rows[0]; const lease = id("lease");
    await db!.query(`select * from claim_durable_command($1,$2,120)`, [row.command_id, lease]);
    const effectId = id("eff_accept");
    await db!.query(`select * from reserve_effect_attempt($1,$2,$3,'openai_compatible','model.request','native_idempotency',$4,$5,$6,120)`, [effectId, row.command_id, row.effect_key, requestHash, id("amtech-idem-accept"), lease]);
    const effectReceipt = id("erec_accept");
    await db!.query(`select * from record_effect_receipt($1,$2,'accepted',$3,null,null,$4,$5,$6::jsonb)`, [effectReceipt, effectId, id("provider"), requestHash, lease, JSON.stringify({ revision_id: "rev-accept" })]);
    const accounting = id("usage_accept");
    await db!.query(`insert into commercial_usage_receipts(id,assignment_id,payer_relationship_id,beneficiary_relationship_id,price_version_id,meter_event_id,effect_receipt_id,receipt_kind,provider,provider_receipt_id,state,quantity,amount_minor,currency,correlation_id,evidence,observed_at) values($1,$2,$3,$4,$5,$6,$7,'provider_usage','openai_compatible',$8,'accepted',5,18,'USD',$9,'{}',now())`, [accounting, ids.assignment, ids.payer, ids.beneficiary, ids.price, id("meter_accept"), effectReceipt, id("provider"), id("corr-accept")]);
    const settled = await db!.query(`select * from settle_model_gateway_request($1,'accepted',18,$2,$3,$4,null,null,$5::jsonb)`, [requestKey, id("provider"), effectReceipt, accounting, JSON.stringify({ revision_id: "rev-accept" })]);
    expect(settled.rows[0]).toMatchObject({ state: "accepted", committed_amount_minor: 18, released_amount_minor: 12, effect_receipt_id: effectReceipt, accounting_receipt_id: accounting });
    const refunded = await db!.query(`select * from refund_model_gateway_request($1,8,'customer_credit',$2)`, [requestKey, id("refund")]);
    expect(refunded.rows[0]).toMatchObject({ committed_amount_minor: 18, released_amount_minor: 12, refunded_amount_minor: 8 });
    const conservation = await db!.query(`select * from gateway_commercial_conservation($1,'USD')`, [ids.assignment]); expect(conservation.rows[0].delta_minor).toBe(0);
  });

  it("keeps response-loss ambiguity durable and blocks ordinary retry", async () => {
    const credential = await createCredential(db!, "ambiguous"); const requestKey = id("mgreq_ambiguous"); const requestHash = sha(id("request-ambiguous")); const providerKey = id("amtech-idem-ambiguous");
    await db!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [requestKey, ids.assignment, credential, "rev-ambiguous", requestHash, "openai_compatible:model", providerKey, "caller-window-ambiguous", 10, id("corr-ambiguous")]);
    const ambiguous = await db!.query(`select * from settle_model_gateway_request($1,'ambiguous',0,null,null,null,null,'provider_response_lost_after_dispatch',$2::jsonb)`, [requestKey, JSON.stringify({ accepted_possible: true })]);
    expect(ambiguous.rows[0]).toMatchObject({ state: "ambiguous", ambiguity_code: "provider_response_lost_after_dispatch", released_amount_minor: 0 });
    const replay = await db!.query(`select * from admit_model_gateway_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [requestKey, ids.assignment, credential, "rev-ambiguous", requestHash, "openai_compatible:model", providerKey, "new-caller-window", 10, id("new-correlation")]);
    expect(replay.rows[0]).toMatchObject({ admission_kind: "replay", state: "ambiguous" });
  });
});
