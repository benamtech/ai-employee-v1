#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const path = "mvp-build/tests/unit/production-boundary-source.test.ts";
let source = await readFile(path, "utf8");

const oldRead = '    const generator = await source("apps/manager/scripts/generate-production-server.mjs");';
const newRead = '    const managerServer = await source("apps/manager/src/server.ts");';
const oldAssertions = [
  '    expect(generator).toContain(\'c.req.header("X-AMTECH-Owner-Session")\');',
  '    expect(generator).toContain(\'"owner_stream_session_header"\');',
].join("\n");
const newAssertions = [
  '    expect(managerServer).toContain(\'c.req.header("X-AMTECH-Owner-Session")\');',
  '    expect(managerServer).toContain(\'"owner_stream_session_header"\');',
  '    expect(managerServer).not.toContain("server.generated");',
].join("\n");

if (!source.includes(oldRead)) throw new Error("generator_read_contract_not_found");
if (!source.includes(oldAssertions)) throw new Error("generator_assertion_contract_not_found");
source = source.replace(oldRead, newRead).replace(oldAssertions, newAssertions);
await writeFile(path, source, "utf8");
console.log(JSON.stringify({ status: "ok", path, direct_source: "apps/manager/src/server.ts" }));
