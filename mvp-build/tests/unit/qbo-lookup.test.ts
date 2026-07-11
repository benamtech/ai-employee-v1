/**
 * QuickBooks entity resolution. The correctness property that neither reference
 * repo fully guarantees: an ambiguous or zero-match name NEVER resolves to a
 * single id — it returns candidates or not_found. Plus TTL caching.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { queryEntity } = vi.hoisted(() => ({ queryEntity: vi.fn() }));
vi.mock("../../apps/manager/src/lib/qbo-client", () => ({ queryEntity }));

import { resolveQboEntity, clearQboLookupCacheForTests } from "../../apps/manager/src/lib/qbo-lookup";

const config = { access_token: "at", realm_id: "realm_1", environment: "sandbox" as const };

function page(entities: { Id: string; DisplayName?: string; Name?: string }[]) {
  return { entities, count: entities.length };
}

function truncatedPage(entities: { Id: string; DisplayName?: string; Name?: string }[], count: number) {
  return { entities, count };
}

beforeEach(() => {
  clearQboLookupCacheForTests();
  queryEntity.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("resolveQboEntity", () => {
  it("resolves an exact (case-insensitive) match to a single id", async () => {
    queryEntity.mockResolvedValue(page([
      { Id: "10", DisplayName: "Sherwin-Williams" },
      { Id: "11", DisplayName: "Home Depot" },
    ]));
    const res = await resolveQboEntity(config, "conn_1", "Vendor", "sherwin-williams");
    expect(res).toEqual({ status: "resolved", id: "10", name: "Sherwin-Williams" });
  });

  it("returns candidates (never a best-guess pick) when multiple partials match", async () => {
    queryEntity.mockResolvedValue(page([
      { Id: "20", DisplayName: "Sherwin-Williams Downtown" },
      { Id: "21", DisplayName: "Sherwin-Williams Uptown" },
    ]));
    const res = await resolveQboEntity(config, "conn_1", "Vendor", "sherwin");
    expect(res.status).toBe("needs_disambiguation");
    if (res.status === "needs_disambiguation") {
      expect(res.candidates.map((c) => c.id).sort()).toEqual(["20", "21"]);
    }
  });

  it("returns candidates when two entities share the exact same name (still never auto-picks)", async () => {
    queryEntity.mockResolvedValue(page([
      { Id: "30", Name: "Materials" },
      { Id: "31", Name: "Materials" },
    ]));
    const res = await resolveQboEntity(config, "conn_1", "Account", "Materials");
    expect(res.status).toBe("needs_disambiguation");
  });

  it("returns not_found when nothing matches", async () => {
    queryEntity.mockResolvedValue(page([{ Id: "40", DisplayName: "Home Depot" }]));
    const res = await resolveQboEntity(config, "conn_1", "Vendor", "Lowes");
    expect(res.status).toBe("not_found");
  });

  it("caches per connector+entity within the TTL (one fetch across repeated lookups)", async () => {
    queryEntity.mockResolvedValue(page([{ Id: "50", DisplayName: "Home Depot" }]));
    await resolveQboEntity(config, "conn_1", "Vendor", "Home Depot");
    await resolveQboEntity(config, "conn_1", "Vendor", "Home Depot");
    await resolveQboEntity(config, "conn_1", "Vendor", "nobody");
    expect(queryEntity).toHaveBeenCalledTimes(1);
  });

  it("keys the cache per connector (a different connector triggers its own fetch)", async () => {
    queryEntity.mockResolvedValue(page([{ Id: "60", DisplayName: "Home Depot" }]));
    await resolveQboEntity(config, "conn_1", "Vendor", "Home Depot");
    await resolveQboEntity(config, "conn_2", "Vendor", "Home Depot");
    expect(queryEntity).toHaveBeenCalledTimes(2);
  });

  it("does not return a false not_found when QBO silently truncates the lookup page", async () => {
    queryEntity.mockResolvedValue(truncatedPage(
      Array.from({ length: 1000 }, (_, i) => ({ Id: String(i), DisplayName: `Vendor ${i}` })),
      1250,
    ));
    const res = await resolveQboEntity(config, "conn_1", "Vendor", "Missing Vendor");
    expect(res).toEqual({ status: "lookup_truncated", returned_count: 1000, total_count: 1250 });
  });

  it("treats a full maxresults page as possibly truncated when total count is unavailable", async () => {
    queryEntity.mockResolvedValue(page(
      Array.from({ length: 1000 }, (_, i) => ({ Id: String(i), DisplayName: `Vendor ${i}` })),
    ));
    const res = await resolveQboEntity(config, "conn_1", "Vendor", "Missing Vendor");
    expect(res).toEqual({ status: "lookup_truncated", returned_count: 1000, total_count: 1000 });
  });

  it("does not resolve a single exact match when the QBO lookup page is truncated", async () => {
    queryEntity.mockResolvedValue(truncatedPage([{ Id: "70", DisplayName: "Sherwin-Williams" }], 1001));
    const res = await resolveQboEntity(config, "conn_1", "Vendor", "Sherwin-Williams");
    expect(res.status).toBe("needs_disambiguation");
    if (res.status === "needs_disambiguation") {
      expect(res.truncated).toBe(true);
      expect(res.candidates).toEqual([{ id: "70", name: "Sherwin-Williams" }]);
    }
  });

  it("bounds the module-level lookup cache", async () => {
    queryEntity.mockImplementation(async (_config, _entity, statement: string) => {
      const match = statement.match(/from (\w+)/);
      return page([{ Id: statement, DisplayName: match?.[1] ?? "Vendor", Name: match?.[1] ?? "Name" }]);
    });
    for (let i = 0; i < 125; i += 1) {
      await resolveQboEntity(config, `conn_${i}`, "Vendor", "Vendor");
    }
    await resolveQboEntity(config, "conn_0", "Vendor", "Vendor");
    expect(queryEntity).toHaveBeenCalledTimes(126);
  });
});
