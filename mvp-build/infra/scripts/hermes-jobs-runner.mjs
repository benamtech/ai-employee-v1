#!/usr/bin/env node
/**
 * Hermes Jobs runner entrypoint.
 *
 * Intended for Hermes Jobs or an equivalent host scheduler. It calls the same
 * protected Manager boundary as `scheduler-tick.mjs`, but records
 * runner_type=hermes_jobs so a live run can become runtime proof when Hermes
 * supplies a real job/run id.
 */
const base = (process.env.MANAGER_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const token = process.env.MANAGER_INTERNAL_TOKEN ?? "";
const renewWindow = Number(process.env.REMINDER_RENEW_WINDOW_SECONDS ?? 86_400);

const args = process.argv.slice(2);
const jobArg = args.find((a) => a.startsWith("--job"));
const job = jobArg ? jobArg.split("=")[1] ?? args[args.indexOf(jobArg) + 1] : "all";
const externalArg = args.find((a) => a.startsWith("--external-job-id"));
const externalJobId = externalArg ? externalArg.split("=")[1] ?? args[args.indexOf(externalArg) + 1] : process.env.HERMES_JOB_ID;

async function main() {
  const res = await fetch(`${base}/manager/scheduler/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      job_key: job,
      within_seconds: renewWindow,
      runner_type: "hermes_jobs",
      external_job_id: externalJobId ?? null,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === "failed") {
    throw new Error(`Hermes Jobs scheduler failed (${res.status}): ${JSON.stringify(json.error ?? json)}`);
  }
  for (const r of json.results ?? []) {
    console.log(`✓ ${r.job_key}: ${r.status} (${r.job_run_id}) ${JSON.stringify(r.proof ?? {})}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
