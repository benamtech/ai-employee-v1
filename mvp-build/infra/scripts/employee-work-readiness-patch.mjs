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

const ambient = "mvp-build/apps/manager/src/lib/ambient-inbox.ts";
await replaceExactly(
  ambient,
  `  const existing = await db.from("ambient_event_inbox").select("inbox_id").eq("dedupe_key", dedupeKey).maybeSingle();\n  if (existing.error || !existing.data) throw existing.error ?? new Error("ambient_event_dedupe_lookup_failed");\n  return { inbox_id: String(existing.data.inbox_id), duplicate: true };`,
  `  const duplicate = await db.rpc("record_ambient_event_duplicate", {\n    p_source_type: input.source_type,\n    p_provider: input.provider,\n    p_external_event_id: input.external_event_id,\n    p_dedupe_key: dedupeKey,\n  });\n  if (duplicate.error) throw duplicate.error;\n  const existing = Array.isArray(duplicate.data) ? duplicate.data[0] : duplicate.data;\n  if (!existing?.inbox_id) throw new Error("ambient_event_dedupe_lookup_failed");\n  return { inbox_id: String(existing.inbox_id), duplicate: true };`,
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
