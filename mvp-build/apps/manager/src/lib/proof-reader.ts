import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SENSITIVE_KEY = /(token|secret|authorization|signature|raw_?body|payload)/i;

export function proofDir(): string {
  return process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
}

export function redactProofValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof value === "string" && /(Bearer\s+|mcp_|sk_(live|test)_|whsec_|ya29\.)/.test(value)) return "[redacted]";
  if (Array.isArray(value)) return value.map((item, idx) => redactProofValue(String(idx), item));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      out[childKey] = redactProofValue(childKey, childValue);
    }
    return out;
  }
  return value;
}

export function readProofFiles(dir = proofDir()): Array<Record<string, unknown> & { proof_path: string }> {
  try {
    return readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .flatMap((name) => {
        try {
          const parsed = JSON.parse(readFileSync(join(dir, name), "utf8")) as Record<string, unknown>;
          return [{ ...redactProofValue("root", parsed) as Record<string, unknown>, proof_path: join(dir, name) }];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

export function latestProofsByKind(proofs = readProofFiles()): Record<string, Record<string, unknown>> {
  const latest: Record<string, Record<string, unknown>> = {};
  for (const proof of proofs) {
    const kind = String(proof.kind ?? "");
    if (!kind) continue;
    const checked = Date.parse(String(proof.checked_at ?? proof.timestamp ?? 0));
    const previous = latest[kind];
    const previousChecked = Date.parse(String(previous?.checked_at ?? previous?.timestamp ?? 0));
    if (!previous || checked >= previousChecked) latest[kind] = proof;
  }
  return latest;
}
