import { mkdtemp, rm, stat, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createProvisionerIdempotencyStore } from "../../apps/manager/src/lib/provisioner-idempotency.js";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function root(): Promise<string> {
  const value = await mkdtemp(join(tmpdir(), "amtech-provisioner-idempotency-"));
  roots.push(value);
  return value;
}

describe("host provisioner idempotency recovery", () => {
  it("releases a failed claim immediately when no result was persisted", async () => {
    const store = createProvisionerIdempotencyStore({ root: await root(), staleMs: 60_000 });
    expect(await store.claim("idempotency", "job:render:one")).toBe(true);
    expect(await store.claim("idempotency", "job:render:one")).toBe(false);
    await store.releaseFailedIdempotencyClaim("job:render:one");
    expect(await store.claim("idempotency", "job:render:one")).toBe(true);
  });

  it("reclaims a stale crash marker but not a fresh in-flight marker", async () => {
    const store = createProvisionerIdempotencyStore({ root: await root(), staleMs: 1_000 });
    const key = "job:runtime:crash-window";
    expect(await store.claim("idempotency", key)).toBe(true);
    expect(await store.claim("idempotency", key)).toBe(false);
    const old = new Date(Date.now() - 5_000);
    await utimes(store.markerPath("idempotency", key), old, old);
    expect(await store.claim("idempotency", key)).toBe(true);
  });

  it("preserves completed results and returns them for idempotent replay", async () => {
    const store = createProvisionerIdempotencyStore({ root: await root(), staleMs: 1 });
    const key = "job:route:completed";
    expect(await store.claim("idempotency", key)).toBe(true);
    await store.storeResult(key, { status: "ok", operation: "activate_routing", public_web_route: "/agent/emp_alpha" });
    await store.releaseFailedIdempotencyClaim(key);
    expect((await stat(store.markerPath("idempotency", key))).isFile()).toBe(true);
    expect(await store.claim("idempotency", key)).toBe(false);
    expect(await store.cachedResult(key)).toMatchObject({ status: "ok", public_web_route: "/agent/emp_alpha" });
  });

  it("never reclaims nonce markers", async () => {
    const store = createProvisionerIdempotencyStore({ root: await root(), staleMs: 1 });
    const key = "nonce:single-use";
    expect(await store.claim("nonce", key)).toBe(true);
    const old = new Date(Date.now() - 5_000);
    await utimes(store.markerPath("nonce", key), old, old);
    expect(await store.claim("nonce", key)).toBe(false);
  });
});
