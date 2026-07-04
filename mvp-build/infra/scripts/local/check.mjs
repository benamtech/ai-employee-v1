#!/usr/bin/env node
/**
 * Local stack readiness check. This is intentionally host-facing: run it from
 * the shell that has the refreshed docker group.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function run(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: "utf8" });
  return {
    ok: res.status === 0,
    status: res.status,
    out: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim(),
  };
}

function check(name, fn) {
  const result = fn();
  const mark = result.ok ? "ok" : "blocked";
  console.log(`${mark.padEnd(8)} ${name}${result.detail ? ` - ${result.detail}` : ""}`);
  if (!result.ok) process.exitCode = 1;
}

const root = process.cwd();

check("docker socket", () => {
  const res = run("docker", ["ps"]);
  return { ok: res.ok, detail: res.ok ? "daemon reachable" : res.out || "docker ps failed" };
});

check("docker buildx", () => {
  const res = run("docker", ["buildx", "version"]);
  return { ok: res.ok, detail: res.ok ? res.out.split("\n")[0] : res.out || "docker buildx missing" };
});

check("hermes image", () => {
  const res = run("docker", ["image", "inspect", "hermes-agent"]);
  return { ok: res.ok, detail: res.ok ? "hermes-agent image exists" : "run npm run local:build-hermes" };
});

check("caddy", () => {
  const res = run("caddy", ["version"]);
  return { ok: res.ok, detail: res.ok ? res.out : "install caddy for VPS-faithful proxy tests" };
});

check("env file", () => {
  return { ok: existsSync(join(root, ".env")), detail: existsSync(join(root, ".env")) ? ".env present" : "copy .env.local.example to .env" };
});

check("supabase url", () => {
  return { ok: Boolean(process.env.SUPABASE_URL), detail: process.env.SUPABASE_URL ? "set" : "source .env before running" };
});

check("supabase service role", () => {
  return { ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("PASTE")), detail: "required for local bootstrap" };
});

check("database url", () => {
  return { ok: Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("PASTE")), detail: "required for migrations" };
});

check("runtime command", () => {
  return { ok: Boolean(process.env.HERMES_RUNTIME_COMMAND), detail: process.env.HERMES_RUNTIME_COMMAND || "missing" };
});

check("runtime backend", () => {
  return { ok: process.env.HERMES_BACKEND_TYPE === "docker", detail: process.env.HERMES_BACKEND_TYPE || "missing" };
});
