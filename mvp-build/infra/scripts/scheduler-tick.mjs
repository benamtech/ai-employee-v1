#!/usr/bin/env node
/**
 * Scheduler tick — dev/local fallback for the Phase 2 scheduler runner.
 *
 * Production-like scheduling is driven through the protected Manager scheduler
 * boundary so every pass leaves `hermes_job_runs` proof. Hermes Jobs (or an
 * equivalent host scheduler) should call the same endpoint; this script is only
 * the local/manual fallback and records runner_type=scheduler_tick.
 *
 *   - dispatch_due_reminders : fire reminders whose scheduled_at has arrived (SMS).
 *   - renew_expiring_watches  : renew Gmail watches before their ~7-day expiry.
 *   - dispatch_daily_briefs   : emit the scheduled [SILENT] Work Surface digest.
 *   - runtime_health_checks   : snapshot runtime health.
 *
 * Cron example (every 5 min):
 *   *\/5 * * * *  MANAGER_BASE_URL=https://api.amtechai.com \
 *                MANAGER_INTERNAL_TOKEN=... node infra/scripts/scheduler-tick.mjs
 *
 * Env: MANAGER_BASE_URL (default http://localhost:8080), MANAGER_INTERNAL_TOKEN
 *      (required when the Manager enforces it), REMINDER_RENEW_WINDOW_SECONDS
 *      (optional, default 86400).
 */
const base = (process.env.MANAGER_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const token = process.env.MANAGER_INTERNAL_TOKEN ?? "";
const renewWindow = Number(process.env.REMINDER_RENEW_WINDOW_SECONDS ?? 86_400);

async function runScheduler(body) {
  const res = await fetch(`${base}/manager/scheduler/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === "failed") {
    throw new Error(`scheduler failed (${res.status}): ${JSON.stringify(json.error ?? json)}`);
  }
  return json;
}

async function main() {
  const result = await runScheduler({
    job_key: "all",
    within_seconds: renewWindow,
    runner_type: "scheduler_tick",
  });
  for (const r of result.results ?? []) {
    console.log(`✓ ${r.job_key}: ${r.status} (${r.job_run_id}) ${JSON.stringify(r.proof ?? {})}`);
  }
}

main().catch((err) => {
  console.error(`scheduler tick failed: ${err.message}`);
  process.exit(1);
});
