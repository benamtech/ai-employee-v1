#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputPath = fileURLToPath(new URL("../src/server.generated.ts", import.meta.url));
let source = await readFile(outputPath, "utf8");

function replaceOne(needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0 || source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`production_server_stream_${label}_expected_exactly_once`);
  }
  source = source.slice(0, first) + replacement + source.slice(first + needle.length);
}

replaceOne(
  `    const assignmentId = authority.assignment.assignment_id;
    const pollMs = Number(process.env.WORK_STREAM_POLL_MS ?? 2000);`,
  `    const assignmentId = authority.assignment.assignment_id;
    const authorityVersionResult = await db.from("authority_versions")
      .select("current_version")
      .eq("scope_type", "employee_assignment")
      .eq("scope_id", assignmentId)
      .is("revoked_at", null)
      .maybeSingle();
    if (authorityVersionResult.error) throw authorityVersionResult.error;
    if (!authorityVersionResult.data?.current_version) {
      return c.json({ error: "assignment_authority_version_unavailable" }, 409);
    }
    const streamScope = {
      account_id: accountId,
      employee_id: employeeId,
      assignment_id: assignmentId,
      authority_version: String(authorityVersionResult.data.current_version),
    };
    const pollMs = Number(process.env.WORK_STREAM_POLL_MS ?? 2000);`,
  "authority_scope",
);
replaceOne(
  `        void writeSse({ event: "work_progress", data: JSON.stringify({ kind: "work_progress", ...p }) });`,
  `        const event = p.kind ?? "work_progress";
        void writeSse({ event, data: JSON.stringify({ ...streamScope, ...p, kind: event }) });`,
  "event_kind",
);
replaceOne(
  `        await writeSse({ event: "snapshot", data: JSON.stringify({ kind: "snapshot", snapshot }) });`,
  `        await writeSse({ event: "snapshot", data: JSON.stringify({ ...streamScope, kind: "snapshot", snapshot }) });`,
  "snapshot_scope",
);
replaceOne(
  `            await writeSse({ event: "work_event", data: JSON.stringify({ kind: "work_event", event }) });`,
  `            await writeSse({ event: "work_event", data: JSON.stringify({ ...streamScope, kind: "work_event", event }) });`,
  "work_event_scope",
);
replaceOne(
  `            await writeSse({ event: "approval_update", data: JSON.stringify({ kind: "approval_update", approval_id: approval.id, resolution: approval.resolution }) });`,
  `            await writeSse({ event: "approval_update", data: JSON.stringify({ ...streamScope, kind: "approval_update", approval_id: approval.id, resolution: approval.resolution }) });`,
  "approval_scope",
);

if (!source.includes('c.req.header("X-AMTECH-Owner-Session")')) {
  throw new Error("production_server_private_stream_header_missing");
}
const streamStart = source.indexOf("MANAGER_API.employeeStream");
const streamEnd = source.indexOf("// Dev-only owner", streamStart);
const streamBlock = source.slice(streamStart, streamEnd);
if (streamBlock.includes('c.req.query("owner_session_token")')) {
  throw new Error("production_server_stream_query_token_forbidden");
}
for (const marker of ["authority_versions", "streamScope", "authority_version", "assistant_delta", "run_completed"]) {
  if (!source.includes(marker)) throw new Error(`production_server_stream_marker_missing:${marker}`);
}
await writeFile(outputPath, source, "utf8");
console.log(JSON.stringify({
  status: "ok",
  output: outputPath,
  stream_events: "typed",
  stream_scope: "assignment-authority-version",
  owner_session_transport: "private_header",
}));
