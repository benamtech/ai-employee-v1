import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runSchedulerCycle, runSchedulerJob } from "../../apps/manager/src/lib/scheduler-runner";
import { makeFakeDb } from "./_helpers/fake-supabase";
import { routerFetch } from "./_helpers/fetch-mock";

beforeEach(() => {
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.EMPLOYEE_SMS_FROM;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("scheduler runner", () => {
  it("records hermes_job_runs proof for a scheduled reminder pass", async () => {
    const db = makeFakeDb({
      reminders: [{
        id: "rem_1",
        account_id: "acct_1",
        employee_id: "emp_1",
        job_id: null,
        scheduled_at: "2026-07-01T13:30:00.000Z",
        channel: "sms",
        status: "scheduled",
        message: "Job starts soon.",
      }],
    });

    const result = await runSchedulerJob(db.asClient(), "dispatch_due_reminders", {
      now: "2026-07-01T14:00:00.000Z",
      runner_type: "scheduler_tick",
    });

    expect(result.status).toBe("ok");
    expect(db.tables.hermes_job_runs).toHaveLength(1);
    expect(db.tables.hermes_job_runs?.[0]?.job_key).toBe("dispatch_due_reminders");
    expect(db.tables.hermes_job_runs?.[0]?.runner_type).toBe("scheduler_tick");
    expect(db.tables.hermes_job_runs?.[0]?.finished_at).toBeTruthy();
    expect(db.tables.hermes_job_runs?.[0]?.proof.fired).toBe(1);
  });

  it("records failed job runs without faking success", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1", status: "live" }],
      runtime_endpoints: [{
        id: "rt_1",
        employee_id: "emp_1",
        backend_type: "bare-metal",
        sms_number_e164: "+15555550199",
        webchat_api_url: "https://runtime.test/health",
      }],
    });

    const result = await runSchedulerJob(db.asClient(), "runtime_health_checks", {
      runner_type: "hermes_jobs",
      external_job_id: "hj_1",
    });

    expect(result.status).toBe("failed");
    expect(db.tables.hermes_job_runs?.[0]?.status).toBe("failed");
    expect(db.tables.hermes_job_runs?.[0]?.external_job_id).toBe("hj_1");
    expect(db.tables.hermes_job_runs?.[0]?.error).toContain("Unsupported HERMES_BACKEND_TYPE");
  });

  it("records runtime health snapshots during a full cycle", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1", status: "live" }],
      runtime_endpoints: [{
        id: "rt_1",
        employee_id: "emp_1",
        backend_type: "docker",
        sms_number_e164: "+15555550199",
        webchat_api_url: "https://runtime.test/health",
        gateway_port: 8101,
      }],
      provisioning_jobs: [{ id: "pjob_1", account_id: "acct_1", employee_id: "emp_1", state: "success" }],
    });
    vi.stubGlobal("fetch", routerFetch([{ match: "/health", body: { status: "ok" } }]));

    const result = await runSchedulerCycle(db.asClient(), { job_key: "runtime_health_checks", runner_type: "hermes_jobs" });

    expect(result.results[0]?.status).toBe("ok");
    expect(db.tables.runtime_health_checks).toHaveLength(1);
    expect(db.tables.runtime_health_checks?.[0]?.status).toBe("healthy");
    expect(db.tables.hermes_job_runs?.[0]?.proof.checked).toBe(1);
  });
});
