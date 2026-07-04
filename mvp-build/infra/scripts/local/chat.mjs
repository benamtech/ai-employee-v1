#!/usr/bin/env node
/**
 * Send one owner web-chat turn to the locally provisioned employee.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const statePath = join(process.cwd(), "infra", ".local", "state.json");

async function loadState() {
  return JSON.parse(await readFile(statePath, "utf8"));
}

function managerBase(state) {
  return (process.env.MANAGER_BASE_URL ?? process.env.MANAGER_API_ORIGIN ?? state.manager_base_url ?? "http://localhost:8080").replace(/\/$/, "");
}

async function main() {
  const message = process.argv.slice(2).join(" ").trim();
  if (!message) throw new Error('Usage: npm run local:chat -- "message to employee"');

  const state = await loadState();
  const employeeId = process.env.LOCAL_EMPLOYEE_ID ?? state.employee_id;
  const ownerSessionToken = process.env.LOCAL_OWNER_SESSION_TOKEN ?? state.owner_session_token;
  const token = process.env.MANAGER_INTERNAL_TOKEN;

  const res = await fetch(`${managerBase(state)}/manager/employee/${employeeId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ owner_session_token: ownerSessionToken, message }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`chat failed ${res.status}: ${JSON.stringify(json)}`);
  console.log(JSON.stringify(json, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
