#!/usr/bin/env node
/**
 * Build the local Hermes runtime image used by AMTECH profile containers.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const source = process.env.HERMES_AGENT_SOURCE ?? join(homedir(), ".hermes", "hermes-agent");
if (!existsSync(join(source, "Dockerfile"))) {
  console.error(`Hermes Dockerfile not found at ${source}`);
  process.exit(1);
}

const args = ["buildx", "build", "-t", process.env.HERMES_DOCKER_IMAGE ?? "hermes-agent", source, "--load"];
console.log(`docker ${args.join(" ")}`);
const child = spawn("docker", args, { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));

