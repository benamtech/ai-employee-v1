#!/usr/bin/env node
import { existsSync } from "node:fs";
import { run } from "./_lib.mjs";

const steps = [
  ["env", ["node", "infra/scripts/local/acceptance/01-env.mjs"]],
  ["services", ["node", "infra/scripts/local/acceptance/02-services.mjs"]],
];

if (!existsSync("infra/.local/state.json")) {
  steps.push(["bootstrap", ["node", "infra/scripts/local/bootstrap.mjs"]]);
}

steps.push(
  ["runtime", ["node", "infra/scripts/local/acceptance/03-runtime.mjs"]],
  ["chat", ["node", "infra/scripts/local/acceptance/04-chat.mjs"]],
  ["browser", ["node", "infra/scripts/local/acceptance/05-browser.mjs"]],
);

for (const [name, [cmd, ...args]] of steps) {
  console.log(`\n== ${name} ==`);
  const res = run(cmd, args, { stdio: "pipe" });
  if (res.out) console.log(res.out);
  if (!res.ok) process.exitCode = 1;
  if (!res.ok && process.env.LOCAL_ACCEPTANCE_CONTINUE !== "1") break;
}

