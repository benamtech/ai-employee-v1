#!/usr/bin/env node
/**
 * Agent side of the model bridge. Lets the Claude Code agent read the oldest
 * parked model request and post a completion, becoming the model.
 *
 *   node infra/scripts/local/model-bridge-agent.mjs next          # show oldest parked request
 *   node infra/scripts/local/model-bridge-agent.mjs next --raw    # full messages JSON
 *   node infra/scripts/local/model-bridge-agent.mjs answer <id> --file <path>   # answer from a file
 *   node infra/scripts/local/model-bridge-agent.mjs peek          # count + ids only
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "infra", ".local", "model-bridge");
const PENDING = join(ROOT, "pending");
const ANSWERS = join(ROOT, "answers");
const [cmd, ...rest] = process.argv.slice(2);

function pendingIdsOldestFirst() {
  if (!existsSync(PENDING)) return [];
  return readdirSync(PENDING).filter((f) => f.endsWith(".json"))
    .sort() // ids are `<ms>-<counter>` so lexical sort ≈ chronological for same-day runs
    .map((f) => f.replace(/\.json$/, ""));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (cmd === "peek") {
  const ids = pendingIdsOldestFirst();
  console.log(JSON.stringify({ pending: ids.length, ids }, null, 2));
} else if (cmd === "next") {
  let ids = pendingIdsOldestFirst();
  // --wait [secs]: block (node-side, no shell sleep) until a request parks, so a
  // model-worker subagent can sit idle waiting for the next user message.
  if (!ids.length && rest.includes("--wait")) {
    const wi = rest.indexOf("--wait");
    const secs = Number(rest[wi + 1]) > 0 ? Number(rest[wi + 1]) : 55;
    const deadline = Date.now() + secs * 1000;
    while (Date.now() < deadline && !ids.length) {
      await sleep(300);
      ids = pendingIdsOldestFirst();
    }
  }
  if (!ids.length) { console.log("NONE"); process.exit(0); }
  const id = ids[0];
  const parked = JSON.parse(readFileSync(join(PENDING, `${id}.json`), "utf8"));
  const raw = rest.includes("--raw");
  console.log(`ID: ${id}`);
  console.log(`MODEL: ${parked.model}`);
  console.log(`MESSAGES (${parked.body?.messages?.length ?? 0}):`);
  for (const m of parked.body?.messages ?? []) {
    console.log(`\n----- ${m.role} -----`);
    console.log(raw ? JSON.stringify(m.content) : String(m.content));
  }
  if (parked.body?.response_format) {
    console.log(`\nRESPONSE_FORMAT: ${JSON.stringify(parked.body.response_format).slice(0, 200)}${JSON.stringify(parked.body.response_format).length > 200 ? "…(schema truncated)" : ""}`);
  }
} else if (cmd === "answer") {
  const id = rest[0];
  const fileIdx = rest.indexOf("--file");
  if (!id || fileIdx < 0 || !rest[fileIdx + 1]) { console.error("usage: answer <id> --file <path>"); process.exit(1); }
  if (!existsSync(join(PENDING, `${id}.json`))) { console.error(`no parked request ${id} (already answered/expired?)`); process.exit(1); }
  const content = readFileSync(rest[fileIdx + 1], "utf8");
  writeFileSync(join(ANSWERS, `${id}.json`), content);
  console.log(`answered ${id} (${content.length} bytes)`);
} else {
  console.error("commands: next [--raw] | answer <id> --file <path> | peek");
  process.exit(1);
}
