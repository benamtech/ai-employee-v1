import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL;
let db: Client | undefined;

const ids = {
  accountA: "acct_s56_matrix_a",
  accountB: "acct_s56_matrix_b",
  employeeA: "emp_s56_matrix_a",
  employeeB: "emp_s56_matrix_b",
  organizationA: "org_s56_matrix_a",
  organizationB: "org_s56_matrix_b",
  principalA: "epr_s56_matrix_a",
  principalB: "epr_s56_matrix_b",
  assignmentA: "asn_s56_matrix_a",
  assignmentB: "asn_s56_matrix_b",
  payer: "crel_s56_payer",
  beneficiary: "crel_s56_beneficiary",
  price: "price_s56_provider",
  gatewayCredential: "mgwc_s56_scoped",
  binding: "cb_s56_gmail",
  bindingNoGrant: "cb_s56_quickbooks",
  grant: "grant_s56_gmail",
  ambient: "ain_s56_gmail",
  commandIntent: "intent_s56gmail0000000000000000000001",
  command: "cmd_s56gmail000000000000000000000001",
  noGrantIntent: "intent_s56qbo000000000000000000000001",
  noGrantCommand: "cmd_s56qbo0000000000000000000000001",
};

const hashA = `sha256:${"a".repeat(64)}`;
const hashB = `sha256:${"b".repeat(64)}`;

async function seed(client: Client): Promise<void> {
  await client.query("begin");
  try {
    await client.query(`
      insert into accounts(id, display_name, slug) values
        ($1, 'S56 Matrix A', 's56-matrix-a'),
        ($2, 'S56 Matrix B', 's56-matrix-b')
      on conflict (id) do update set display_name = excluded.display_name
    `, [ids.accountA, ids.accountB]);

    await client.query(`
      insert into employees(id, account_id, name, status) values
        ($1, $2, 'S56 Employee A', 'live'),
        ($3, $4, 'S56 Employee B', 'live')
      on conflict (id) do update set account_id = excluded.account_id, status = excluded.status
    `, [ids.employeeA, ids.accountA, ids.employeeB, ids.accountB]);

    await client.query(`
      insert into organizations(id, display_name, status) values
        ($1, 'S56 Organization A', 'active'),
        ($2, 'S56 Organization B', 'active')
      on conflict (id) do update set status = excluded.status
    `, [ids.organizationA, ids.organizationB]);

    await client.query(`
      insert into organization_accounts(id, organization_id, account_id, status, starts_at, provenance) values
        ('rel_s56_org_a', $1, $2, 'active', now() - interval '1 day', '{"source":"explicit"}'::jsonb),
        ('rel_s56_org_b', $3, $4, 'active', now() - interval '1 day', '{"source":"explicit"}'::jsonb)
      on conflict (id) do update set status = excluded.status
    `, [ids.organizationA, ids.accountA, ids.organizationB, ids.accountB]);

    await client.query(`
      insert into employee_principals(id, employee_id, status) values
        ($1, $2, 'active'),
        ($3, $4, 'active')
      on conflict (id) do update set status = excluded.status
    `, [ids.principalA, ids.employeeA, ids.principalB, ids.employeeB]);

    await client.query(`
      insert into employee_assignments(
        id, organization_id, account_id, employee_principal_id, status,
        starts_at, policy_version, provenance
      ) values
        ($1, $2, $3, $4, 'active', now() - interval '1 day', 'authorization-v1', '{"source":"explicit"}'::jsonb),
        ($5, $6, $7, $8, 'active', now() - interval '1 day', 'authorization-v1', '{"source":"explicit"}'::jsonb)
      on conflict (id) do update set status = excluded.status, ends_at = null
    `, [
      ids.assignmentA, ids.organizationA, ids.accountA, ids.principalA,
      ids.assignmentB, ids.organizationB, ids.accountB, ids.principalB,
    ]);

    await client.query(`
      insert into labor_relationships(
        id, relationship_type, subject_principal_id, subject_principal_class,
        organization_id, account_id, assignment_id, role, status,
        starts_at, policy_version, provenance
      ) values
        ('rel_s56_employ_a', 'employment', $1, 'employee', $2, $3, $4, 'employee', 'active', now() - interval '1 day', 'authorization-v1', '{"source":"explicit"}'::jsonb),
        ('rel_s56_employ_b', 'employment', $5, 'employee', $6, $7, $8, 'employee', 'active', now() - interval '1 day', 'authorization-v1', '{"source":"explicit"}'::jsonb)
      on conflict (id) do update set status = excluded.status, ends_at = null
    `, [
      ids.principalA, ids.organizationA, ids.accountA, ids.assignmentA,
      ids.principalB, ids.organizationB, ids.accountB, ids.assignmentB,
    ]);

    await client.query(`
      insert into commercial_relationships(
        id, assignment_id, relationship_type, organization_id, account_id,
        status, starts_at, provenance
      ) values
        ($1, $2, 'payer', $3, $4, 'active', now() - interval '1 day', '{"source":"explicit"}'::jsonb),
        ($5, $2, 'beneficiary', $6, $7, 'active', now() - interval '1 day', '{"source":"explicit"}'::jsonb)
      on conflict (id) do update set status = excluded.status, ends_at = null
    `, [
      ids.payer, ids.assignmentA, ids.organizationA, ids.accountA,
      ids.beneficiary, ids.organizationB, ids.accountB,
    ]);

    await client.query(`
      insert into commercial_price_versions(
        id, assignment_id, policy_key, version, currency, unit,
        unit_price_minor, status, effective_at, provenance
      ) values(
        $1, $2, 'provider-cost-observation', 'test-1', 'USD',
        'provider_request', 1, 'active', now() - interval '1 day', '{"source":"test"}'::jsonb
      )
      on conflict (id) do update set status = excluded.status, expires_at = null
    `, [ids.price, ids.assignmentA]);

    await client.query(`
      insert into model_gateway_credentials(
        id, account_id, employee_id, assignment_id,
        payer_relationship_id, beneficiary_relationship_id, price_version_id,
        credential_version, token_hash, token_secret_ref, gateway_url,
        model_alias, allowed_providers, allowed_models, spend_limit_cents,
        rate_limit_per_minute, expires_at
      ) values(
        $1,$2,$3,$4,$5,$6,$7,99,$8,'sealed:test',
        'http://gateway.invalid/v1/employees/emp_s56_matrix_a',
        'amtech-primary',array['provider'],array['amtech-primary'],10000,60,
        now() + interval '1 day'
      )
      on conflict (id) do update set
        assignment_id = excluded.assignment_id,
        payer_relationship_id = excluded.payer_relationship_id,
        beneficiary_relationship_id = excluded.beneficiary_relationship_id,
        price_version_id = excluded.price_version_id,
        revoked_at = null
    `, [
      ids.gatewayCredential, ids.accountA, ids.employeeA, ids.assignmentA,
      ids.payer, ids.beneficiary, ids.price, "c".repeat(64),
    ]);

    await client.query(`
      insert into assignment_resource_grants(
        id, assignment_id, principal_id, resource_class, resource_id,
        actions, status, starts_at, policy_version, provenance
      ) values(
        $1, $2, $3, 'connector:gmail', 'owner@s56.invalid',
        array['connector:event:ingest'], 'active', now() - interval '1 day',
        'authorization-v1', '{"source":"test"}'::jsonb
      )
      on conflict (id) do update set status = 'active', ends_at = null, actions = excluded.actions
    `, [ids.grant, ids.assignmentA, ids.principalA]);

    await client.query(`
      insert into connector_bindings(
        id, assignment_id, principal_id, provider, external_subject,
        account_id, employee_id, resource_class, resource_id,
        capability_class, policy_version, status,
        provider_verification_ref, provider_verified_at, provenance
      ) values
        ($1, $2, $3, 'gmail', 'owner@s56.invalid', $4, $5,
         'connector:gmail', 'owner@s56.invalid', 'consumer_dedupe',
         'authorization-v1', 'active', 'test:gmail-verified', now(), '{"source":"test"}'::jsonb),
        ($6, $2, $3, 'quickbooks', 'realm-s56', $4, $5,
         'connector:quickbooks', 'realm-s56', 'consumer_dedupe',
         'authorization-v1', 'active', 'test:qbo-verified', now(), '{"source":"test"}'::jsonb)
      on conflict (id) do update set status = 'active', revoked_at = null
    `, [ids.binding, ids.assignmentA, ids.principalA, ids.accountA, ids.employeeA, ids.bindingNoGrant]);

    await client.query(`
      select * from register_durable_command(
        $1, $2, $3, 'employee', 'verified_provider:gmail',
        'connector:gmail:event-1', $4, 'connector.event.ingest', '1.0.0',
        'authorization-v1', jsonb_build_object('event', 'gmail-event-1'),
        $5, 'corr-s56-gmail', null
      )
    `, [ids.commandIntent, ids.assignmentA, ids.principalA, ids.command, hashA]);

    await client.query(`
      select * from register_durable_command(
        $1, $2, $3, 'employee', 'verified_provider:quickbooks',
        'connector:qbo:event-1', $4, 'connector.event.ingest', '1.0.0',
        'authorization-v1', jsonb_build_object('event', 'qbo-event-1'),
        $5, 'corr-s56-qbo', null
      )
    `, [ids.noGrantIntent, ids.assignmentA, ids.principalA, ids.noGrantCommand, hashB]);

    await client.query(`
      insert into ambient_event_inbox(
        inbox_id, source_type, provider, external_event_id, verified_at,
        event_type, subject_key, dedupe_key, payload, processing_state,
        authorization_state, provider_verification_ref, payload_hash,
        resource_class, resource_id
      ) values(
        $1, 'provider_webhook', 'gmail', 'gmail-event-1', now(),
        'gmail.history.available', 'owner@s56.invalid', 'gmail:gmail-event-1',
        '{"history_id":"1"}'::jsonb, 'received', 'waiting_for_binding',
        'test:gmail-signature', $2, 'connector:gmail', 'owner@s56.invalid'
      )
      on conflict (inbox_id) do update set
        assignment_id = null, connector_binding_id = null,
        command_intent_id = null, command_id = null,
        authorization_state = 'waiting_for_binding', processing_state = 'received'
    `, [ids.ambient, hashA]);
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

describe.skipIf(!databaseUrl)("S5 connector custody PostgreSQL boundary", () => {
  it("attests only a verified binding with matching assignment, grant, and C3 actor", async () => {
    const result = await db!.query<{ assignment_id: string; authorization_state: string }>(`
      select assignment_id, authorization_state
        from attest_ambient_connector_custody(
          $1,$2,$3,$4,$5,$6,$7,'connector:gmail','owner@s56.invalid'
        )
    `, [
      ids.ambient, ids.assignmentA, ids.binding, ids.commandIntent, ids.command,
      "test:gmail-signature", hashA,
    ]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ assignment_id: ids.assignmentA, authorization_state: "authorized" });

    await db!.query("set role service_role");
    const claimed = await db!.query<{ inbox_id: string }>(
      "select inbox_id from claim_next_ambient_event('lease_s56', 30)",
    );
    await db!.query("reset role");
    expect(claimed.rows[0]?.inbox_id).toBe(ids.ambient);
  });

  it("rejects a binding whose account/employee dimensions do not match its assignment", async () => {
    await expect(db!.query(`
      insert into connector_bindings(
        id, assignment_id, principal_id, provider, external_subject,
        account_id, employee_id, resource_class, resource_id,
        capability_class, policy_version, status,
        provider_verification_ref, provider_verified_at
      ) values(
        'cb_s56_cross_assignment', $1, $2, 'gmail', 'cross@s56.invalid',
        $3, $4, 'connector:gmail', 'cross@s56.invalid',
        'consumer_dedupe', 'authorization-v1', 'active', 'test:verified', now()
      )
    `, [ids.assignmentA, ids.principalA, ids.accountB, ids.employeeB])).rejects.toThrow(/connector_binding_assignment_mismatch|connector_binding_principal_mismatch/);
  });

  it("rejects attestation when the binding has no assignment resource grant", async () => {
    const ambient = "ain_s56_qbo";
    await db!.query(`
      insert into ambient_event_inbox(
        inbox_id, source_type, provider, external_event_id, verified_at,
        event_type, subject_key, dedupe_key, payload, processing_state,
        authorization_state, provider_verification_ref, payload_hash,
        resource_class, resource_id
      ) values(
        $1, 'provider_webhook', 'quickbooks', 'qbo-event-1', now(),
        'quickbooks.entity.changed', 'realm-s56', 'qbo:qbo-event-1',
        '{}'::jsonb, 'received', 'waiting_for_binding',
        'test:qbo-signature', $2, 'connector:quickbooks', 'realm-s56'
      ) on conflict (inbox_id) do nothing
    `, [ambient, hashB]);
    await expect(db!.query(`
      select * from attest_ambient_connector_custody(
        $1,$2,$3,$4,$5,'test:qbo-signature',$6,'connector:quickbooks','realm-s56'
      )
    `, [ambient, ids.assignmentA, ids.bindingNoGrant, ids.noGrantIntent, ids.noGrantCommand, hashB])).rejects.toThrow(/connector_resource_grant_missing/);
  });

  it("deduplicates one provider event and rejects a changed payload under the same identity", async () => {
    const unique = await db!.query<{ count: number }>(`
      select count(*)::int as count
        from ambient_event_inbox
       where provider = 'gmail' and external_event_id = 'gmail-event-1'
    `);
    expect(unique.rows[0]?.count).toBe(1);
    await expect(db!.query(`
      insert into ambient_event_inbox(
        inbox_id, source_type, provider, external_event_id, event_type,
        subject_key, dedupe_key, payload, payload_hash
      ) values(
        'ain_s56_gmail_conflict', 'provider_webhook', 'gmail', 'gmail-event-1',
        'gmail.history.available', 'owner@s56.invalid', 'gmail:gmail-event-1',
        '{"history_id":"changed"}'::jsonb, $1
      )
    `, [hashB])).rejects.toThrow(/duplicate key/);
  });
});

describe.skipIf(!databaseUrl)("S6 commercial attribution PostgreSQL boundary", () => {
  it("accepts one provider usage receipt with assignment, payer, beneficiary, price, and provider receipt", async () => {
    const receiptId = "usage_s56_accepted";
    await db!.query(`
      insert into commercial_usage_receipts(
        id, assignment_id, payer_relationship_id, beneficiary_relationship_id,
        price_version_id, meter_event_id, receipt_kind, provider,
        provider_receipt_id, state, quantity, amount_minor, currency,
        correlation_id, evidence, observed_at
      ) values(
        $1,$2,$3,$4,$5,'meter_s56_accepted','provider_usage','openai-compatible',
        'provider-request-s56','accepted',100,7,'USD','corr-s56-usage','{}'::jsonb,now()
      )
      on conflict (id) do nothing
    `, [receiptId, ids.assignmentA, ids.payer, ids.beneficiary, ids.price]);
    const row = await db!.query(`
      select assignment_id, payer_relationship_id, beneficiary_relationship_id,
             price_version_id, provider_receipt_id, state
        from commercial_usage_receipts where id = $1
    `, [receiptId]);
    expect(row.rows[0]).toMatchObject({
      assignment_id: ids.assignmentA,
      payer_relationship_id: ids.payer,
      beneficiary_relationship_id: ids.beneficiary,
      price_version_id: ids.price,
      provider_receipt_id: "provider-request-s56",
      state: "accepted",
    });
  });

  it("rejects cross-assignment payer attribution and accepted usage without provider receipt", async () => {
    await expect(db!.query(`
      insert into commercial_usage_receipts(
        id, assignment_id, payer_relationship_id, beneficiary_relationship_id,
        price_version_id, meter_event_id, receipt_kind, provider,
        provider_receipt_id, state, quantity, amount_minor, currency,
        correlation_id, evidence, observed_at
      ) values(
        'usage_s56_wrong_assignment',$1,$2,$3,$4,'meter_wrong','provider_usage','provider',
        'provider-wrong','accepted',1,1,'USD','corr-wrong','{}'::jsonb,now()
      )
    `, [ids.assignmentB, ids.payer, ids.beneficiary, ids.price])).rejects.toThrow(/invalid_payer_relationship|invalid_beneficiary_relationship|invalid_price_version/);

    await expect(db!.query(`
      insert into commercial_usage_receipts(
        id, assignment_id, payer_relationship_id, beneficiary_relationship_id,
        price_version_id, meter_event_id, receipt_kind, provider,
        provider_receipt_id, state, quantity, amount_minor, currency,
        correlation_id, evidence, observed_at
      ) values(
        'usage_s56_no_provider_receipt',$1,$2,$3,$4,'meter_no_receipt','provider_usage','provider',
        null,'accepted',1,1,'USD','corr-no-receipt','{}'::jsonb,now()
      )
    `, [ids.assignmentA, ids.payer, ids.beneficiary, ids.price])).rejects.toThrow(/accepted_usage_requires_provider_receipt|commercial_usage_receipts_accepted_receipt_shape/);
  });

  it("rejects gateway success without both provider and accounting receipts", async () => {
    await expect(db!.query(`
      insert into model_gateway_request_audit(
        id, credential_id, account_id, employee_id, assignment_id,
        payer_relationship_id, beneficiary_relationship_id, price_version_id,
        provider_receipt_id, accounting_receipt_id, model_alias, provider,
        upstream_model, credential_version, latency_ms, prompt_tokens,
        completion_tokens, total_tokens, estimated_cost_cents, status
      ) values(
        'mgwr_s56_missing_receipts',$7,$1,$2,$3,$4,$5,$6,
        null,null,'amtech-primary','provider','model',99,1,1,1,2,1,'ok'
      )
    `, [
      ids.accountA, ids.employeeA, ids.assignmentA, ids.payer,
      ids.beneficiary, ids.price, ids.gatewayCredential,
    ])).rejects.toThrow(/model_gateway_request_audit_success_receipt/);
  });
});
