#!/usr/bin/env node
// AMTECH PreToolUse guard for Edit|Write|NotebookEdit.
// - Hard-denies edits while on `main` (except .claude/** so the harness stays serviceable).
// - Warns (non-blocking) when editing mvp-build product source with no open repoctl transaction.
// Fail-open: any error allows the edit (prints nothing, exit 0).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function sh(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8", timeout: 8000, ...opts }).trim();
  } catch {
    return "";
  }
}
function pass() {
  process.exit(0);
}

try {
  let input = "";
  try { input = readFileSync(0, "utf8"); } catch {}
  let file = "";
  try {
    const j = JSON.parse(input);
    file = j.tool_input?.file_path || j.tool_input?.path || j.tool_input?.notebook_path || "";
  } catch {}
  if (!file) pass();

  const root = sh("git rev-parse --show-toplevel") || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const abs = resolve(root, file);
  if (abs !== root && !abs.startsWith(root + "/")) pass(); // outside repo — not our concern
  const rel = abs.slice(root.length + 1);
  const branch = sh("git rev-parse --abbrev-ref HEAD", { cwd: root }) || "unknown";

  const deny = (reason) => {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
    }));
    process.exit(0);
  };
  const warn = (msg) => {
    process.stdout.write(JSON.stringify({
      systemMessage: msg,
      hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: msg },
    }));
    process.exit(0);
  };

  if (branch === "main" && !rel.startsWith(".claude/")) {
    deny(`AMTECH contract: never edit on main. Create a task branch first (git switch -c task/<id> origin/main), then edit ${rel}.`);
  }

  if (/^mvp-build\/(apps|packages|infra|tests|scripts)\//.test(rel)) {
    let status = "?";
    try { status = JSON.parse(readFileSync(resolve(root, "mvp-build/decision/active.json"), "utf8")).status || "?"; } catch {}
    if (status === "no_open_decision_transaction") {
      warn(
        `AMTECH contract: editing product source (${rel}) with no open repoctl transaction. ` +
        `Non-mechanical work must run 'cd mvp-build && node decision/engine/repoctl.mjs start --task <task.json> --out decision/<trace>' ` +
        `and admit a plan before source edits. If this change is purely mechanical, proceed.`
      );
    }
  }

  pass();
} catch {
  pass();
}
