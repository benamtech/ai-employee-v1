#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const activeRoots = ["apps/web/app/agent", "apps/web/app/ui-lab", "apps/manager/src/lib", "packages/shared/src"];
const files = activeRoots.flatMap((entry) => walk(resolve(root, entry)))
  .filter((path) => /\.(ts|tsx|mjs)$/.test(path));
const rel = (path) => relative(root, path).replaceAll("\\", "/");
const text = (path) => readFileSync(resolve(root, path), "utf8");
const activeText = files
  .filter((path) => !rel(path).endsWith("/FixtureLabClient.tsx"))
  .map((path) => ({ path: rel(path), value: readFileSync(path, "utf8") }));

function walk(path) {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).flatMap((name) => walk(join(path, name)));
}
function definitions(pattern) {
  return activeText.filter(({ value }) => pattern.test(value)).map(({ path }) => path);
}
function requireExactly(label, values, count = 1) {
  if (values.length !== count) throw new Error(`${label}:expected_${count}:found_${values.length}:${values.join(",")}`);
  console.log(`PASS ${label} ${values.join(",")}`);
}
function requireText(path, pattern, label) {
  if (!pattern.test(text(path))) throw new Error(`${label}:${path}`);
  console.log(`PASS ${label} ${path}`);
}
function forbidActive(pattern, label, allowed = []) {
  const allowedSet = new Set(allowed);
  const found = activeText
    .filter(({ path, value }) => !allowedSet.has(path) && pattern.test(value))
    .map(({ path }) => path);
  if (found.length) throw new Error(`${label}:${found.join(",")}`);
  console.log(`PASS ${label}`);
}

requireExactly("one_projection_controller", definitions(/export function openOwnerProjectionController\(/));
requireExactly("one_semantic_compiler", definitions(/export function compileOperatingProjection\(/));
requireExactly("one_layout_planner", definitions(/export function planAdaptiveOperatingLayoutV2\(/));
requireExactly("one_renderer_registry", definitions(/export function registeredOperatingRegions\(/));
requireExactly("one_work_resource_renderer", definitions(/export function WorkObjectRenderer\(/));
requireExactly("one_embedded_view_compiler", definitions(/export function compileDeliverableUiResource\(/));

requireExactly("one_variant_admission_policy", definitions(/export function admitUiVariantForRuntime\(/));
requireExactly("one_variant_model_projection", definitions(/export function projectExperienceModelForVariant\(/));
requireExactly("one_variant_intent_resolver", definitions(/export function resolveUiVariantIntent\(/));

requireText("apps/web/app/agent/[employeeId]/AgentSurface.tsx", /openOwnerProjectionController/, "workspace_uses_controller");
requireText("apps/web/app/agent/[employeeId]/LiveEmployeeOperatingShell.tsx", /openOwnerProjectionController/, "talk_uses_controller");
requireText("apps/web/app/agent/[employeeId]/AgentSurface.tsx", /compileOperatingProjection/, "workspace_uses_compiler");
requireText("apps/web/app/agent/[employeeId]/AgentSurface.tsx", /registeredOperatingRegions/, "workspace_uses_registry");

requireText("apps/web/app/ui-lab/page.tsx", /MANAGER_API\.ownerDashboard/, "ui_lab_routes_to_live_owner_dashboard");
requireText("apps/web/app/ui-lab/employee/[employeeId]/layout.tsx", /LiveEmployeeProvider/, "ui_lab_employee_layout_owns_live_provider");
requireText("apps/web/app/_components/live-employee/LiveEmployeeProvider.tsx", /openOwnerProjectionController/, "ui_lab_provider_uses_controller");
requireText("apps/web/app/_components/live-employee/UiLabShell.tsx", /evidenceLevel: "live"/, "ui_lab_variant_uses_live_evidence");
requireText("apps/web/app/ui-lab/fixtures/page.tsx", /Explicit fixture evidence/, "ui_lab_fixture_route_explicit");
requireText("apps/web/app/ui-lab/[scenario]/page.tsx", /redirect\(`\/ui-lab\/fixtures/, "legacy_fixture_front_door_redirects");
requireText("apps/web/app/ui-lab/[scenario]/UiLabWorkbenchClient.tsx", /<iframe[\s\S]*src=\{previewUrl\}/, "ui_lab_fixture_workbench_uses_isolated_preview_canvas");
requireText("apps/web/app/ui-lab/preview/[scenario]/page.tsx", /ProductionFixtureLabClient/, "ui_lab_preview_routes_to_thin_shell");
requireText("apps/web/app/ui-lab/[scenario]/ProductionFixtureLabClient.tsx", /<AgentSurface[\s\S]*fixturePayload=/, "ui_lab_reuses_production_surface");
requireText("apps/web/app/ui-lab/[scenario]/ProductionFixtureLabClient.tsx", /Fixture data|fixture projection|Fixture intent/, "ui_lab_evidence_class_explicit");
requireText("apps/web/app/api/ui-lab/presets/route.ts", /AMTECH_UI_LAB_WRITE/, "ui_lab_repository_writes_explicitly_gated");
requireText("apps/web/app/_lib/ui-lab-registry.server.ts", /open\(path, "wx"\)/, "ui_lab_preset_versions_write_exclusively");
requireText("packages/shared/src/ui-lab-preset.ts", /Approved presets require reproducible clean Git source/, "ui_lab_promotion_requires_reproducible_source");

requireText("apps/web/app/_components/ui-variant/UiVariantHost.tsx", /if \(!admission\.admitted/, "generated_runtime_host_refuses_unadmitted_variant");
requireText("apps/web/app/_components/live-employee/UiLabShell.tsx", /admitUiVariantForRuntime\([\s\S]*surface: "live_owner_workbench"/, "live_variant_admission_uses_live_surface");
requireText("apps/web/app/_components/live-employee/UiLabShell.tsx", /projectExperienceModelForVariant\(model, manifest\)/, "live_variant_model_is_capability_scoped");
requireText("apps/web/app/_components/live-employee/LiveEmployeeProvider.tsx", /resolveUiVariantIntent\(\{ request, model, admission \}\)/, "live_intent_bridge_uses_shared_resolver");
requireText("apps/web/app/ui-lab/variant/[variant]/[scenario]/VariantFixtureLabClient.tsx", /surface: "fixture_lab"/, "fixture_variant_surface_is_explicit");

forbidActive(/new EventSource\(/, "no_surface_local_eventsource", ["apps/web/app/agent/[employeeId]/owner-projection-controller.ts"]);
forbidActive(/function fallbackOperatingState\(/, "no_active_fallback_compiler");
forbidActive(/function deriveOperatingState\(/, "no_active_lab_compiler");
// Intent policy stays in the one shared resolver; surfaces execute host methods, they do not decide them.
forbidActive(/\.intents\.find\(/, "no_surface_local_intent_policy", ["packages/shared/src/ui-variant-runtime.ts"]);

console.log(JSON.stringify({
  status: "ok",
  checked_files: activeText.length,
  event_source_owner: "owner-projection-controller.ts",
  ui_lab: {
    workbench: "ui-lab/employee/[employeeId]",
    fixtures: "ui-lab/fixtures",
    preview_route: "ui-lab/preview/[scenario]/page.tsx",
    production_preview: "ProductionFixtureLabClient.tsx",
    legacy_fixture_lab: "isolated_not_routed",
  },
  generated_runtime: {
    policy_owner: "packages/shared/src/ui-variant-runtime.ts",
    admission: "admitUiVariantForRuntime",
    projection: "projectExperienceModelForVariant",
    intent_bridge: "resolveUiVariantIntent",
    surfaces: ["live_owner_workbench", "fixture_lab"],
  },
}, null, 2));
