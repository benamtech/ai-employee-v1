#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "mvp-build/packages/db/migrations/0077_ws07_database_owned_rate_windows.sql";
const targetPath = "mvp-build/packages/db/migrations/0078_ws07_rate_window_namespace_fix.sql";
const source = await readFile(sourcePath, "utf8");
const before = "  on conflict (credential_id, rate_window_key) do nothing;";
const after = "  on conflict on constraint model_gateway_rate_windows_pkey do nothing;";
if (!source.includes(before)) throw new Error("ws07_ambiguous_conflict_target_not_found");
if (source.indexOf(before) !== source.lastIndexOf(before)) throw new Error("ws07_ambiguous_conflict_target_not_unique");
const migration = [
  "-- Forward-only repair for the PL/pgSQL output-column namespace collision in 0077.",
  "-- The complete function is restated explicitly; migration 0077 remains immutable.",
  source.replace(before, after),
].join("\n");
await writeFile(targetPath, migration, { encoding: "utf8", flag: "wx" });
console.log(JSON.stringify({ status: "ok", target: targetPath, constraint: "model_gateway_rate_windows_pkey" }));
