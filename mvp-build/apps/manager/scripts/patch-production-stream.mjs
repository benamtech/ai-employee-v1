#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputPath = fileURLToPath(new URL("../src/server.generated.ts", import.meta.url));
const source = await readFile(outputPath, "utf8");
const needle = `        void writeSse({ event: "work_progress", data: JSON.stringify({ kind: "work_progress", ...p }) });`;
const replacement = `        const event = p.kind ?? "work_progress";
        void writeSse({ event, data: JSON.stringify({ ...p, kind: event }) });`;
const first = source.indexOf(needle);
if (first < 0 || source.indexOf(needle, first + needle.length) >= 0) {
  throw new Error("production_server_stream_event_transform_expected_exactly_once");
}
const next = source.slice(0, first) + replacement + source.slice(first + needle.length);
if (!next.includes('c.req.header("X-AMTECH-Owner-Session")')) {
  throw new Error("production_server_private_stream_header_missing");
}
if (next.includes('c.req.query("owner_session_token")') && next.includes("employeeStream")) {
  // Other command-status routes may still use query tokens; the employee SSE route may not.
  const streamStart = next.indexOf("MANAGER_API.employeeStream");
  const streamEnd = next.indexOf("// Dev-only owner", streamStart);
  if (next.slice(streamStart, streamEnd).includes('c.req.query("owner_session_token")')) {
    throw new Error("production_server_stream_query_token_forbidden");
  }
}
await writeFile(outputPath, next, "utf8");
console.log(JSON.stringify({ status: "ok", output: outputPath, stream_events: "typed", owner_session_transport: "private_header" }));
