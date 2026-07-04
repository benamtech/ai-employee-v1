#!/usr/bin/env node
/**
 * Terminal chat with a local employee — the same owner-message path the Work
 * Surface uses (Manager → deliverOwnerTurnToRuntime → executeHermesTurn → Hermes).
 *
 * Usage:
 *   one-shot:  OWNER_SESSION_TOKEN=... EMPLOYEE_ID=... node infra/scripts/local/chat.mjs "your message"
 *   REPL:      OWNER_SESSION_TOKEN=... EMPLOYEE_ID=... node infra/scripts/local/chat.mjs
 * MANAGER_INTERNAL_TOKEN must match the Manager's (or leave both unset in dev).
 */
import readline from "node:readline";

const MANAGER = (process.env.MANAGER_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const INTERNAL = process.env.MANAGER_INTERNAL_TOKEN;
const token = process.env.OWNER_SESSION_TOKEN;
const emp = process.env.EMPLOYEE_ID;

if (!token || !emp) {
  console.error("Set OWNER_SESSION_TOKEN and EMPLOYEE_ID (see bootstrap.mjs output).");
  process.exit(1);
}

async function send(message) {
  const res = await fetch(`${MANAGER}/manager/employee/${emp}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(INTERNAL ? { Authorization: `Bearer ${INTERNAL}` } : {}) },
    body: JSON.stringify({ owner_session_token: token, message }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function printReply(r) {
  if (r.json.reply) console.log("\nagent>", r.json.reply, "\n");
  else console.log(`\nagent> [no reply — status ${r.json.status ?? r.status}] ${r.json.error ?? JSON.stringify(r.json)}\n`);
}

const arg = process.argv.slice(2).join(" ").trim();
if (arg) {
  printReply(await send(arg));
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "you> " });
console.log(`Chatting with ${emp} via ${MANAGER}. Ctrl+C to exit.`);
rl.prompt();
rl.on("line", async (line) => {
  const msg = line.trim();
  if (!msg) return rl.prompt();
  try { printReply(await send(msg)); } catch (e) { console.error("send failed:", e.message); }
  rl.prompt();
});
