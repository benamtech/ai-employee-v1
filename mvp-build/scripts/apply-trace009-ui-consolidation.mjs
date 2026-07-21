#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

function read(path) { return readFileSync(path, "utf8"); }
function write(path, value) { writeFileSync(path, value); }
function exact(text, before, after, label) {
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}:expected_once:${count}`);
  return text.replace(before, after);
}
function regex(text, pattern, after, label) {
  const matches = text.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`)) ?? [];
  if (matches.length !== 1) throw new Error(`${label}:expected_once:${matches.length}`);
  return text.replace(pattern, after);
}

const agentPath = "apps/web/app/agent/[employeeId]/AgentSurface.tsx";
let agent = read(agentPath);
agent = exact(agent, "  planAdaptiveOperatingLayout,\n", "  compileOperatingProjection,\n", "agent_compiler_import");
agent = exact(agent,
`import {
  applyOwnerWorkEvent,
  installOwnerSnapshot,
  protocolAuthority,
  validateScopedFrame,
  type OwnerStreamScope,
} from "./owner-stream-state";
`,
`import { applyOwnerWorkEvent, protocolAuthority, type OwnerStreamScope } from "./owner-stream-state";
import { openOwnerProjectionController } from "./owner-projection-controller";
import { registeredOperatingRegions } from "./operating-renderer-registry";
`, "agent_stream_imports");
agent = exact(agent,
`interface Props {
  employeeId: string;
  fixtureMode: boolean;
}
`,
`interface Props {
  employeeId: string;
  fixtureMode: boolean;
  fixturePayload?: ResourcePayload;
  embedded?: boolean;
}
`, "agent_props");
agent = exact(agent,
`export function AgentSurface({ employeeId, fixtureMode }: Props) {
  const [res, setRes] = useState<ResourcePayload>(() => fixtureMode ? fixtureResourcePayload(employeeId) : EMPTY);
`,
`export function AgentSurface({ employeeId, fixtureMode, fixturePayload, embedded = false }: Props) {
  const fixtureSource = fixturePayload ?? fixtureResourcePayload(employeeId);
  const [res, setRes] = useState<ResourcePayload>(() => fixtureMode ? fixtureSource : EMPTY);
`, "agent_signature");
agent = exact(agent, "      installResources(fixtureResourcePayload(employeeId));", "      installResources(fixtureSource);", "agent_fixture_refresh");
agent = exact(agent, "  }, [employeeId, fixtureMode, installResources]);", "  }, [employeeId, fixtureMode, fixtureSource, installResources]);", "agent_refresh_dependencies");
agent = exact(agent, "    const initial = fixtureMode ? fixtureResourcePayload(employeeId) : EMPTY;", "    const initial = fixtureMode ? fixtureSource : EMPTY;", "agent_initial_fixture");
agent = exact(agent, "  }, [employeeId, fixtureMode, installResources]);\n\n  useEffect(() => {\n    if (fixtureMode) void refresh();", "  }, [employeeId, fixtureMode, fixtureSource, installResources]);\n\n  useEffect(() => {\n    if (fixtureMode) void refresh();", "agent_reset_dependencies");
agent = regex(agent,
/  useEffect\(\(\) => \{\n    if \(fixtureMode\) return;\n    let source: EventSource \| null = null;[\s\S]*?\n  \}, \[employeeId, fixtureMode, installResources, scheduleRefresh\]\);/,
`  useEffect(() => {
    if (fixtureMode) return;
    return openOwnerProjectionController({
      employeeId,
      eventKinds: ["work_event", "work_progress", "approval_update"],
      initialReconnectDelayMs: 1000,
      onState: setStreamState,
      onSnapshot(snapshot, scope) {
        streamScope.current = scope;
        installResources({ ...EMPTY, ...snapshot });
        setLoading(false);
        setProgress("");
        setNotice(null);
      },
      onEvent(kind, payload, scope) {
        streamScope.current = scope;
        if (kind === "work_event") {
          const applied = applyOwnerWorkEvent(resourcesRef.current, payload, scope);
          if (applied.accepted) {
            streamScope.current = applied.scope;
            installResources(applied.resources);
          } else if (applied.reason === "scope_mismatch" || applied.reason === "invalid_event") {
            setStreamState("offline");
            setNotice({ tone: "error", text: `AMTECH denied an invalid owner-state projection (${ownerError(applied.reason)}). No command was sent or replayed.` });
          }
          return;
        }
        if (kind === "work_progress") {
          const verb = typeof payload.verb === "string" ? payload.verb : "Working";
          const state = typeof payload.state === "string" ? payload.state : "working";
          setProgress(state === "completed" ? "" : verb);
          if (state === "completed") scheduleRefresh();
          return;
        }
        if (kind === "approval_update") scheduleRefresh();
      },
      onDenied(reason) {
        streamScope.current = null;
        setLoading(false);
        setProgress("");
        setNotice({ tone: "error", text: `AMTECH denied an invalid owner-state projection (${ownerError(reason)}). No command was sent or replayed.` });
      },
    });
  }, [employeeId, fixtureMode, installResources, scheduleRefresh]);`, "agent_stream_effect");
agent = exact(agent,
"  const operating = useMemo(() => res.operating_state ?? fallbackOperatingState(res, employeeId), [employeeId, res]);",
`  const operating = useMemo(() => compileOperatingProjection(res, {
    evidence_class: fixtureMode ? "fixture_demonstration" : "production",
    employee_id: employeeId,
    business_name: fixtureMode ? "Fixture business" : null,
    business_kind: fixtureMode ? "demonstration" : null,
    context_fingerprint: fixtureMode ? `fixture:${employeeId}` : undefined,
  }), [employeeId, fixtureMode, res]);`, "agent_operating_compiler");
agent = exact(agent, "  return (\n    <main className=\"os-root\">", "  const Root = embedded ? \"section\" : \"main\";\n  return (\n    <Root className=\"os-root\">", "agent_root_open");
agent = exact(agent, "            {operating.layout.ordered_regions.map((region) => (", "            {registeredOperatingRegions(operating.layout.ordered_regions).map((region) => (", "agent_registry");
agent = exact(agent, "    </main>\n  );\n}\n\nfunction OperatingRegion", "    </Root>\n  );\n}\n\nfunction OperatingRegion", "agent_root_close");
agent = regex(agent, /\nfunction fallbackOperatingState\([\s\S]*?\n}\n\nfunction guidanceEyebrow/, "\nfunction guidanceEyebrow", "agent_remove_fallback");
write(agentPath, agent);

const livePath = "apps/web/app/agent/[employeeId]/LiveEmployeeOperatingShell.tsx";
let live = read(livePath);
live = exact(live,
`import {
  installOwnerSnapshot,
  protocolAuthority,
  validateScopedFrame,
  type OwnerStreamScope,
} from "./owner-stream-state";
`,
`import { protocolAuthority, type OwnerStreamScope } from "./owner-stream-state";
import { openOwnerProjectionController } from "./owner-projection-controller";
`, "live_stream_imports");
live = regex(live,
/  useEffect\(\(\) => \{\n    if \(fixtureMode \|\| mode !== "talk"\) \{[\s\S]*?\n  \}, \[employeeId, fixtureMode, installResources, mode, refreshResources\]\);/,
`  useEffect(() => {
    if (fixtureMode || mode !== "talk") {
      scopeRef.current = null;
      return;
    }
    return openOwnerProjectionController({
      employeeId,
      eventKinds: ["assistant_delta", "work_progress", "run_completed", "approval_update"],
      onState: setStreamState,
      onSnapshot(snapshot, scope) {
        scopeRef.current = scope;
        installResources(snapshot);
        setStatus("");
      },
      onEvent(kind, payload, scope) {
        scopeRef.current = scope;
        if (kind === "approval_update") {
          void refreshResources();
          return;
        }
        const runId = typeof payload.run_id === "string" ? payload.run_id : "";
        if (!runId) return;
        if (kind === "assistant_delta") {
          const messageId = typeof payload.message_id === "string" ? payload.message_id : `assistant:${runId}`;
          const delta = typeof payload.delta === "string" ? payload.delta : "";
          const sequence = Number(payload.sequence ?? -1);
          if (!delta || !Number.isInteger(sequence) || sequence < 0) return;
          setRuns((current) => {
            const previous = current[runId];
            if (previous && sequence <= previous.lastSequence) return current;
            return { ...current, [runId]: { runId, messageId, text: `${previous?.text ?? ""}${delta}`, activity: previous?.activity ?? "Responding", status: "streaming", lastSequence: sequence, startedAt: previous?.startedAt ?? Date.now() } };
          });
          setDispatching(false);
          setStatus("");
          return;
        }
        if (kind === "work_progress") {
          const activity = typeof payload.verb === "string" ? payload.verb : "Working";
          const state = typeof payload.state === "string" ? payload.state : "step";
          setRuns((current) => {
            const previous = current[runId] ?? { runId, messageId: `assistant:${runId}`, text: "", activity, status: "streaming" as const, lastSequence: -1, startedAt: Date.now() };
            return { ...current, [runId]: { ...previous, activity, status: state === "completed" ? previous.status : "streaming" } };
          });
          setDispatching(false);
          return;
        }
        const terminalStatus = String(payload.status ?? "completed");
        setRuns((current) => {
          const previous = current[runId];
          if (!previous) return current;
          const failed = terminalStatus === "failed";
          return { ...current, [runId]: { ...previous, activity: failed ? "Needs attention" : "Saved to workspace", status: failed ? "failed" : "completed" } };
        });
        setDispatching(false);
        window.setTimeout(() => { void refreshResources(); }, 120);
      },
      onDenied(reason) {
        scopeRef.current = null;
        setStatus(`AMTECH stopped an invalid live conversation projection (${reason}). No owner action was replayed.`);
      },
    });
  }, [employeeId, fixtureMode, installResources, mode, refreshResources]);`, "live_stream_effect");
write(livePath, live);

const pagePath = "apps/web/app/ui-lab/[scenario]/page.tsx";
const page = read(pagePath);
if (!page.includes("ProductionFixtureLabClient")) throw new Error("ui_lab_route_not_migrated");
if (!read("apps/web/app/ui-lab/[scenario]/ProductionFixtureLabClient.tsx").includes("<AgentSurface")) throw new Error("ui_lab_not_using_production_surface");
console.log(JSON.stringify({ status: "ok", files: [agentPath, livePath, pagePath] }));
