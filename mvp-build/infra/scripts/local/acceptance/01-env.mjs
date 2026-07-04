#!/usr/bin/env node
import { existsSync } from "node:fs";
import { printResult, requiredEnv, run } from "./_lib.mjs";

function checkEnv(name) {
  try {
    requiredEnv(name);
    printResult(name, true, "set");
  } catch (err) {
    printResult(name, false, err.message);
  }
}

for (const name of [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "MANAGER_INTERNAL_TOKEN",
  "PROVISIONER_TOKEN",
  "SECRET_REF_MASTER_KEY",
  "SIGNING_SECRET",
  "HERMES_RUNTIME_COMMAND",
]) checkEnv(name);

printResult("PROVISIONER_SKIP_SMS", process.env.PROVISIONER_SKIP_SMS === "1" || process.env.PROVISIONER_SKIP_SMS === "true", "must be enabled for local no-SMS");
printResult("HERMES_BACKEND_TYPE", process.env.HERMES_BACKEND_TYPE === "docker", process.env.HERMES_BACKEND_TYPE ?? "missing");
printResult(".env", existsSync(".env"), ".env present");

const docker = run("docker", ["ps"]);
printResult("docker ps", docker.ok, docker.ok ? "daemon reachable" : docker.out);
const caddy = run("caddy", ["version"]);
printResult("caddy", caddy.ok, caddy.ok ? caddy.out : caddy.out || "missing");

