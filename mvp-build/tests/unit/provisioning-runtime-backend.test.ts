import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { provisioningTools } from "../../apps/manager/src/tools/provisioning.stub";
import type { ToolContext } from "../../apps/manager/src/tools/types";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";

/**
 * Call-site smoke test proving the runtime-backend admission guard added in
 * provisioning.stub.ts is actually wired into provision_employee, not just
 * correct in isolation (see runtime-backend.test.ts's
 * "local runtime backend admission" describe block for the guard's own logic).
 */

const ENV_KEYS = [
  "NODE_ENV",
  "ALLOW_LOCAL_RUNTIME_BACKEND",
  "HERMES_BACKEND_TYPE",
  "AMTECH_CLIENTS_DIR",
  "PROVISIONER_ORIGIN",
  "PROVISIONER_TOKEN",
  "SECRET_REF_MASTER_KEY",
];
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.NODE_ENV = "test";
  process.env.AMTECH_CLIENTS_DIR = "/tmp/amtech-clients-test";
  process.env.HERMES_BACKEND_TYPE = "local";
  delete process.env.ALLOW_LOCAL_RUNTIME_BACKEND;
  // The guard rejects before any network call, but stub fetch anyway so a bug
  // in call-site ordering surfaces as an unexpected fetch rather than a
  // silent pass.
  vi.stubGlobal("fetch", vi.fn(async () => {
    throw new Error("provisioner network call must not be reached");
  }));
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.restoreAllMocks();
});

const manifest = {
  business_display_name: "Hernandez Painting",
  business_kind: "painting",
  timezone: "America/New_York",
  owner_name: "Luis Hernandez",
  owner_email: "luis@example.com",
  verified_phone_e164: "+15705551234",
  verification_method: "twilio_verify",
  consent_channel: "web",
  employee_name: "Sam",
};

function ctx(db: ReturnType<typeof makeFakeDb>, accountId = "acct_1"): ToolContext {
  return { db: db.asClient(), account_id: accountId, employee_id: null, actor: "manager" };
}

function allowProvisioner() {
  process.env.ALLOW_LOCAL_RUNTIME_BACKEND = "1";
  process.env.PROVISIONER_ORIGIN = "http://provisioner.test";
  process.env.PROVISIONER_TOKEN = "provisioner-token";
  process.env.SECRET_REF_MASTER_KEY = "test-secret-master-key";
}

function okProvisioner() {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    status: "ok",
    profile_id: "client_from_provisioner",
    validation_status: "passed",
    validation_output: "profile ok",
    logs: ["rendered", "started"],
  }), { status: 200 })));
}

describe("provision_employee: runtime backend admission", () => {
  it("rejects HERMES_BACKEND_TYPE=local provisioning when ALLOW_LOCAL_RUNTIME_BACKEND is unset", async () => {
    const db = makeFakeDb();
    const result = await provisioningTools.provision_employee!(ctx(db), {
      account_id: "acct_1",
      manifest,
      idempotency_key: "idem_1",
    });
    expect(result.status).toBe("failed");
    expect(result.proof.failure_code).toBe("unauthorized");
    expect(db.tables.employees ?? []).toHaveLength(0); // nothing persisted before the denial
  });

  it("allows HERMES_BACKEND_TYPE=local provisioning when explicitly opted in", async () => {
    process.env.ALLOW_LOCAL_RUNTIME_BACKEND = "1";
    const db = makeFakeDb();
    const result = await provisioningTools.provision_employee!(ctx(db), {
      account_id: "acct_1",
      manifest,
      idempotency_key: "idem_2",
    });
    // Past the guard, provisioning proceeds to the real network call to
    // PROVISIONER_ORIGIN, which is unset in this unit test — it fails for a
    // DIFFERENT reason (provider_error), proving the guard itself let it through.
    expect(result.status).toBe("failed");
    expect(result.proof.failure_code).not.toBe("unauthorized");
    expect(db.tables.employees ?? []).toHaveLength(1); // the employee row IS written before the network call
  });

  it("preserves provisioner failure state, http status, and redacted logs", async () => {
    allowProvisioner();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      status: "failed",
      failure_state: "caddy_reload_failed",
      logs: ["token=super-secret-value", "Caddy reload failed"],
    }), { status: 500 })));
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    const result = await provisioningTools.provision_employee!(ctx(db), {
      account_id: "acct_1",
      manifest,
      idempotency_key: "idem_logs",
    });
    expect(result.status).toBe("failed");
    expect(result.proof.failure_state).toBe("caddy_reload_failed");
    expect(result.proof.http_status).toBe(500);
    expect(db.tables.provisioning_jobs[0].failure_state).toBe("caddy_reload_failed");
    expect(db.tables.provisioning_jobs[0].logs.join("\n")).toContain("token=[REDACTED]");
    expect(db.tables.provisioning_jobs[0].logs.join("\n")).not.toContain("super-secret-value");
    expect(db.tables.employee_profile_builds[0].validation_output).toContain("caddy_reload_failed");
  });

  it("retries a failed idempotency key by creating a fresh provisioning job", async () => {
    allowProvisioner();
    okProvisioner();
    const db = makeFakeDb({
      provisioning_jobs: [{
        id: "pjob_failed",
        account_id: "acct_1",
        employee_id: "emp_failed",
        idempotency_key: "acct_1:onb_1",
        state: "failed",
        failure_state: "provisioner_failed",
        logs: [],
      }],
    }, { uniques: SCHEMA_UNIQUES });
    const result = await provisioningTools.provision_employee!(ctx(db), {
      account_id: "acct_1",
      manifest,
      idempotency_key: "acct_1:onb_1",
    });
    expect(result.status).toBe("ok");
    expect(db.tables.provisioning_jobs).toHaveLength(2);
    const retry = db.tables.provisioning_jobs.find((job) => job.id !== "pjob_failed")!;
    expect(retry.state).toBe("success");
    expect(retry.idempotency_key).toMatch(/^acct_1:onb_1:retry:pjob_/);
    expect(retry.logs[0].retry_of_provisioning_job_id).toBe("pjob_failed");
  });

  it("creates separate employees, jobs, endpoints, and MCP credentials for repeated account provisions", async () => {
    allowProvisioner();
    okProvisioner();
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    const first = await provisioningTools.provision_employee!(ctx(db), {
      account_id: "acct_1",
      manifest: { ...manifest, employee_name: "Sam" },
      idempotency_key: "acct_1:onb_first",
    });
    const second = await provisioningTools.provision_employee!(ctx(db), {
      account_id: "acct_1",
      manifest: { ...manifest, employee_name: "Riley" },
      idempotency_key: "acct_1:onb_second",
    });
    expect(first.status).toBe("ok");
    expect(second.status).toBe("ok");
    expect(db.tables.employees).toHaveLength(2);
    expect(db.tables.provisioning_jobs).toHaveLength(2);
    expect(db.tables.runtime_endpoints).toHaveLength(2);
    expect(db.tables.employee_mcp_credentials).toHaveLength(2);
    expect(new Set(db.tables.employees.map((row) => row.id)).size).toBe(2);
    expect(new Set(db.tables.runtime_endpoints.map((row) => row.employee_id)).size).toBe(2);
  });
});
