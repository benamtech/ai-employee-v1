import { afterEach, describe, expect, it } from "vitest";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";
import {
  promptTokensFrom,
  recordSessionOccupancy,
  rotateSessionIfNeeded,
} from "../../apps/manager/src/lib/session-rotation";

const asClient = (db: ReturnType<typeof makeFakeDb>) => db as unknown as import("@amtech/db").SupabaseClient;

function seedRuntime(sessionId = "amtech-owner-thread") {
  return {
    runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "http://x", api_session_id: sessionId, api_session_key: "amtech:v1:account:acct_1:employee:emp_1" }],
    accounts: [{ id: "acct_1" }],
    employees: [{ id: "emp_1", account_id: "acct_1" }],
  } as Record<string, any[]>;
}

afterEach(() => {
  delete process.env.AMTECH_SESSION_ROTATION_DISABLED;
});

describe("promptTokensFrom (tolerant occupancy parser)", () => {
  it("reads prompt_tokens / input_tokens across providers", () => {
    expect(promptTokensFrom({ prompt_tokens: 1200 })).toBe(1200);
    expect(promptTokensFrom({ input_tokens: 900 })).toBe(900);
    expect(promptTokensFrom({ promptTokens: 700 })).toBe(700);
  });

  it("adds Anthropic-style cache tokens (reported separately from input)", () => {
    expect(promptTokensFrom({ input_tokens: 1000, cache_read_input_tokens: 5000, cache_creation_input_tokens: 200 })).toBe(6200);
  });

  it("returns null when no token field is present (rotation then skips)", () => {
    expect(promptTokensFrom({})).toBeNull();
    expect(promptTokensFrom(undefined)).toBeNull();
    expect(promptTokensFrom({ total_tokens: 5 } as Record<string, unknown>)).toBeNull();
  });
});

describe("recordSessionOccupancy (post-turn)", () => {
  it("inserts the first active session row from a turn's usage", async () => {
    const db = makeFakeDb(seedRuntime(), { uniques: SCHEMA_UNIQUES });
    await recordSessionOccupancy(asClient(db), {
      account_id: "acct_1", employee_id: "emp_1",
      transcript_session_id: "amtech-owner-thread", memory_session_key: "mk",
      usage: { prompt_tokens: 1234 },
    });
    const rows = db.tables.employee_sessions;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ transcript_session_id: "amtech-owner-thread", context_tokens: 1234, turn_count: 1, status: "active" });
  });

  it("updates occupancy and increments turn_count on the next turn", async () => {
    const db = makeFakeDb(seedRuntime(), { uniques: SCHEMA_UNIQUES });
    const args = { account_id: "acct_1", employee_id: "emp_1", transcript_session_id: "amtech-owner-thread", memory_session_key: "mk" };
    await recordSessionOccupancy(asClient(db), { ...args, usage: { prompt_tokens: 100 } });
    await recordSessionOccupancy(asClient(db), { ...args, usage: { prompt_tokens: 555 } });
    expect(db.tables.employee_sessions).toHaveLength(1);
    expect(db.tables.employee_sessions[0]).toMatchObject({ context_tokens: 555, turn_count: 2 });
  });
});

describe("rotateSessionIfNeeded (pre-turn)", () => {
  const active = (tokens: number) => ({
    employee_sessions: [{ employee_id: "emp_1", transcript_session_id: "amtech-owner-thread", account_id: "acct_1", memory_session_key: "mk-stable", context_tokens: tokens, turn_count: 3, status: "active", pending_carryover: false }],
    ...seedRuntime(),
  });

  it("does not rotate below the threshold", async () => {
    const db = makeFakeDb(active(79_999), { uniques: SCHEMA_UNIQUES });
    const res = await rotateSessionIfNeeded(asClient(db), { account_id: "acct_1", employee_id: "emp_1" });
    expect(res.rotated).toBe(false);
    expect(res.skipped).toBe("under_threshold");
    expect(db.tables.runtime_endpoints[0].api_session_id).toBe("amtech-owner-thread");
  });

  it("rotates over threshold: old row rotated, new active row minted, memory key preserved, transcript repointed", async () => {
    const db = makeFakeDb(active(80_000), { uniques: SCHEMA_UNIQUES });
    const res = await rotateSessionIfNeeded(asClient(db), { account_id: "acct_1", employee_id: "emp_1" });
    expect(res.rotated).toBe(true);
    const rows = db.tables.employee_sessions;
    const old = rows.find((r) => r.transcript_session_id === "amtech-owner-thread");
    const fresh = rows.find((r) => r.status === "active");
    expect(old?.status).toBe("rotated");
    expect(fresh?.transcript_session_id).toBe(res.new_transcript_session_id);
    expect(fresh?.pending_carryover).toBe(true);
    expect(fresh?.rotated_from).toBe("amtech-owner-thread");
    // memory scope preserved; only the transcript id changes.
    expect(fresh?.memory_session_key).toBe("mk-stable");
    expect(db.tables.runtime_endpoints[0].api_session_id).toBe(res.new_transcript_session_id);
    expect(db.tables.runtime_endpoints[0].api_session_key).toBe("amtech:v1:account:acct_1:employee:emp_1");
    // exactly one active row after rotation.
    expect(rows.filter((r) => r.status === "active")).toHaveLength(1);
  });

  it("is a no-op when disabled by env flag", async () => {
    process.env.AMTECH_SESSION_ROTATION_DISABLED = "1";
    const db = makeFakeDb(active(999_999), { uniques: SCHEMA_UNIQUES });
    const res = await rotateSessionIfNeeded(asClient(db), { account_id: "acct_1", employee_id: "emp_1" });
    expect(res).toEqual({ rotated: false, skipped: "disabled" });
    expect(db.tables.runtime_endpoints[0].api_session_id).toBe("amtech-owner-thread");
  });

  it("skips cleanly when there is no active session yet", async () => {
    const db = makeFakeDb(seedRuntime(), { uniques: SCHEMA_UNIQUES });
    const res = await rotateSessionIfNeeded(asClient(db), { account_id: "acct_1", employee_id: "emp_1" });
    expect(res).toMatchObject({ rotated: false, skipped: "no_active" });
  });
});
