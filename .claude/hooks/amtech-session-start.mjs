#!/usr/bin/env node
// AMTECH SessionStart hook: canonical orientation, injected into model context.
// Fail-open: any error prints "{}" so a session is never wedged.
// Mirrors mvp-build/decision/SESSION_ONBOARDING.md — the repo owns the contract; this only surfaces it.
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function sh(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8", timeout: 8000, ...opts }).trim();
  } catch {
    return "";
  }
}
function ok(cmd, opts = {}) {
  try {
    execSync(cmd, { stdio: "ignore", timeout: 8000, ...opts });
    return true;
  } catch {
    return false;
  }
}

try {
  const root = sh("git rev-parse --show-toplevel") || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const g = { cwd: root };
  const branch = sh("git rev-parse --abbrev-ref HEAD", g) || "unknown";
  const sha = sh("git rev-parse --short HEAD", g) || "unknown";
  const tree = sh("git status --porcelain", g) ? "dirty" : "clean";

  let relation;
  if (!ok("git rev-parse --verify origin/main", g)) relation = "unknown (no local origin/main ref — run: git fetch origin)";
  else if (ok("git merge-base --is-ancestor origin/main HEAD", g)) relation = "at-or-ahead of origin/main";
  else if (ok("git merge-base --is-ancestor HEAD origin/main", g)) relation = "ALREADY MERGED into origin/main — NOT a fresh task branch";
  else relation = "DIVERGED from origin/main";

  const mvp = resolve(root, "mvp-build");
  const engine = existsSync(resolve(mvp, "decision/engine/repoctl.mjs"));
  const repoctl = (sub) => {
    try {
      const out = execSync(`node decision/engine/repoctl.mjs ${sub}`, {
        cwd: mvp, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 25000,
      });
      return JSON.parse(out).ok ? "ok" : "FAIL";
    } catch {
      return "error";
    }
  };
  const doctor = engine ? repoctl("doctor") : "n/a";
  const selftest = engine ? repoctl("self-test") : "n/a";

  let status = "unknown", next = "unknown", latest = "unknown";
  try {
    const a = JSON.parse(readFileSync(resolve(mvp, "decision/active.json"), "utf8"));
    status = a.status || "?";
    next = a.next_transaction?.reserved_id || "?";
    latest = a.latest_completed_trace?.id || "?";
  } catch {}

  const ctx = [
    "# AMTECH session orientation (auto-injected by .claude SessionStart hook)",
    "",
    `Root: ${root}`,
    `Branch: ${branch} @ ${sha} (worktree ${tree})`,
    `origin/main relation: ${relation}`,
    `repoctl doctor: ${doctor} · self-test: ${selftest}`,
    `Decision state: ${status} · latest completed: ${latest} · next reserved: ${next}`,
    "",
    "Authority chain — read in order before non-mechanical work:",
    "identity.md → AGENTS.md → CONTRIBUTING.md → CODEGRAPH.md → mvp-build/AGENTS.md → mvp-build/authority-map.json → mvp-build/CODEGRAPH.md → mvp-build/STANDARD.md → mvp-build/decision/active.json → mvp-build/decision/README.md → mvp-build/production-readiness-program/README.md → mvp-build/memory/MEMORY.md",
    "",
    "Non-bypassable working rules:",
    "- Never edit on main. Branch first: git switch -c task/<id> origin/main.",
    "- Every non-mechanical mvp-build change runs the experiment compiler BEFORE source edits:",
    "    cd mvp-build && node decision/engine/repoctl.mjs start --task <task.json> --out decision/<trace>",
    "  then admit-plan → implement inside the maximum patch → evaluate → finish → verify --phase finished.",
    "- Evidence never self-promotes: P0<P1<P2<P3<P4. Source≠CI≠provider≠production. Record unavailable gates as blockers, never passes.",
    "- Do not weaken tests, hide blockers, reset user work, or broaden evidence beyond the boundary exercised.",
    "- Retrieve context via repoctl query {authority|impact|invariants|proofs|effects|evidence} instead of blind file dumps.",
  ].join("\n");

  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: ctx } }));
} catch {
  process.stdout.write("{}");
}
