#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const path = "mvp-build/apps/manager/src/server.ts";
let source = await readFile(path, "utf8");

function replaceOne(before, after, label) {
  const first = source.indexOf(before);
  if (first < 0 || source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`typed_protocol_patch_${label}_expected_exactly_once`);
  }
  source = source.slice(0, first) + after + source.slice(first + before.length);
}

replaceOne(
  'import { authorizeOwnerAssignment, listOwnerAssignments, loadOwnerCommandPolicyVersion } from "./lib/owner-assignment-authority.js";',
  [
    'import { authorizeOwnerAssignment, listOwnerAssignments, loadOwnerCommandPolicyVersion } from "./lib/owner-assignment-authority.js";',
    'import { loadCurrentAssignmentAuthorityVersion, validateProjectedProtocolAuthority } from "./lib/protocol-projection-authority.js";',
  ].join("\n"),
  "import",
);

replaceOne(
  `        if (!authority.ok) return c.json({ error: authority.reason }, authority.status);
        options = {`,
  `        if (!authority.ok) return c.json({ error: authority.reason }, authority.status);
        const protocolAuthority = await validateProjectedProtocolAuthority(
          db,
          authority.assignment.assignment_id,
          {
            protocol_assignment_id: input.protocol_assignment_id,
            protocol_authority_version: input.protocol_authority_version,
          },
        );
        if (!protocolAuthority.ok) {
          return c.json({ error: protocolAuthority.error }, protocolAuthority.status);
        }
        options = {`,
  "approval",
);

replaceOne(
  `    const { owner_session_token, message, intent_id } = await c.req.json().catch(() => ({}));`,
  `    const {
      owner_session_token,
      message,
      intent_id,
      protocol_assignment_id,
      protocol_authority_version,
    } = await c.req.json().catch(() => ({}));`,
  "owner_input",
);

replaceOne(
  `    const assignmentId = authority.assignment.assignment_id;
    const policyVersion = await loadOwnerCommandPolicyVersion(db, session, assignmentId);`,
  `    const assignmentId = authority.assignment.assignment_id;
    const protocolAuthority = await validateProjectedProtocolAuthority(db, assignmentId, {
      protocol_assignment_id,
      protocol_authority_version,
    });
    if (!protocolAuthority.ok) {
      return c.json({ error: protocolAuthority.error }, protocolAuthority.status);
    }
    const policyVersion = await loadOwnerCommandPolicyVersion(db, session, assignmentId);`,
  "owner_authority",
);

replaceOne(
  `    const accountId = session.account_id;
    const assignmentId = authority.assignment.assignment_id;
    const pollMs = Number(process.env.WORK_STREAM_POLL_MS ?? 2000);`,
  `    const accountId = session.account_id;
    const assignmentId = authority.assignment.assignment_id;
    const authorityVersion = await loadCurrentAssignmentAuthorityVersion(db, assignmentId);
    if (!authorityVersion) {
      return c.json({ error: "assignment_authority_version_unavailable" }, 409);
    }
    const streamScope = {
      account_id: accountId,
      employee_id: employeeId,
      assignment_id: assignmentId,
      authority_version: authorityVersion,
    };
    const pollMs = Number(process.env.WORK_STREAM_POLL_MS ?? 2000);`,
  "stream_scope",
);

replaceOne(
  `      const unsub = subscribeProgress({
        account_id: accountId,
        employee_id: employeeId,
        assignment_id: assignmentId,
      }, (p) => {
        void writeSse({ event: "work_progress", data: JSON.stringify({ kind: "work_progress", ...p }) });
      });`,
  `      const unsub = subscribeProgress(streamScope, (p) => {
        const event = p.kind ?? "work_progress";
        void writeSse({ event, data: JSON.stringify({ ...streamScope, ...p, kind: event }) });
      });`,
  "stream_progress",
);

replaceOne(
  `        const snapshot = await buildEmployeeSnapshot(db, employeeId, accountId, assignmentId);
        await writeSse({ event: "snapshot", data: JSON.stringify({ kind: "snapshot", snapshot }) });
        let cursor = cursorFromSnapshot(snapshot);`,
  `        const snapshot = await buildEmployeeSnapshot(db, employeeId, accountId, assignmentId);
        let cursor = cursorFromSnapshot(snapshot);
        await writeSse({
          event: "snapshot",
          data: JSON.stringify({ ...streamScope, kind: "snapshot", snapshot, cursor }),
        });`,
  "stream_snapshot",
);

replaceOne(
  `            await writeSse({ event: "work_event", data: JSON.stringify({ kind: "work_event", event }) });`,
  `            await writeSse({
              event: "work_event",
              data: JSON.stringify({ ...streamScope, kind: "work_event", event }),
            });`,
  "stream_work_event",
);

replaceOne(
  `            await writeSse({ event: "approval_update", data: JSON.stringify({ kind: "approval_update", approval_id: approval.id, resolution: approval.resolution }) });`,
  `            await writeSse({
              event: "approval_update",
              data: JSON.stringify({
                ...streamScope,
                kind: "approval_update",
                approval_id: approval.id,
                resolution: approval.resolution,
              }),
            });`,
  "stream_approval",
);

await writeFile(path, source, "utf8");
console.log(JSON.stringify({
  status: "ok",
  path,
  protocol_actions: "current_assignment_authority_version",
  stream_scope: "account_employee_assignment_authority_version",
}));
