#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import process from "node:process";
import pg from "pg";

const databaseUrl = process.env.STAGING_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("STAGING_DATABASE_URL or DATABASE_URL is required.");
  process.exit(2);
}

const apply = process.argv.includes("--apply");
if (apply) {
  const result = spawnSync("node", ["packages/db/migrate.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
    timeout: 120_000,
  });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const client = new pg.Client({ connectionString: databaseUrl });
const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, status: pass ? "pass" : "fail", detail: String(detail ?? "") });
  if (!pass) throw new Error(`${name}:${detail}`);
};
const one = async (sql, params = []) => (await client.query(sql, params)).rows[0];
const rows = async (sql, params = []) => (await client.query(sql, params)).rows;
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const accountId = `acct_migration_${suffix}`;
const employeeId = `emp_migration_${suffix}`;

try {
  await client.connect();
  const expectedMigrations = [
    "0032_gateway_reconciler_inbox_foundations.sql",
    "0033_provisioning_operation_key_retry_idx.sql",
    "0034_reconciler_workers_and_ambient_replay.sql",
    "0035_worker_terminal_claim_and_effect_receipts.sql",
    "0036_worker_service_role_grants.sql",
    "0037_welcome_effect_ready_gate.sql",
    "0038_needs_reprovision_command_trigger.sql",
  ];
  const applied = new Set((await rows("select name from _migrations where name = any($1::text[])", [expectedMigrations])).map((row) => row.name));
  check("migration_ledger_0032_0038", expectedMigrations.every((name) => applied.has(name)), `${applied.size}/${expectedMigrations.length}`);

  const controlTables = [
    "model_gateway_credentials",
    "model_gateway_request_audit",
    "provisioning_resource_states",
    "provisioning_commands",
    "ambient_event_inbox",
    "ambient_event_dead_letters",
    "ambient_effect_receipts",
  ];
  const tableSecurity = await rows(`
    select c.relname, c.relrowsecurity,
      has_table_privilege('service_role', format('%I.%I', n.nspname, c.relname), 'select,insert,update,delete') as service_crud,
      has_table_privilege('anon', format('%I.%I', n.nspname, c.relname), 'select') as anon_select,
      has_table_privilege('authenticated', format('%I.%I', n.nspname, c.relname), 'select') as authenticated_select
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = any($1::text[])
  `, [controlTables]);
  check("control_tables_present", tableSecurity.length === controlTables.length, `${tableSecurity.length}/${controlTables.length}`);
  for (const table of tableSecurity) {
    check(`rls:${table.relname}`, table.relrowsecurity === true);
    check(`service_role_crud:${table.relname}`, table.service_crud === true);
    check(`browser_roles_revoked:${table.relname}`, table.anon_select === false && table.authenticated_select === false);
  }

  const claimFunctions = await rows(`
    select p.proname, p.prosecdef,
      has_function_privilege('service_role', p.oid, 'execute') as service_execute,
      has_function_privilege('anon', p.oid, 'execute') as anon_execute,
      has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any($1::text[])
  `, [["claim_next_provisioning_job", "claim_next_provisioning_command", "claim_next_ambient_event"]]);
  check("claim_functions_present", claimFunctions.length === 3, `${claimFunctions.length}/3`);
  for (const fn of claimFunctions) {
    check(`security_invoker:${fn.proname}`, fn.prosecdef === false, "worker claim functions must use explicit service_role grants, not SECURITY DEFINER");
    check(`service_role_execute:${fn.proname}`, fn.service_execute === true);
    check(`browser_execute_revoked:${fn.proname}`, fn.anon_execute === false && fn.authenticated_execute === false);
  }

  await client.query("begin");
  await client.query("insert into accounts(id, display_name) values($1, $2)", [accountId, "Migration Verification"]);
  await client.query("insert into employees(id, account_id, name, status, needs_reprovision) values($1, $2, $3, 'live', false)", [employeeId, accountId, "Verifier"]);

  const jobId = `pjob_lease_${suffix}`;
  await client.query(`
    insert into provisioning_jobs(id, account_id, employee_id, idempotency_key, state, next_attempt_at)
    values($1, $2, $3, $4, 'resources_reserved', now() - interval '1 second')
  `, [jobId, accountId, employeeId, `lease:${suffix}`]);
  await client.query("set local role service_role");
  const firstClaim = await one("select id, lease_token, attempt_count from claim_next_provisioning_job($1, 30)", [`lease_one_${suffix}`]);
  check("job_claimed_once", firstClaim?.id === jobId && firstClaim.lease_token === `lease_one_${suffix}` && Number(firstClaim.attempt_count) === 1);
  const blockedClaim = await one("select id from claim_next_provisioning_job($1, 30)", [`lease_two_${suffix}`]);
  check("active_lease_not_double_claimed", !blockedClaim);
  await client.query("reset role");
  await client.query("update provisioning_jobs set lease_expires_at = now() - interval '1 second' where id = $1", [jobId]);
  await client.query("set local role service_role");
  const reclaimed = await one("select id, lease_token, attempt_count from claim_next_provisioning_job($1, 30)", [`lease_three_${suffix}`]);
  check("expired_lease_reclaimed", reclaimed?.id === jobId && Number(reclaimed.attempt_count) === 2);
  await client.query("reset role");
  await client.query("update provisioning_jobs set state = 'failed', completed_at = now(), lease_token = null, lease_expires_at = null where id = $1", [jobId]);

  const commandId = `pcmd_terminal_${suffix}`;
  await client.query(`
    insert into provisioning_commands(id, account_id, employee_id, command_type, idempotency_key, status, completed_at)
    values($1, $2, $3, 'inspect_drift', $4, 'failed', now())
  `, [commandId, accountId, employeeId, `terminal:${suffix}`]);
  await client.query("set local role service_role");
  const terminalClaim = await one("select id from claim_next_provisioning_command($1, 30)", [`command_lease_${suffix}`]);
  check("completed_command_not_reclaimed", !terminalClaim);
  await client.query("reset role");

  const ambientId = `ain_claim_${suffix}`;
  await client.query(`
    insert into ambient_event_inbox(inbox_id, source_type, provider, external_event_id, event_type, dedupe_key, processing_state, next_attempt_at)
    values($1, 'system', 'amtech', $2, 'verification.event', $3, 'received', now() - interval '1 second')
  `, [ambientId, `external:${suffix}`, `dedupe:${suffix}`]);
  await client.query("set local role service_role");
  const ambientClaim = await one("select inbox_id, processing_state, attempt_count from claim_next_ambient_event($1, 30)", [`ambient_lease_${suffix}`]);
  check("ambient_event_leased", ambientClaim?.inbox_id === ambientId && ambientClaim.processing_state === "processing" && Number(ambientClaim.attempt_count) === 1);
  await client.query("reset role");

  const welcomeId = `ain_welcome_${suffix}`;
  const welcomeJobId = `pjob_welcome_${suffix}`;
  await client.query(`
    insert into ambient_event_inbox(inbox_id, source_type, provider, external_event_id, account_id, employee_id, event_type, dedupe_key, processing_state, payload)
    values($1, 'system', 'amtech', $2, $3, $4, 'employee.welcome.requested', $5, 'received', jsonb_build_object('message', 'Verifier welcome'))
  `, [welcomeId, `welcome:${suffix}`, accountId, employeeId, `welcome-dedupe:${suffix}`]);
  await client.query(`
    insert into provisioning_jobs(id, account_id, employee_id, idempotency_key, state, worker_context)
    values($1, $2, $3, $4, 'welcome_sent', jsonb_build_object('welcome_event_inbox_id', $5::text))
  `, [welcomeJobId, accountId, employeeId, `welcome-job:${suffix}`, welcomeId]);
  let readyRejected = false;
  try {
    await client.query("update provisioning_jobs set state = 'ready' where id = $1", [welcomeJobId]);
  } catch (err) {
    readyRejected = String(err.message).includes("temporarily_welcome_effect_not_processed");
  }
  check("ready_rejected_before_welcome_effect", readyRejected);
  await client.query("update ambient_event_inbox set processing_state = 'processed', processed_at = now() where inbox_id = $1", [welcomeId]);
  const welcomeMessage = await one("select id, body, status from employee_messages where provider_id = $1", [welcomeId]);
  check("welcome_materialized_idempotently", Boolean(welcomeMessage?.id) && welcomeMessage.body === "Verifier welcome" && welcomeMessage.status === "delivered");
  await client.query("update provisioning_jobs set state = 'ready' where id = $1", [welcomeJobId]);
  check("ready_allowed_after_welcome_effect", (await one("select state from provisioning_jobs where id = $1", [welcomeJobId]))?.state === "ready");

  await client.query("update employees set needs_reprovision = true where id = $1", [employeeId]);
  const reprovision = await one(`
    select id, command_type, requested_by
    from provisioning_commands
    where employee_id = $1 and command_type = 'reprovision' and requested_by = 'employees.needs_reprovision'
  `, [employeeId]);
  check("needs_reprovision_enqueues_command", Boolean(reprovision?.id));
  const beforeCount = Number((await one("select count(*)::int as count from provisioning_commands where employee_id = $1 and requested_by = 'employees.needs_reprovision'", [employeeId])).count);
  await client.query("update employees set needs_reprovision = true where id = $1", [employeeId]);
  const afterCount = Number((await one("select count(*)::int as count from provisioning_commands where employee_id = $1 and requested_by = 'employees.needs_reprovision'", [employeeId])).count);
  check("needs_reprovision_trigger_is_edge_only", beforeCount === afterCount, `${beforeCount}->${afterCount}`);

  await client.query("rollback");
  for (const item of checks) console.log(`PASS ${item.name}${item.detail ? ` ${item.detail}` : ""}`);
  console.log(`worker_migrations_verified:${JSON.stringify({ migrations: expectedMigrations, checks: checks.length })}`);
} catch (err) {
  try { await client.query("rollback"); } catch {}
  for (const item of checks) console.log(`${item.status === "pass" ? "PASS" : "FAIL"} ${item.name}${item.detail ? ` ${item.detail}` : ""}`);
  console.error(`worker_migrations_failed:${String(err?.message ?? err)}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
