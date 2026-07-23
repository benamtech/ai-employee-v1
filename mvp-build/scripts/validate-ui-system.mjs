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
  login,
  dashboard,
  agentSurface,
  ownerProjectionController,
  operatingContracts,
  boundedPlanner,
  operatingCompiler,
  workObject,
  review,
  mcpUi,
  estimator,
  onboardingPage,
  onboardingGate,
  identityControl,
  provisionRoute,
  resourcesRoute,
  eventsRoute,
] = await Promise.all([
  read("../docs/AMTECH_WEB_DESIGN_SYSTEM.md"),
  read("../docs/AMTECH_AGENT_INTERFACE_STANDARD.md"),
  read("../docs/AMTECH_UI_VALIDATION_STANDARD.md"),
  read("apps/web/app/globals.css"),
  read("apps/web/app/layout.tsx"),
  read("apps/web/app/login/page.tsx"),
  read("apps/web/app/dashboard/page.tsx"),
  read("apps/web/app/agent/[employeeId]/AgentSurface.tsx"),
  read("apps/web/app/agent/[employeeId]/owner-projection-controller.ts"),
  read("packages/shared/src/operating-system.ts"),
  read("packages/shared/src/operating-layout.ts"),
  read("apps/manager/src/lib/operating-surface.ts"),
  read("apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx"),
  read("apps/web/app/agent/[employeeId]/review/ReviewClient.tsx"),
  read("apps/web/app/agent/[employeeId]/components/McpUiResource.tsx"),
  read("apps/web/app/free-estimator/FreeEstimatorClient.tsx"),
  read("apps/web/app/create-ai-employee/page.tsx"),
  read("apps/web/app/create-ai-employee/OnboardingIdentityGate.tsx"),
  read("apps/web/app/create-ai-employee/BusinessIdentityControl.tsx"),
  read("apps/web/app/api/front-door/provision/route.ts"),
  read("apps/web/app/api/employee/[employeeId]/resources/route.ts"),
  read("apps/web/app/api/employee/[employeeId]/events/route.ts"),
]);

const criticalProductSurfaces = globals + layout + login + dashboard + agentSurface + workObject + review;

check("G0-01", containsAll(design + agentStandard + validationStandard, [
  "status:** canonical",
  "operating surface",
  "ag-ui",
  "mcp apps",
  "pass/fail",
]), "canonical visual, operating, and validation standards exist");
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
check("G1-02", containsNone(criticalProductSurfaces, [
  "prefers-color-scheme: dark",
  "background: #0a0a0a",
  "background:#0a0a0a",
]), "login, dashboard, operating, work-object, and review surfaces stay light");
check("G1-03", containsNone(login + dashboard + agentSurface + workObject + review, [
  "amber-",
  "orange-",
  "#a86a12",
  "#fff2cf",
  "#fffaf0",
  "#ebe9e1",
  "#fffdf8",
  "#f4f1e9",
]), "critical product surfaces contain no forbidden accents or beige surfaces");
check("G1-04", containsNone(criticalProductSurfaces, ["IBM_Plex_Mono", "--font-plex-mono", "IBM Plex Mono"]), "critical product UI uses Inter/system typography only");
check("G1-05", containsAll(globals, ["--amtech-space-1: 8px", "--amtech-radius-card: 20px", "prefers-reduced-motion"]), "runtime tokens implement 8px rhythm, soft surfaces, and reduced motion");
check("G1-06", !globals.includes("border-radius: 0;"), "no square-corner doctrine remains in the global foundation");
check("G1-07", containsAll(login + dashboard, ["min-height: 48px", ":focus-visible"]), "login and dashboard preserve minimum controls and keyboard focus");

check("G2-01", containsAll(operatingContracts + agentSurface, [
  "OperatingSurfaceState",
  "OperatingWorkLoop",
  "ActiveSave",
  "OperatingDecision",
  "OperatingSystemChange",
  "DelegatedWorkUnit",
  "OperatingEvidence",
]), "owner surface consumes canonical operating primitives");
check("G2-02", containsNone(agentSurface, ["type PrimaryView", "role=\"tablist\"", "Employee work planes"]), "fixed five-tab shell is absent");
check("G2-03", containsAll(agentSurface + operatingContracts, ["return_condition", "Returns when", "future intention"]), "active saves expose return conditions");
check("G2-04", containsAll(agentSurface + operatingContracts, ["parent_loop_id", "purpose", "result_summary", "blocking_reason"]), "delegation is bound to parent work and material result");

check("G3-01", containsAll(operatingContracts + operatingCompiler, [
  "OperatingContextManifest",
  "AdaptiveLayoutPlan",
  "context_fingerprint",
  "doctrine_versions",
  "owner_experience",
  "preferred_density",
]), "Manager compiles versioned owner-safe context and layout state");
check("G3-02", containsAll(boundedPlanner, ["planAdaptiveOperatingLayoutV2", "Math.log1p", "MAX_VOLUME_PRIORITY", "rationale_codes"]), "layout is deterministic, bounded, and volume-dampened");
check("G3-03", containsAll(resourcesRoute, ["operating-snapshot", "owner_session_token"]), "web consumes one owner-authorized operating snapshot");
check("G3-04", containsNone(operatingCompiler + agentSurface, ["raw_agents_md", "raw_codegraph", "raw_soul", "chain_of_thought", "provider_secret"]), "private context sources are not exposed to the browser");

check("G4-01", containsAll(agentSurface + ownerProjectionController, ["EventSource", "snapshot", "intent_id", "scheduleRefresh"]), "stream reconnect refreshes operating state without replaying commands");
check("G4-02", containsAll(agentSurface, ["createIntentId", "intent_id"]), "owner messages carry stable intent IDs");
check("G4-03", containsAll(eventsRoute, ["OWNER_STREAM_REAUTH_MS", "AbortController", "no-store", "X-Accel-Buffering"]), "owner stream has a bounded authorization lifetime and proxy buffering is disabled");

check("G5-01", containsAll(mcpUi, ["sandbox=\"allow-scripts\"", "e.source !== ref.current.contentWindow", "Interactive work"]), "MCP Apps are sandboxed and source/intent allowlisted");
check("G5-02", !mcpUi.includes("allow-same-origin"), "MCP Apps do not receive same-origin privileges");

check("G6-01", containsAll(globals, [":focus-visible", "prefers-reduced-motion"]), "focus and reduced-motion foundations exist");
check("G7-01", estimator.includes("Non-canonical preview"), "public estimator is visibly marked non-canonical");

check("ONB-01", containsAll(onboardingPage + onboardingGate + identityControl, [
  "OnboardingIdentityGate",
  "BusinessIdentityControl",
  "businessType",
  "taxId",
  "identityState",
  "/api/front-door/identity/verify",
]), "onboarding attaches secure business identity verification to the activation page");
check("ONB-02", containsAll(provisionRoute, ["cookies", "owner_session_token", "identity/status", "identity_unverified"]), "provisioning is cookie-bound and fails closed until identity is verified");

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
