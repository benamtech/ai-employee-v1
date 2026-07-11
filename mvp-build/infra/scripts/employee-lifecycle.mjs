#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const [action, employeeId] = process.argv.slice(2);

function run(args, opts = {}) {
  const res = spawnSync("docker", args, { encoding: "utf8", ...opts });
  if (res.status !== 0) {
    const msg = `${res.stdout ?? ""}${res.stderr ?? ""}`.trim();
    throw new Error(msg || `docker ${args.join(" ")} failed`);
  }
  return String(res.stdout ?? "").trim();
}

function requireEmployee() {
  if (!employeeId) {
    console.error("employee-lifecycle: employee id required");
    process.exit(2);
  }
}

function containerName(id) {
  return `amtech-hermes-${id}`;
}

function containersByState(state) {
  return run([
    "ps",
    "-a",
    "--filter", "label=com.amtech.kind=employee-runtime",
    "--filter", `status=${state}`,
    "--format", "{{.Names}}",
  ]).split("\n").map((s) => s.trim()).filter(Boolean);
}

try {
  if (!action || action === "help" || action === "--help") {
    console.log("Usage: node infra/scripts/employee-lifecycle.mjs <inspect|restart|stop|gc> [employee_id]");
    process.exit(0);
  }

  if (action === "inspect") {
    requireEmployee();
    const out = run(["inspect", containerName(employeeId), "--format", "{{json .State}}"]);
    console.log(out);
  } else if (action === "restart") {
    requireEmployee();
    const name = containerName(employeeId);
    run(["restart", name]);
    console.log(`restarted:${name}`);
  } else if (action === "stop") {
    requireEmployee();
    const name = containerName(employeeId);
    run(["stop", name]);
    console.log(`stopped:${name}`);
  } else if (action === "gc") {
    const stopped = [...containersByState("exited"), ...containersByState("created"), ...containersByState("dead")];
    for (const name of stopped) run(["rm", name]);
    console.log(`gc_removed:${stopped.length}`);
  } else {
    console.error(`employee-lifecycle: unknown action ${action}`);
    process.exit(2);
  }
} catch (err) {
  console.error(`employee-lifecycle: ${String(err?.message ?? err)}`);
  process.exit(1);
}
