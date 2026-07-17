import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProvisionerResult } from "@amtech/shared";

export type ProvisionerClaimKind = "nonce" | "idempotency";

export interface ProvisionerIdempotencyStore {
  markerPath(kind: ProvisionerClaimKind, key: string): string;
  resultPath(key: string): string;
  cachedResult(key: string): Promise<ProvisionerResult | null>;
  claim(kind: ProvisionerClaimKind, key: string): Promise<boolean>;
  releaseFailedIdempotencyClaim(key: string): Promise<void>;
  storeResult(key: string, result: ProvisionerResult): Promise<void>;
}

export function createProvisionerIdempotencyStore(input: { root: string; staleMs?: number }): ProvisionerIdempotencyStore {
  const staleMs = Math.max(1, input.staleMs ?? 10 * 60_000);
  const markerPath = (kind: ProvisionerClaimKind, key: string) => join(input.root, kind, encodeURIComponent(key));
  const resultPath = (key: string) => join(input.root, "results", `${encodeURIComponent(key)}.json`);

  const cachedResult = async (key: string): Promise<ProvisionerResult | null> => {
    try {
      return JSON.parse(await readFile(resultPath(key), "utf8")) as ProvisionerResult;
    } catch {
      return null;
    }
  };

  const claim = async (kind: ProvisionerClaimKind, key: string): Promise<boolean> => {
    const dir = join(input.root, kind);
    await mkdir(dir, { recursive: true, mode: 0o700 });
    const path = markerPath(kind, key);
    try {
      await writeFile(path, new Date().toISOString(), { flag: "wx", mode: 0o600 });
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      if (kind !== "idempotency" || await cachedResult(key)) return false;
      try {
        const info = await stat(path);
        if (Date.now() - info.mtimeMs <= staleMs) return false;
        await rm(path, { force: true });
        await writeFile(path, new Date().toISOString(), { flag: "wx", mode: 0o600 });
        return true;
      } catch (reclaimErr) {
        if ((reclaimErr as NodeJS.ErrnoException).code === "EEXIST") return false;
        throw reclaimErr;
      }
    }
  };

  const releaseFailedIdempotencyClaim = async (key: string): Promise<void> => {
    if (await cachedResult(key)) return;
    await rm(markerPath("idempotency", key), { force: true });
  };

  const storeResult = async (key: string, result: ProvisionerResult): Promise<void> => {
    const dir = join(input.root, "results");
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await writeFile(resultPath(key), JSON.stringify(result), { mode: 0o600 });
  };

  return { markerPath, resultPath, cachedResult, claim, releaseFailedIdempotencyClaim, storeResult };
}
