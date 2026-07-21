#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const boundaryPath = "mvp-build/tests/unit/production-boundary-source.test.ts";
let boundary = await readFile(boundaryPath, "utf8");
const stale = '    expect(managerServer).toContain("subscribeProgress({");';
const current = '    expect(managerServer).toContain("subscribeProgress(streamScope");';
if (!boundary.includes(stale)) throw new Error("stale_stream_subscription_assertion_not_found");
boundary = boundary.replace(stale, current);
await writeFile(boundaryPath, boundary, "utf8");

const packagePath = "mvp-build/package.json";
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
const script = String(pkg.scripts?.["test:production-boundary"] ?? "");
const anchor = "tests/unit/ws02-hardening-regressions.test.ts";
const addition = "tests/unit/protocol-projection-authority.test.ts";
if (!script.includes(anchor)) throw new Error("production_boundary_ws02_anchor_missing");
if (!script.includes(addition)) {
  pkg.scripts["test:production-boundary"] = script.replace(anchor, `${anchor} ${addition}`);
}
await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ status: "ok", focused_test: addition }));
