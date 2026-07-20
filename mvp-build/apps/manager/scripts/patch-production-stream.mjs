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
  `      const unsub = subscribeProgress(employeeId, (p) => {`,
  `      const unsub = subscribeProgress(streamScope, (p) => {`,
  "assignment_subscription",
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

replaceOne(
  `        if (!authority.ok) return c.json({ error: authority.reason }, authority.status);
        options = {`,
  `        if (!authority.ok) return c.json({ error: authority.reason }, authority.status);
        const protocolAssignmentId = String(input.protocol_assignment_id ?? "");
        const protocolAuthorityVersion = String(input.protocol_authority_version ?? "");
        if (protocolAssignmentId || protocolAuthorityVersion) {
          if (!protocolAssignmentId || !protocolAuthorityVersion) {
            return c.json({ error: "protocol_authority_incomplete" }, 400);
          }
          if (protocolAssignmentId !== authority.assignment.assignment_id) {
            return c.json({ error: "protocol_assignment_mismatch" }, 409);
          }
          const version = await db.from("authority_versions")
            .select("current_version")
            .eq("scope_type", "employee_assignment")
            .eq("scope_id", authority.assignment.assignment_id)
            .is("revoked_at", null)
            .maybeSingle();
          if (version.error) throw version.error;
          if (String(version.data?.current_version ?? "") !== protocolAuthorityVersion) {
            return c.json({ error: "protocol_authority_version_stale" }, 409);
          }
        }
        options = {`,
  "approval_protocol_authority",
);
replaceOne(
  `    const { owner_session_token, message, intent_id } = await c.req.json().catch(() => ({}));`,
  `    const { owner_session_token, message, intent_id, protocol_assignment_id, protocol_authority_version } = await c.req.json().catch(() => ({}));`,
  "owner_protocol_input",
);
replaceOne(
  `    const assignmentId = authority.assignment.assignment_id;
    const policyVersion = await loadOwnerCommandPolicyVersion(db, session, assignmentId);`,
  `    const assignmentId = authority.assignment.assignment_id;
    const protocolAssignmentId = String(protocol_assignment_id ?? "");
    const protocolAuthorityVersion = String(protocol_authority_version ?? "");
    if (protocolAssignmentId || protocolAuthorityVersion) {
      if (!protocolAssignmentId || !protocolAuthorityVersion) {
        return c.json({ error: "protocol_authority_incomplete" }, 400);
      }
      if (protocolAssignmentId !== assignmentId) {
        return c.json({ error: "protocol_assignment_mismatch" }, 409);
      }
      const version = await db.from("authority_versions")
        .select("current_version")
        .eq("scope_type", "employee_assignment")
        .eq("scope_id", assignmentId)
        .is("revoked_at", null)
        .maybeSingle();
      if (version.error) throw version.error;
      if (String(version.data?.current_version ?? "") !== protocolAuthorityVersion) {
        return c.json({ error: "protocol_authority_version_stale" }, 409);
      }
    }
    const policyVersion = await loadOwnerCommandPolicyVersion(db, session, assignmentId);`,
  "owner_protocol_authority",
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
for (const marker of [
  "authority_versions",
  "streamScope",
  "authority_version",
  "const event = p.kind",
  "subscribeProgress(streamScope",
  "protocol_assignment_mismatch",
  "protocol_authority_version_stale",
]) {
  if (!source.includes(marker)) throw new Error(`production_server_stream_marker_missing:${marker}`);
}
await writeFile(outputPath, source, "utf8");
console.log(JSON.stringify({
  status: "ok",
  output: outputPath,
  stream_events: "typed",
  stream_scope: "account-employee-assignment-authority-version",
  protocol_actions: "current-assignment-authority-version",
  owner_session_transport: "private_header",
}));
