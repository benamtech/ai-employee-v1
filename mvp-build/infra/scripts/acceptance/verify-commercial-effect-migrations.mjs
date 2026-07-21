#!/usr/bin/env node
import pg from "pg";

const databaseUrl = process.env.STAGING_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("STAGING_DATABASE_URL or DATABASE_URL is required.");
  process.exit(2);
}

const client = new pg.Client({ connectionString: databaseUrl });
const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, status: pass ? "pass" : "fail", detail: String(detail ?? "") });
  if (!pass) throw new Error(`${name}:${detail}`);
};
const rows = async (sql, params = []) => (await client.query(sql, params)).rows;

try {
  await client.connect();
  const migrations = [
    "0074_ws07_commercial_effect_and_ws08_repair.sql",
    "0075_ws08_gateway_reconciliation.sql",
    "0076_ws08_reconciliation_authority_hardening.sql",
    "0077_ws07_database_owned_rate_windows.sql",
  ];
  const applied = new Set((await rows("select name from _migrations where name = any($1::text[])", [migrations])).map((row) => row.name));
  check("commercial_effect_migrations_applied", migrations.every((name) => applied.has(name)), `${applied.size}/${migrations.length}`);

  const tables = [
    "model_gateway_rate_windows",
    "model_gateway_request_reservations",
    "model_gateway_adjustments",
    "effect_proof_projections",
  ];
  const tableSecurity = await rows(`
    select c.relname, c.relrowsecurity,
      has_table_privilege('service_role', format('%I.%I', n.nspname, c.relname), 'select') as service_select,
      has_table_privilege('service_role', format('%I.%I', n.nspname, c.relname), 'insert') as service_insert,
      has_table_privilege('service_role', format('%I.%I', n.nspname, c.relname), 'update') as service_update,
      has_table_privilege('service_role', format('%I.%I', n.nspname, c.relname), 'delete') as service_delete,
      has_table_privilege('anon', format('%I.%I', n.nspname, c.relname), 'select') as anon_select,
      has_table_privilege('authenticated', format('%I.%I', n.nspname, c.relname), 'select') as authenticated_select
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = any($1::text[])
  `, [tables]);
  check("commercial_effect_tables_present", tableSecurity.length === tables.length, `${tableSecurity.length}/${tables.length}`);
  for (const table of tableSecurity) {
    check(`rls:${table.relname}`, table.relrowsecurity === true);
    check(`service_role_select:${table.relname}`, table.service_select === true);
    check(`service_role_raw_mutation_revoked:${table.relname}`, table.service_insert === false && table.service_update === false && table.service_delete === false);
    check(`browser_roles_revoked:${table.relname}`, table.anon_select === false && table.authenticated_select === false);
  }

  const functions = [
    "admit_model_gateway_request",
    "mark_model_gateway_request_dispatched",
    "settle_model_gateway_request",
    "refund_model_gateway_request",
    "project_model_gateway_request_proof",
    "project_effect_proof",
    "gateway_commercial_conservation",
    "reconcile_ambiguous_command",
    "reconcile_model_gateway_request",
    "mark_effect_proof_projection_failed",
  ];
  const functionSecurity = await rows(`
    select p.proname, p.prosecdef,
      has_function_privilege('service_role', p.oid, 'execute') as service_execute,
      has_function_privilege('anon', p.oid, 'execute') as anon_execute,
      has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any($1::text[])
  `, [functions]);
  check("commercial_effect_functions_present", new Set(functionSecurity.map((row) => row.proname)).size === functions.length, `${new Set(functionSecurity.map((row) => row.proname)).size}/${functions.length}`);
  for (const fn of functionSecurity) {
    check(`security_definer:${fn.proname}`, fn.prosecdef === true);
    check(`service_execute:${fn.proname}`, fn.service_execute === true);
    check(`browser_execute_revoked:${fn.proname}`, fn.anon_execute === false && fn.authenticated_execute === false);
  }

  const admissionDefinition = await rows(`
    select pg_get_functiondef(p.oid) as definition
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'admit_model_gateway_request'
       and pg_get_function_identity_arguments(p.oid) = 'p_request_key text, p_assignment_id text, p_credential_id text, p_revision_id text, p_request_hash text, p_route_key text, p_provider_idempotency_key text, p_rate_window_key text, p_reserve_amount_minor integer, p_correlation_id text'
  `);
  const admissionSource = String(admissionDefinition[0]?.definition ?? "");
  check(
    "database_owned_rate_window",
    admissionSource.includes("statement_timestamp()")
      && admissionSource.includes("v_rate_window_key")
      && !admissionSource.includes("v_existing.rate_window_key <> p_rate_window_key"),
    "caller window cannot shard shared minute authority or invalidate a deterministic replay",
  );
  check(
    "metadata_safe_gateway_replay",
    !admissionSource.includes("v_existing.correlation_id <> p_correlation_id")
      && !admissionSource.includes("v_existing.reserved_amount_minor <> p_reserve_amount_minor"),
    "nonidentity metadata cannot mutate or conflict with the original reservation",
  );

  const views = new Set((await rows(`
    select table_name from information_schema.views
    where table_schema = 'public' and table_name = any($1::text[])
  `, [["model_gateway_reconciliation_queue", "effect_proof_repair_queue", "commercial_effect_lineage"]])).map((row) => row.table_name));
  check("commercial_effect_views_present", views.size === 3, [...views].join(","));

  const acceptedConstraint = await rows(`
    select pg_get_constraintdef(oid) as definition
      from pg_constraint
     where conrelid = 'model_gateway_request_reservations'::regclass
       and contype = 'c'
  `);
  check("accepted_gateway_requires_receipt_chain", acceptedConstraint.some((row) => String(row.definition).includes("effect_receipt_id") && String(row.definition).includes("accounting_receipt_id")));

  const adjustmentTrigger = await rows(`
    select t.tgname
      from pg_trigger t
     where t.tgrelid = 'model_gateway_adjustments'::regclass
       and not t.tgisinternal
       and t.tgname = 'model_gateway_adjustment_immutable'
  `);
  check("gateway_adjustments_immutable_trigger", adjustmentTrigger.length === 1);

  const reconcilableNative = await rows(`
    select pg_get_functiondef(p.oid) as definition
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'reconcile_ambiguous_command'
  `);
  check("native_idempotency_reconciliation_guard", reconcilableNative.some((row) => String(row.definition).includes("native_idempotency") && String(row.definition).includes("provider_idempotency_key")));

  for (const item of checks) console.log(`PASS ${item.name}${item.detail ? ` ${item.detail}` : ""}`);
  console.log(`commercial_effect_migrations_verified:${JSON.stringify({ migrations, checks: checks.length })}`);
} catch (error) {
  for (const item of checks) console.log(`${item.status === "pass" ? "PASS" : "FAIL"} ${item.name}${item.detail ? ` ${item.detail}` : ""}`);
  console.error(`commercial_effect_migrations_failed:${String(error?.message ?? error)}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
