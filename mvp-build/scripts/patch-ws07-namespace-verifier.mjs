#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const path = "mvp-build/infra/scripts/acceptance/verify-commercial-effect-migrations.mjs";
let source = await readFile(path, "utf8");

const migrationBefore = '    "0077_ws07_database_owned_rate_windows.sql",\n  ];';
const migrationAfter = '    "0077_ws07_database_owned_rate_windows.sql",\n    "0078_ws07_rate_window_namespace_fix.sql",\n  ];';
if (!source.includes(migrationBefore)) throw new Error("ws07_verifier_migration_anchor_missing");
source = source.replace(migrationBefore, migrationAfter);

const checkAnchor = [
  '  check(',
  '    "metadata_safe_gateway_replay",',
].join("\n");
const namespaceCheck = [
  '  check(',
  '    "rate_window_conflict_namespace_qualified",',
  '    /on conflict on constraint model_gateway_rate_windows_pkey/i.test(admissionSource),',
  '    "RETURNS TABLE output names cannot collide with the rate-window conflict target",',
  '  );',
  '',
  checkAnchor,
].join("\n");
if (!source.includes(checkAnchor)) throw new Error("ws07_verifier_metadata_check_anchor_missing");
source = source.replace(checkAnchor, namespaceCheck);

await writeFile(path, source, "utf8");
console.log(JSON.stringify({ status: "ok", path, migration: "0078", constraint: "model_gateway_rate_windows_pkey" }));
