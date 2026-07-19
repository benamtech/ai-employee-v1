#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = async (path) => readFile(resolve(root, path), "utf8");
const failures = [];
const passes = [];

function check(id, condition, detail) {
  if (condition) passes.push({ id, detail });
  else failures.push({ id, detail });
}

function containsAll(source, values) {
  return values.every((value) => source.toLowerCase().includes(value.toLowerCase()));
}

function containsNone(source, values) {
  return values.every((value) => !source.toLowerCase().includes(value.toLowerCase()));
}

const [
  design,
  agentStandard,
  validationStandard,
  globals,
  layout,
  agentSurface,
  workObject,
  review,
  mcpUi,
  estimator,
  onboarding,
  provisionRoute,
] = await Promise.all([
  read("../docs/AMTECH_WEB_DESIGN_SYSTEM.md"),
  read("../docs/AMTECH_AGENT_INTERFACE_STANDARD.md"),
  read("../docs/AMTECH_UI_VALIDATION_STANDARD.md"),
  read("apps/web/app/globals.css"),
  read("apps/web/app/layout.tsx"),
  read("apps/web/app/agent/[employeeId]/AgentSurface.tsx"),
  read("apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx"),
  read("apps/web/app/agent/[employeeId]/review/ReviewClient.tsx"),
  read("apps/web/app/agent/[employeeId]/components/McpUiResource.tsx"),
  read("apps/web/app/free-estimator/FreeEstimatorClient.tsx"),
  read("apps/web/app/create-ai-employee/CreateClient.tsx"),
  read("apps/web/app/api/front-door/provision/route.ts"),
]);

check("G0-01", containsAll(design + agentStandard + validationStandard, [
  "status:** canonical",
  "ag-ui",
  "mcp apps",
  "pass/fail",
]), "canonical design, agent-interface, and validation standards exist");

check("G0-02", containsAll(design, ["historical 369", "non-canonical"]), "obsolete UI doctrines are explicitly superseded");

check("G1-01", containsAll(globals, [
  "--amtech-ink: #111111",
  "--amtech-white: #ffffff",
  "--amtech-canvas: #f7f9fc",
  "--amtech-red: #e11d2a",
  "--amtech-blue: #2563eb",
  "--amtech-cyan: #dff6ff",
  "--amtech-green: #168a57",
]), "canonical palette is implemented in runtime tokens");

check("G1-02", containsNone(globals + agentSurface + workObject + review, [
  "prefers-color-scheme: dark",
  "background: #0a0a0a",
  "background:#0a0a0a",
]), "critical product surfaces stay light");

check("G1-03", containsNone(agentSurface + workObject + review, [
  "amber-",
  "orange-",
  "#a86a12",
  "#fff2cf",
  "#fffaf0",
  "#ebe9e1",
  "#fffdf8",
  "#f4f1e9",
]), "critical product surfaces contain no forbidden accents or beige surfaces");

check("G1-04", containsNone(layout + globals + agentSurface + workObject + review, [
  "IBM_Plex_Mono",
  "--font-plex-mono",
]), "critical product UI uses Inter/system typography only");

check("G1-05", containsAll(globals, [
  "--amtech-space-1: 8px",
  "--amtech-radius-card: 20px",
  "prefers-reduced-motion",
]), "runtime tokens implement 8px rhythm, soft surfaces, and reduced motion");
check("G1-06", !globals.includes("border-radius: 0;\n}"), "no global square-corner override remains");

check("G2-01", containsAll(agentSurface, ["Command", "Work", "Decisions", "Proof"]), "owner surface exposes four operational planes");
check("G2-02", containsAll(agentSurface, ["needs_you", "blocked", "failed", "done"]), "owner surface distinguishes required agent states");
check("G2-03", containsAll(agentSurface + workObject, ["requires_approval", "proof"]), "decision consequence and proof semantics are rendered");

check("G3-01", containsAll(agentSurface, ["EventSource", "snapshot", "intent_id"]), "stream resumes through snapshots and messages use stable intent IDs");

check("G4-01", containsAll(mcpUi, [
  "sandbox=\"allow-scripts\"",
  "e.source !== ref.current.contentWindow",
  "amtech-mcp-ui",
]), "MCP Apps are sandboxed and source/intent allowlisted");
check("G4-02", !mcpUi.includes("allow-same-origin"), "MCP Apps do not receive same-origin privileges");

check("G5-01", containsAll(globals, [":focus-visible", "prefers-reduced-motion"]), "focus and reduced-motion foundations exist");

check("G6-01", estimator.includes("Non-canonical preview"), "public estimator is visibly marked non-canonical");

check("ONB-01", containsAll(onboarding, [
  "businessType",
  "taxId",
  "identityState",
  "/api/front-door/identity/verify",
]), "onboarding includes secure business identity verification before activation");
check("ONB-02", containsAll(provisionRoute, ["cookies", "owner_session_token"]), "provisioning proxy binds the HttpOnly owner session");

const report = {
  generated_at: new Date().toISOString(),
  status: failures.length ? "fail" : "pass",
  pass_count: passes.length,
  fail_count: failures.length,
  passes,
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
