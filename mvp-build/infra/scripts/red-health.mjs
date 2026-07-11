#!/usr/bin/env node

import { Client } from "pg";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hostname } from "node:os";

(function loadEnv() {
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
    for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // rely on ambient env
  }
})();

const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const windowMinutes = Number(process.env.RED_HEALTH_WINDOW_MINUTES ?? 30);
const maxRed = Number(process.env.RED_HEALTH_MAX_RED ?? 0);

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

async function latestHealth(client) {
  const sql = `
    with ranked as (
      select
        rh.*,
        row_number() over (partition by rh.employee_id order by rh.checked_at desc) as rn
      from runtime_health_checks rh
      where rh.checked_at > now() - ($1::int * interval '1 minute')
    )
    select employee_id, account_id, backend_type, status, checked_at, details
    from ranked
    where rn = 1
    order by checked_at desc
  `;
  return (await client.query(sql, [windowMinutes])).rows;
}

function writeProof(body) {
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `red-health-${stamp()}.json`);
  writeFileSync(path, JSON.stringify(body, null, 2));
  console.log(`proof_json:${path}`);
}

try {
  const client = await db();
  const rows = await latestHealth(client);
  await client.end();
  const red = rows.filter((r) => !["healthy", "ok"].includes(String(r.status)));
  const proof = {
    kind: "red_health",
    status: red.length > maxRed ? "fail" : "pass",
    checked_at: new Date().toISOString(),
    host: hostname(),
    window_minutes: windowMinutes,
    max_red: maxRed,
    checked: rows.length,
    red_count: red.length,
    red: red.map((r) => ({
      employee_id: r.employee_id,
      account_id: r.account_id,
      status: r.status,
      checked_at: r.checked_at,
      backend_type: r.backend_type,
      details: r.details,
    })),
  };
  console.log(`${proof.status === "pass" ? "PASS" : "FAIL"} red-health checked:${proof.checked} red:${proof.red_count}`);
  writeProof(proof);
  if (proof.status !== "pass") process.exit(1);
} catch (err) {
  const proof = {
    kind: "red_health",
    status: "fail",
    checked_at: new Date().toISOString(),
    host: hostname(),
    error: String(err?.message ?? err),
  };
  console.error(`FAIL red-health ${proof.error}`);
  writeProof(proof);
  process.exit(1);
}
