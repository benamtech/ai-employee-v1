"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  resolveConnectorSetupActionForCapability,
  type OperatingWorkLoop,
  type ResourcePayload,
  type TaskCapabilityMatch,
  type ToolCapabilityDescriptor,
} from "@amtech/shared";

interface Props {
  employeeId: string;
  fixtureMode?: boolean;
}

type CatalogState = "loading" | "ready" | "error";

const FIXTURE_CAPABILITIES: ToolCapabilityDescriptor[] = [
  {
    id: "toolcap:amtech-manager:create-email-draft",
    capability_key: "manager_tool:create_email_draft",
    server_id: "amtech-manager",
    server_label: "AMTECH Manager",
    transport: "manager_mcp",
    tool_name: "create_email_draft",
    label: "Draft customer email",
    summary: "Prepare a customer-facing draft while keeping sending behind approval.",
    category: "communication",
    availability: "ready",
    can_run_now: true,
    read_only: false,
    risk: "write",
    requires_approval: false,
    evidence: { level: "control_plane_contract", source_refs: ["fixture:manager_mcp"] },
  },
  {
    id: "toolcap:amtech-manager:publish-artifact-sandbox",
    capability_key: "manager_tool:publish_artifact_sandbox",
    server_id: "amtech-manager",
    server_label: "AMTECH Manager",
    transport: "manager_mcp",
    tool_name: "publish_artifact_sandbox",
    label: "Publish approved artifact",
    summary: "Publish the exact validated revision and retain an effect receipt.",
    category: "documents",
    availability: "approval_gated",
    can_run_now: true,
    read_only: false,
    risk: "write",
    requires_approval: true,
    evidence: { level: "control_plane_contract", source_refs: ["fixture:artifact_workbench"] },
  },
  {
    id: "toolcap:hermes-browser:browser",
    capability_key: "browser",
    server_id: "hermes:browser",
    server_label: "Hermes Browser",
    transport: "runtime_native",
    tool_name: "browser",
    label: "Browser research",
    summary: "Use an isolated browser session after its runtime probe passes.",
    category: "research",
    availability: "unverified",
    can_run_now: false,
    read_only: false,
    risk: "unknown",
    requires_approval: true,
    setup_requirement: "Live browser probe required",
    evidence: { level: "runtime_report", failed_dimensions: ["live_probe_passed"], source_refs: ["fixture:runtime_report"] },
  },
];

function fixturePayload(employeeId: string): Partial<ResourcePayload> {
  const matches: TaskCapabilityMatch[] = FIXTURE_CAPABILITIES.map((capability, index) => ({
    task_id: "fixture-task",
    loop_id: "loop:fixture-task",
    capability_id: capability.id,
    role: capability.can_run_now ? index === 0 ? "primary" : "supporting" : "blocked",
    score: 0.8 - index * 0.1,
    rationale: capability.can_run_now ? `${capability.label} can move this work safely.` : `${capability.label} is relevant but not live-proved.`,
    suggested_prompt: `For the current work, use ${capability.label.toLowerCase()} only if it is effective, and show the resulting evidence.`,
  }));
  return {
    employee_id: employeeId,
    tool_catalog: {
      version: 1,
      generated_at: new Date(0).toISOString(),
      assignment_id: "fixture-assignment",
      effective_report_id: "fixture-report",
      capabilities: FIXTURE_CAPABILITIES,
      task_matches: matches,
    },
    operating_state: {
      version: 1,
      generated_at: new Date(0).toISOString(),
      guidance: { headline: "Fixture work", summary: "Fixture task capability surface", mode: "working" },
      focus_loop_id: "loop:fixture-task",
      loops: [{
        id: "loop:fixture-task",
        title: "Prepare the owner-ready campaign update",
        summary: "Review the work, draft the update, and keep publication gated.",
        state: "active",
        horizon: "now",
        domain: "growth",
        source_envelope_ids: [],
        proof: { source_table: "fixture", source_id: "fixture-task" },
      }],
      active_saves: [],
      decisions: [],
      changes: [],
      delegated_work: [],
      evidence: [],
      context: {
        version: 1,
        generated_at: new Date(0).toISOString(),
        account_id: "fixture-account",
        assignment_id: "fixture-assignment",
        employee_id: employeeId,
        employee_name: "Fixture employee",
        doctrine_versions: {},
        dominant_domains: ["growth"],
        owner_experience: "guided",
        preferred_density: "balanced",
        signals: [],
      },
      layout: {
        version: 1,
        layout_id: "guided_operating_surface_v1",
        generated_at: new Date(0).toISOString(),
        primary_region: "work_loops",
        ordered_regions: [],
        focus_loop_id: "loop:fixture-task",
        command_position: "anchored_bottom",
        density: "balanced",
        rationale_codes: ["fixture"],
        context_fingerprint: "fixture",
      },
    },
  };
}

export function CapabilityDrawer({ employeeId, fixtureMode = false }: Props) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<CatalogState>(fixtureMode ? "ready" : "loading");
  const [payload, setPayload] = useState<Partial<ResourcePayload>>(() => fixtureMode ? fixturePayload(employeeId) : {});
  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    if (fixtureMode) return;
    setState("loading");
    try {
      const response = await fetch(`/api/employee/${encodeURIComponent(employeeId)}/resources`, { method: "POST" });
      const json = await response.json().catch(() => ({})) as Partial<ResourcePayload> & { error?: string };
      if (!response.ok || json.error || !json.tool_catalog) throw new Error(json.error ?? "tool_catalog_unavailable");
      setPayload(json);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  useEffect(() => { void load(); }, [employeeId, fixtureMode]);

  const catalog = payload.tool_catalog;
  const loops = payload.operating_state?.loops ?? [];
  const activeLoopId = selectedLoopId ?? payload.operating_state?.focus_loop_id ?? loops[0]?.id ?? null;
  const activeLoop = loops.find((loop) => loop.id === activeLoopId) ?? loops[0] ?? null;
  const capabilityById = useMemo(() => new Map((catalog?.capabilities ?? []).map((item) => [item.id, item])), [catalog]);
  const matched = (catalog?.task_matches ?? [])
    .filter((match) => !activeLoopId || match.loop_id === activeLoopId)
    .map((match) => ({ match, capability: capabilityById.get(match.capability_id) }))
    .filter((item): item is { match: TaskCapabilityMatch; capability: ToolCapabilityDescriptor } => Boolean(item.capability));
  const normalizedQuery = query.trim().toLowerCase();
  const visible = (matched.length ? matched : (catalog?.capabilities ?? []).map((capability) => ({ match: null, capability })))
    .filter(({ capability }) => !normalizedQuery || `${capability.label} ${capability.summary} ${capability.server_label} ${capability.category}`.toLowerCase().includes(normalizedQuery))
    .slice(0, 12);
  const readyCount = (catalog?.capabilities ?? []).filter((item) => item.can_run_now).length;
  const blockedCount = (catalog?.capabilities ?? []).length - readyCount;

  async function sendDraft() {
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    setNotice(null);
    try {
      const intentId = `capability:${Date.now()}:${crypto.randomUUID()}`.slice(0, 150);
      const response = await fetch(`/api/employee/${encodeURIComponent(employeeId)}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, intent_id: intentId }),
      });
      const json = await response.json().catch(() => ({})) as { error?: string; status?: string };
      if (!response.ok || json.error) throw new Error(json.error ?? "send_failed");
      setDraft("");
      setNotice("Instruction accepted through the existing durable command path. Tool authority and approvals remain unchanged.");
      window.setTimeout(() => { void load(); }, 500);
    } catch {
      setNotice("The instruction was not accepted. No tool was called and no business effect was attempted.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`tc-shell ${open ? "open" : ""}`}>
      <style>{DRAWER_CSS}</style>
      <button className="tc-launch" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="amtech-capability-drawer">
        <span>Ways to move this work</span>
        <strong>{state === "ready" ? readyCount : "—"}</strong>
      </button>
      {open ? (
        <aside id="amtech-capability-drawer" className="tc-drawer" aria-label="Tools mapped to current work">
          <header className="tc-head">
            <div><p>Capability map</p><h2>How this employee can move the work</h2></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close capability map">Close</button>
          </header>

          {state === "loading" ? <div className="tc-state">Reading the assignment-bound tool catalog…</div> : null}
          {state === "error" ? <div className="tc-state error"><strong>Capability evidence unavailable</strong><span>AMTECH will not infer tools from profile text or environment keys. Retry after the operating snapshot is healthy.</span><button type="button" onClick={() => void load()}>Retry</button></div> : null}

          {state === "ready" && catalog ? (
            <>
              <div className="tc-proofbar">
                <span>{readyCount} ready or approval-gated</span>
                <span>{blockedCount} blocked or unverified</span>
                <span>{catalog.effective_report_id ? "Evidence report attached" : "No runtime evidence report"}</span>
              </div>

              {loops.length ? (
                <div className="tc-loops" aria-label="Current work loops">
                  {loops.slice(0, 8).map((loop) => <LoopButton key={loop.id} loop={loop} selected={loop.id === activeLoop?.id} onSelect={() => setSelectedLoopId(loop.id)} />)}
                </div>
              ) : null}

              <div className="tc-focus">
                <div><p>Mapped to</p><h3>{activeLoop?.title ?? "Available employee capabilities"}</h3><span>{activeLoop?.summary ?? "Owner-safe capabilities discovered across Manager, connected business systems, and the employee runtime."}</span></div>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a capability" aria-label="Find a capability" />
              </div>

              <div className="tc-list">
                {visible.length ? visible.map(({ capability, match }) => (
                  <CapabilityCard
                    key={capability.id}
                    employeeId={employeeId}
                    capability={capability}
                    match={match}
                    onStage={(prompt) => { setDraft(prompt); setNotice(null); }}
                  />
                )) : <div className="tc-state">No capabilities match this filter.</div>}
              </div>

              <section className="tc-compose" aria-label="Stage an instruction for the employee">
                <div><p>Stage, don&rsquo;t execute</p><span>Selecting a capability creates an editable instruction. It never calls a tool from the browser.</span></div>
                <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} placeholder="Choose a capability above or write a bounded instruction…" />
                <div className="tc-compose-actions"><button type="button" className="quiet" onClick={() => setDraft("")} disabled={!draft}>Clear</button><button type="button" onClick={() => void sendDraft()} disabled={!draft.trim() || sending}>{sending ? "Sending…" : "Send to employee"}</button></div>
                {notice ? <p className="tc-notice" role="status">{notice}</p> : null}
              </section>
            </>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

function LoopButton({ loop, selected, onSelect }: { loop: OperatingWorkLoop; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={selected ? "selected" : ""} onClick={onSelect}><span>{loop.state.replace(/_/g, " ")}</span><strong>{loop.title}</strong></button>;
}

interface CapabilitySetupAction {
  href: string;
  label: string;
  actionLabel: string;
}

function capabilitySetupAction(employeeId: string, capability: ToolCapabilityDescriptor): CapabilitySetupAction | null {
  if (capability.availability !== "needs_connection") return null;
  const setup = resolveConnectorSetupActionForCapability({
    connector_id: capability.connector_id,
    server_id: capability.server_id,
    server_label: capability.server_label,
    tool_name: capability.tool_name,
    category: capability.category,
  });
  if (!setup) return null;
  const returnTo = `/agent/${encodeURIComponent(employeeId)}`;
  return {
    href: `/agent/${encodeURIComponent(employeeId)}/connect/${encodeURIComponent(setup.key)}?returnTo=${encodeURIComponent(returnTo)}`,
    label: setup.label,
    actionLabel: setup.self_service ? `Connect ${setup.label}` : `Set up ${setup.label}`,
  };
}

function CapabilityCard({ employeeId, capability, match, onStage }: { employeeId: string; capability: ToolCapabilityDescriptor; match: TaskCapabilityMatch | null; onStage: (prompt: string) => void }) {
  const setupAction = capabilitySetupAction(employeeId, capability);
  return (
    <article className={`tc-card ${capability.availability}`}>
      <div className="tc-card-head"><div><p>{capability.server_label} · {capability.transport.replace(/_/g, " ")}</p><h4>{capability.label}</h4></div><span>{capability.availability.replace(/_/g, " ")}</span></div>
      <p>{capability.summary}</p>
      {match ? <small>{match.rationale}</small> : null}
      <div className="tc-tags">
        <span>{capability.category}</span>
        <span>{capability.read_only ? "read only" : capability.risk.replace(/_/g, " ")}</span>
        {capability.requires_approval ? <span>approval required</span> : null}
        <span>{capability.evidence.level.replace(/_/g, " ")}</span>
      </div>
      {capability.setup_requirement ? <div className="tc-blocker"><strong>What is needed</strong><span>{capability.setup_requirement}</span></div> : null}
      <div className="tc-card-actions">
        {match ? <button type="button" onClick={() => onStage(match.suggested_prompt)}>{capability.can_run_now ? "Use for this work" : "Plan the unblock"}</button> : null}
        {setupAction ? <Link href={setupAction.href}>{setupAction.actionLabel}</Link> : null}
      </div>
    </article>
  );
}

const DRAWER_CSS = `
.tc-shell{position:fixed;right:20px;bottom:20px;z-index:70;font-family:var(--amtech-font,Inter,system-ui,sans-serif)}
.tc-launch{height:48px;display:flex;align-items:center;gap:14px;padding:0 10px 0 18px;border:1px solid rgba(10,10,10,.18);border-radius:999px;background:#0a0a0a;color:#fff;box-shadow:0 12px 40px rgba(10,10,10,.18);font-weight:760}.tc-launch strong{min-width:30px;height:30px;display:grid;place-items:center;border-radius:999px;background:#fff;color:#0a0a0a;font-size:12px}.tc-launch:hover{background:#e11d2a}
.tc-drawer{position:absolute;right:0;bottom:60px;width:min(620px,calc(100vw - 24px));max-height:min(820px,calc(100vh - 90px));overflow:auto;background:#f4f4f4;border:1px solid rgba(10,10,10,.18);box-shadow:0 26px 80px rgba(10,10,10,.28)}
.tc-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;gap:20px;align-items:start;padding:20px;background:#fff;border-bottom:1px solid rgba(10,10,10,.12)}.tc-head p,.tc-focus p,.tc-compose p,.tc-card-head p{margin:0 0 5px;font:600 9px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;text-transform:uppercase;color:rgba(10,10,10,.55)}.tc-head h2{margin:0;font-size:21px;line-height:1.1;letter-spacing:-.025em}.tc-head>button{border:0;background:transparent;font-weight:700;text-decoration:underline}
.tc-proofbar{display:flex;gap:7px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid rgba(10,10,10,.1)}.tc-proofbar span,.tc-tags span{padding:4px 7px;border:1px solid rgba(10,10,10,.16);background:#fff;font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.04em}
.tc-loops{display:flex;gap:8px;overflow:auto;padding:14px 16px 4px}.tc-loops button{min-width:180px;text-align:left;display:grid;gap:5px;padding:11px;border:1px solid rgba(10,10,10,.13);background:#fff}.tc-loops button.selected{border-color:#0a0a0a;box-shadow:inset 0 -3px #e11d2a}.tc-loops span{font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;color:rgba(10,10,10,.5)}.tc-loops strong{font-size:12px;line-height:1.35}
.tc-focus{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:16px;padding:16px}.tc-focus h3{margin:0;font-size:17px}.tc-focus span{display:block;margin-top:5px;font-size:12px;line-height:1.45;color:rgba(10,10,10,.62)}.tc-focus input{align-self:end;width:100%;height:40px;padding:0 11px;border:1px solid rgba(10,10,10,.2);background:#fff}
.tc-list{display:grid;gap:10px;padding:0 16px 16px}.tc-card{display:grid;gap:10px;padding:14px;background:#fff;border:1px solid rgba(10,10,10,.12)}.tc-card.ready,.tc-card.approval_gated{border-left:4px solid #0a0a0a}.tc-card.needs_connection,.tc-card.unverified,.tc-card.degraded{border-left:4px solid #e11d2a}.tc-card-head{display:flex;justify-content:space-between;gap:12px}.tc-card-head h4{margin:0;font-size:15px}.tc-card-head>span{align-self:start;padding:4px 7px;background:#f4f4f4;font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.tc-card>p{margin:0;font-size:12px;line-height:1.5}.tc-card>small{font-size:11px;line-height:1.45;color:rgba(10,10,10,.58)}.tc-tags{display:flex;gap:5px;flex-wrap:wrap}.tc-blocker{display:grid;gap:3px;padding:9px;background:#fff4f4;border:1px solid rgba(225,29,42,.18)}.tc-blocker strong{font-size:10px;text-transform:uppercase}.tc-blocker span{font-size:11px}.tc-card-actions{display:flex;gap:8px;flex-wrap:wrap}.tc-card-actions button,.tc-card-actions a,.tc-compose-actions button,.tc-state button{min-height:36px;display:inline-flex;align-items:center;justify-content:center;padding:0 12px;border:1px solid #0a0a0a;background:#0a0a0a;color:#fff;text-decoration:none;font-size:11px;font-weight:720}.tc-card-actions a{background:#fff;color:#0a0a0a}
.tc-compose{position:sticky;bottom:0;display:grid;gap:10px;padding:16px;background:#fff;border-top:1px solid rgba(10,10,10,.14)}.tc-compose>div:first-child{display:grid;gap:3px}.tc-compose>div:first-child span{font-size:11px;color:rgba(10,10,10,.6)}.tc-compose textarea{width:100%;resize:vertical;padding:11px;border:1px solid rgba(10,10,10,.22)}.tc-compose-actions{display:flex;justify-content:flex-end;gap:8px}.tc-compose-actions button.quiet{background:#fff;color:#0a0a0a}.tc-compose-actions button:disabled{opacity:.45}.tc-notice{margin:0!important;padding:9px;background:#f4f4f4;font-size:11px!important;line-height:1.4}
.tc-state{display:grid;gap:8px;margin:16px;padding:18px;background:#fff;border:1px solid rgba(10,10,10,.12);font-size:12px}.tc-state.error{border-color:rgba(225,29,42,.25)}
@media(max-width:700px){.tc-shell{right:12px;bottom:12px}.tc-drawer{bottom:58px;max-height:calc(100vh - 82px)}.tc-focus{grid-template-columns:1fr}.tc-launch span{max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
`;
