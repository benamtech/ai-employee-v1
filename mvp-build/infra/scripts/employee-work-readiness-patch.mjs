import { readFile, writeFile } from "node:fs/promises";

async function replaceExactly(path, before, after) {
  const source = await readFile(path, "utf8");
  const matches = source.split(before).length - 1;
  if (matches !== 1) throw new Error(`${path}: expected one exact match, found ${matches}`);
  await writeFile(path, source.replace(before, after), "utf8");
}

async function replaceAllExactly(path, before, after, expected) {
  const source = await readFile(path, "utf8");
  const matches = source.split(before).length - 1;
  if (matches !== expected) throw new Error(`${path}: expected ${expected} matches, found ${matches}`);
  await writeFile(path, source.split(before).join(after), "utf8");
}

async function replaceRange(path, start, end, replacement) {
  const source = await readFile(path, "utf8");
  const startAt = source.indexOf(start);
  const endAt = source.indexOf(end, startAt);
  if (startAt < 0 || endAt < 0) throw new Error(`${path}: range markers missing`);
  await writeFile(path, source.slice(0, startAt) + replacement + source.slice(endAt), "utf8");
}

const host = "mvp-build/apps/manager/src/provisioner-host.ts";
await replaceExactly(
  host,
  'import { appendFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";',
  'import { appendFile, mkdir, rm } from "node:fs/promises";',
);
await replaceExactly(
  host,
  'import { runCommandString } from "./lib/command-runner.js";',
  'import { runCommandString } from "./lib/command-runner.js";\nimport { createProvisionerIdempotencyStore } from "./lib/provisioner-idempotency.js";',
);
await replaceRange(
  host,
  'function markerPath(kind: "nonce" | "idempotency", key: string): string {',
  'async function audit(entry: Record<string, unknown>): Promise<void> {',
  `function idempotencyStore() {\n  return createProvisionerIdempotencyStore({\n    root: stateRoot(),\n    staleMs: Math.max(30_000, Number(process.env.PROVISIONER_IDEMPOTENCY_STALE_MS ?? 10 * 60_000)),\n  });\n}\n\nasync function cachedResult(key: string): Promise<ProvisionerResult | null> {\n  return idempotencyStore().cachedResult(key);\n}\n\nasync function claimOnce(kind: "nonce" | "idempotency", key: string): Promise<boolean> {\n  return idempotencyStore().claim(kind, key);\n}\n\nasync function releaseFailedIdempotencyClaim(key: string): Promise<void> {\n  return idempotencyStore().releaseFailedIdempotencyClaim(key);\n}\n\nasync function storeResult(key: string, result: ProvisionerResult): Promise<void> {\n  return idempotencyStore().storeResult(key, result);\n}\n\n`,
);
await replaceExactly(
  host,
  `  if (req.operation === "rotate_model_gateway_credential") {\n    const rotated = await rotateRenderedModelGatewayCredential(req);\n    const container = \`amtech-hermes-\${req.employee_id}\`;\n    const restarted = await bestEffortCommand(\`docker restart \${container}\`, "restart runtime after credential rotation");\n    if (restarted.startsWith("failed:")) throw new Error(restarted);\n    return {\n      status: "ok",\n      request_id: req.request_id,\n      operation: req.operation,\n      profile_id: rotated.profile_id,\n      generated_path: rotated.generated_path,\n      profile_checksum: rotated.profile_checksum,\n      container_name: container,\n      model_gateway_credential_version: req.params.model_gateway.credential_version,\n      smoke_output: restarted,\n      drift: await inspectRuntime(req),\n      logs: [\`rotated_model_gateway_credential:\${req.params.model_gateway.credential_version}\`, \`restart:\${restarted}\`],\n    };\n  }`,
  `  if (req.operation === "rotate_model_gateway_credential") {\n    const rotated = await rotateRenderedModelGatewayCredential(req);\n    const container = \`amtech-hermes-\${req.employee_id}\`;\n    const drift = await inspectRuntime(req);\n    return {\n      status: "ok",\n      request_id: req.request_id,\n      operation: req.operation,\n      profile_id: rotated.profile_id,\n      generated_path: rotated.generated_path,\n      profile_checksum: rotated.profile_checksum,\n      container_name: container,\n      model_gateway_credential_version: req.params.model_gateway.credential_version,\n      smoke_output: rotated.runtime_reload_output,\n      drift,\n      logs: [\`rotated_model_gateway_credential:\${req.params.model_gateway.credential_version}\`, \`recreate:\${rotated.runtime_reload_output}\`],\n    };\n  }`,
);

const ambient = "mvp-build/apps/manager/src/lib/ambient-inbox.ts";
await replaceExactly(
  ambient,
  `  const existing = await db.from("ambient_event_inbox").select("inbox_id").eq("dedupe_key", dedupeKey).maybeSingle();\n  if (existing.error || !existing.data) throw existing.error ?? new Error("ambient_event_dedupe_lookup_failed");\n  return { inbox_id: String(existing.data.inbox_id), duplicate: true };`,
  `  let existing = await db.from("ambient_event_inbox").select("inbox_id").eq("dedupe_key", dedupeKey).maybeSingle();\n  if (existing.error) throw existing.error;\n  if (!existing.data) {\n    existing = await db.from("ambient_event_inbox")\n      .select("inbox_id")\n      .eq("source_type", input.source_type)\n      .eq("provider", input.provider)\n      .eq("external_event_id", input.external_event_id)\n      .maybeSingle();\n  }\n  if (existing.error || !existing.data) throw existing.error ?? new Error("ambient_event_dedupe_lookup_failed");\n  return { inbox_id: String(existing.data.inbox_id), duplicate: true };`,
);

await replaceAllExactly(
  "mvp-build/packages/db/migrations/0034_reconciler_workers_and_ambient_replay.sql",
  "security definer",
  "security invoker",
  3,
);
await replaceAllExactly(
  "mvp-build/packages/db/migrations/0035_worker_terminal_claim_and_effect_receipts.sql",
  "security definer",
  "security invoker",
  1,
);
