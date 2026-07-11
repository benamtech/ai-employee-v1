import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb } from "./_helpers/fake-supabase";
import { getFreshQboAccessToken, sealQboTokenBundle } from "../../apps/manager/src/lib/qbo-tokens";

describe("qbo-tokens", () => {
  beforeEach(() => {
    process.env.SECRET_REF_MASTER_KEY = "unit-test-secret-ref-master-key";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.SECRET_REF_MASTER_KEY;
  });

  it("waits longer than the old one-second contention window for another refresh to persist", async () => {
    const db = makeFakeDb({
      connector_accounts: [{
        id: "conn_1",
        token_secret_ref: sealQboTokenBundle({ access_token: "old_at", refresh_token: "old_rt" }),
        token_expiry: "2026-07-09T23:00:00.000Z",
        token_refresh_lease_until: "2026-07-10T00:00:30.000Z",
      }],
    });
    const connector = {
      id: "conn_1",
      token_secret_ref: sealQboTokenBundle({ access_token: "old_at", refresh_token: "old_rt" }),
      token_expiry: "2026-07-09T23:00:00.000Z",
      realm_id: "realm_1",
      environment: "sandbox",
    };

    setTimeout(() => {
      db.tables.connector_accounts![0]!.token_secret_ref = sealQboTokenBundle({ access_token: "new_at", refresh_token: "new_rt" });
      db.tables.connector_accounts![0]!.token_expiry = "2026-07-10T01:00:00.000Z";
      db.tables.connector_accounts![0]!.token_refresh_lease_until = null;
    }, 1_200);

    const result = getFreshQboAccessToken(db.asClient(), connector);
    await vi.advanceTimersByTimeAsync(1_400);

    await expect(result).resolves.toEqual({
      access_token: "new_at",
      realm_id: "realm_1",
      environment: "sandbox",
    });
  });
});
