import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { provisioningTools } from "../../apps/manager/src/tools/provisioning.stub";
import type { ToolContext } from "../../apps/manager/src/tools/types";
import { makeFakeDb } from "./_helpers/fake-supabase";

/**
 * Call-site smoke test proving the runtime-backend admission guard added in
 * provisioning.stub.ts is actually wired into provision_employee, not just
 * correct in isolation (see runtime-backend.test.ts's
 * "local runtime backend admission" describe block for the guard's own logic).
 */

const ENV_KEYS = ["NODE_ENV", "ALLOW_LOCAL_RUNTIME_BACKEND", "HERMES_BACKEND_TYPE", "AMTECH_CLIENTS_DIR"];
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

describe("provision_employee: runtime backend admission", () => {
  it("rejects HERMES_BACKEND_TYPE=local provisioning when ALLOW_LOCAL_RUNTIME_BACKEND is unset", async () => {
    const db = makeFakeDb();
    const ctx: ToolContext = { db: db.asClient(), account_id: "acct_1", employee_id: null, actor: "manager" };
    const result = await provisioningTools.provision_employee!(ctx, {
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
    const ctx: ToolContext = { db: db.asClient(), account_id: "acct_1", employee_id: null, actor: "manager" };
    const result = await provisioningTools.provision_employee!(ctx, {
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
});
