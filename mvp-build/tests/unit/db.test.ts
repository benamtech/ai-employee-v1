/**
 * DB result helpers (apps/manager/src/lib/db.ts). orThrow/mustWrite must fail loud
 * on a real DB error; insertDedup must turn a unique-violation (23505) into a
 * tolerated conflict while still failing loud on any other error. fake-supabase does
 * not enforce unique indexes, so the 23505 backstop is proven here in isolation.
 */
import { describe, expect, it } from "vitest";
import { orThrow, mustWrite, insertDedup, PG_UNIQUE_VIOLATION } from "../../apps/manager/src/lib/db";

describe("db result helpers", () => {
  it("orThrow returns data and throws on error", () => {
    expect(orThrow({ data: 42, error: null }, "where")).toBe(42);
    expect(() => orThrow({ data: null, error: { message: "boom" } }, "where")).toThrow(/db_read_failed:where/);
  });

  it("mustWrite resolves data and throws on error", async () => {
    await expect(mustWrite(Promise.resolve({ data: [1], error: null }), "w")).resolves.toEqual([1]);
    await expect(mustWrite(Promise.resolve({ data: null, error: { message: "nope" } }), "w")).rejects.toThrow(/db_write_failed:w/);
  });

  it("insertDedup tolerates a unique violation but fails loud otherwise", async () => {
    await expect(insertDedup(Promise.resolve({ data: [1], error: null }), "ins")).resolves.toEqual({ conflict: false });
    await expect(
      insertDedup(Promise.resolve({ data: null, error: { message: "dup", code: PG_UNIQUE_VIOLATION } }), "ins"),
    ).resolves.toEqual({ conflict: true });
    await expect(
      insertDedup(Promise.resolve({ data: null, error: { message: "other", code: "23502" } }), "ins"),
    ).rejects.toThrow(/db_write_failed:ins/);
  });
});
