#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const path = "mvp-build/tests/unit/production-boundary-source.test.ts";
let source = await readFile(path, "utf8");
const before = [
  "    expect(managerServer).toContain('c.req.header(\"X-AMTECH-Owner-Session\")');",
  "    expect(managerServer).toContain('\"owner_stream_session_header\"');",
  "    expect(managerServer).not.toContain(\"server.generated\");",
].join("\n");
const after = [
  "    expect(managerServer).toContain('c.req.header(\"X-AMTECH-Owner-Session\")');",
  "    expect(managerServer).toContain('action: \"stream:read\"');",
  "    expect(managerServer).toContain(\"const assignmentId = authority.assignment.assignment_id\");",
  "    expect(managerServer).toContain(\"subscribeProgress({\");",
  "    expect(managerServer).toContain(\"assignment_id: assignmentId\");",
  "    expect(managerServer).not.toContain(\"owner_session_token=\");",
  "    expect(managerServer).not.toContain(\"server.generated\");",
].join("\n");
if (!source.includes(before)) throw new Error("stale_owner_stream_contract_not_found");
source = source.replace(before, after);
await writeFile(path, source, "utf8");
console.log(JSON.stringify({ status: "ok", path, contract: "header_authorized_assignment_scoped_stream" }));
