"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { admitUiVariantForRuntime, projectExperienceModelForVariant, type UiVariantManifest } from "@amtech/shared";
import { useEmployeeUiPort, EmployeeUiPortHost } from "../employee-ui/EmployeeUiPort";
import { AgentSurface } from "../../agent/[employeeId]/AgentSurface";
import { LiveEmployeeOperatingShell } from "../../agent/[employeeId]/LiveEmployeeOperatingShell";
import { UiVariantHost } from "../ui-variant/UiVariantHost";
import { buildEmployeeExperienceModel } from "../ui-variant/buildEmployeeExperienceModel";
import { UI_VARIANT_REGISTRY, isUiVariantRegistryId } from "../ui-variant/registry.generated";
import { useLiveEmployee } from "./LiveEmployeeProvider";

const NAV = [
  { href: "", label: "Experience" },
  { href: "/conversation", label: "Conversation" },
  { href: "/state", label: "State" },
  { href: "/generated", label: "Generated" },
  { href: "/variants", label: "Designs" },
  { href: "/fixtures", label: "Fixtures", absolute: true },
] as const;

export function UiLabShell({
  employeeId,
  employeeName,
  children,
}: {
  employeeId: string;
  employeeName: string;
  children: ReactNode;
}) {
  const live = useLiveEmployee();
  const pathname = usePathname();
  const [railOpen, setRailOpen] = useState(true);
  const base = `/ui-lab/employee/${employeeId}`;

  return (
    <main className={`ui-live-root ${railOpen ? "rail-open" : "rail-closed"}`}>
      <style>{CSS}</style>
      <aside className="ui-live-rail" aria-label="UI Lab navigation">
        <div className="ui-live-brand">
          <Link href="/ui-lab">AMTECH<span>.</span></Link>
          <button type="button" onClick={() => setRailOpen(false)} aria-label="Hide navigation">Hide</button>
        </div>
        <div className="ui-live-subject">
          <small>Authorized employee</small>
          <strong>{employeeName}</strong>
          <span>{employeeId}</span>
        </div>
        <nav>
          {NAV.map((item) => {
            const absolute = "absolute" in item && item.absolute;
            const href = absolute ? item.href : `${base}${item.href}`;
            const active = absolute ? pathname === item.href : pathname === href;
            return <Link key={item.label} className={active ? "active" : ""} href={href}>{item.label}</Link>;
          })}
        </nav>
        <div className="ui-live-evidence">
          <span className={live.streamState}>{live.streamState}</span>
          <small>source: {live.evidenceSource}</small>
          <small>scope: {live.scope ? "validated" : "not installed"}</small>
        </div>
      </aside>
      <section className="ui-live-main">
        <header className="ui-live-topbar">
          <button type="button" onClick={() => setRailOpen((value) => !value)} aria-expanded={railOpen}>{railOpen ? "Rail" : "Menu"}</button>
          <div>
            <strong>{employeeName}</strong>
            <span>{live.notice || live.progress || "Live owner projection. Fixtures are explicit only."}</span>
          </div>
          <Link href="/ui-lab/fixtures">Fixtures</Link>
        </header>
        <div className="ui-live-outlet">{children}</div>
      </section>
    </main>
  );
}

const CSS = `
  .ui-live-root{min-height:100dvh;display:grid;grid-template-columns:280px minmax(0,1fr);background:#f7f9fc;color:#111;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.ui-live-root.rail-closed{grid-template-columns:0 minmax(0,1fr)}.ui-live-rail{position:sticky;top:0;height:100dvh;overflow:auto;border-right:1px solid rgba(17,17,17,.1);background:#fff;transition:transform .16s ease}.rail-closed .ui-live-rail{transform:translateX(-100%);overflow:hidden}.ui-live-brand{min-height:64px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(17,17,17,.08)}.ui-live-brand a{font-weight:900;color:#111;text-decoration:none;letter-spacing:.04em}.ui-live-brand span{color:#e11d2a}.ui-live-brand button,.ui-live-topbar button,.ui-live-topbar a{min-height:40px;padding:0 12px;border:1px solid rgba(17,17,17,.12);border-radius:8px;background:#fff;color:#111;text-decoration:none;font:inherit;font-size:12px;font-weight:750}.ui-live-subject{display:grid;gap:5px;padding:18px 16px}.ui-live-subject small,.ui-live-subject span,.ui-live-evidence small{color:#667085;font-size:11px;overflow-wrap:anywhere}.ui-live-subject strong{font-size:18px}.ui-live-rail nav{display:grid;gap:4px;padding:8px}.ui-live-rail nav a{min-height:42px;padding:0 12px;border-radius:8px;display:flex;align-items:center;color:#344054;text-decoration:none;font-size:13px;font-weight:760}.ui-live-rail nav a.active,.ui-live-rail nav a:hover{background:#eef4ff;color:#1d4ed8}.ui-live-evidence{margin:14px 16px;padding:12px;display:grid;gap:6px;border:1px solid rgba(17,17,17,.1);border-radius:8px;background:#f8fafc}.ui-live-evidence span{width:max-content;padding:4px 8px;border-radius:999px;background:#fef3c7;color:#854d0e;font-size:10px;font-weight:850;text-transform:uppercase}.ui-live-evidence span.live{background:#dcfce7;color:#166534}.ui-live-evidence span.offline{background:#fee2e2;color:#991b1b}.ui-live-main{min-width:0}.ui-live-topbar{position:sticky;top:0;z-index:50;min-height:64px;padding:10px 16px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:14px;border-bottom:1px solid rgba(17,17,17,.1);background:rgba(247,249,252,.9);backdrop-filter:blur(18px)}.ui-live-topbar div{display:grid;min-width:0}.ui-live-topbar strong{font-size:14px}.ui-live-topbar span{color:#667085;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ui-live-outlet{min-height:calc(100dvh - 64px)}.ui-live-panel{min-height:calc(100dvh - 64px);padding:18px}.ui-live-panel h1{margin:0 0 12px;font-size:30px;letter-spacing:-.03em}.ui-live-card{padding:16px;border:1px solid rgba(17,17,17,.1);border-radius:8px;background:#fff}.ui-live-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px}.ui-live-list{display:grid;gap:8px}.ui-live-list article{padding:12px;border:1px solid rgba(17,17,17,.1);border-radius:8px;background:#fff}.ui-live-list small{color:#667085}.ui-live-json{margin:0;overflow:auto;max-height:70dvh;padding:14px;border-radius:8px;background:#111827;color:#e5e7eb;font-size:12px}.ui-live-variant{min-height:calc(100dvh - 64px)}@media(max-width:760px){.ui-live-root,.ui-live-root.rail-open{grid-template-columns:1fr}.ui-live-rail{position:fixed;z-index:80;width:min(86vw,300px);box-shadow:0 20px 60px rgba(17,17,17,.18)}.rail-closed .ui-live-rail{transform:translateX(-105%)}.ui-live-topbar{grid-template-columns:auto minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.ui-live-rail{transition:none}}
`;

export function UiLabExperiencePanel() {
  const live = useLiveEmployee();
  return <LiveEmployeeOperatingShell employeeId={live.employeeId} fixtureMode={false} liveProjection={live} />;
}

export function UiLabConversationPanel() {
  const live = useLiveEmployee();
  const messages = [...live.resources.messages].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return (
    <section className="ui-live-panel">
      <h1>Conversation</h1>
      <div className="ui-live-list">
        {messages.map((message) => <article key={message.id}><small>{message.direction} · {message.status}</small><p>{message.body}</p></article>)}
        {!messages.length ? <div className="ui-live-card">No live conversation messages are installed yet.</div> : null}
      </div>
    </section>
  );
}

export function UiLabStatePanel() {
  const live = useLiveEmployee();
  return (
    <section className="ui-live-panel">
      <h1>State</h1>
      <div className="ui-live-grid">
        <div className="ui-live-card"><strong>Stream</strong><p>{live.streamState}</p></div>
        <div className="ui-live-card"><strong>Scope</strong><p>{live.scope ? `${live.scope.account_id} / ${live.scope.assignment_id}` : "Not installed"}</p></div>
        <div className="ui-live-card"><strong>Evidence</strong><p>{live.evidenceSource}</p></div>
      </div>
      <pre className="ui-live-json">{JSON.stringify(live.resources.operating_state ?? live.resources, null, 2)}</pre>
    </section>
  );
}

export function UiLabGeneratedPanel() {
  const live = useLiveEmployee();
  const outputs = live.resources.outputs ?? [];
  const envelopes = live.resources.surface_envelopes ?? [];
  return (
    <section className="ui-live-panel">
      <h1>Generated</h1>
      <div className="ui-live-grid">
        {outputs.map((output) => <article className="ui-live-card" key={output.id}><strong>{output.title}</strong><p>{output.summary ?? output.status}</p>{output.href ? <a href={output.href}>Open</a> : null}</article>)}
        {envelopes.map((envelope) => <article className="ui-live-card" key={envelope.id}><strong>{envelope.title}</strong><p>{envelope.summary ?? envelope.kind}</p></article>)}
        {!outputs.length && !envelopes.length ? <div className="ui-live-card">No generated owner-safe resources are installed yet.</div> : null}
      </div>
    </section>
  );
}

function registryManifest(variantId: string): UiVariantManifest {
  const id = isUiVariantRegistryId(variantId) ? variantId : "reference-client";
  return UI_VARIANT_REGISTRY[id].manifest;
}

export function UiLabVariantPanel({
  variantId,
  operatorAcknowledged = false,
}: {
  variantId: string;
  operatorAcknowledged?: boolean;
}) {
  const live = useLiveEmployee();
  return (
    <EmployeeUiPortHost adapterKey="owner_web" payload={live.resources}>
      <UiLabVariantInner variantId={variantId} operatorAcknowledged={operatorAcknowledged} />
    </EmployeeUiPortHost>
  );
}

function UiLabVariantInner({ variantId, operatorAcknowledged }: { variantId: string; operatorAcknowledged: boolean }) {
  const live = useLiveEmployee();
  const port = useEmployeeUiPort();
  const manifest = registryManifest(variantId);
  const model = useMemo(() => buildEmployeeExperienceModel({
    payload: live.resources,
    port,
    projection: {
      status: live.streamState,
      health: live.streamState,
      progress: live.progress,
      running: live.streamState === "live" && Boolean(live.progress),
      observed_at: live.scope?.cursor.created_at ?? null,
    },
    evidenceLevel: "live",
  }), [live.progress, live.resources, live.scope, live.streamState, port]);
  const admission = useMemo(() => admitUiVariantForRuntime({
    manifest,
    surface: "live_owner_workbench",
    adapterKey: "owner_web",
    operatorAcknowledged,
  }), [manifest, operatorAcknowledged]);
  // The variant only ever receives the capabilities its own manifest declared.
  const projection = useMemo(() => projectExperienceModelForVariant(model, manifest), [manifest, model]);
  const referenceClient = <AgentSurface employeeId={live.employeeId} fixtureMode={false} embedded liveProjection={live} />;
  return (
    <section
      className="ui-live-variant"
      data-evidence-level={model.metadata.evidence_level}
      data-ui-variant-withheld={projection.withheld.join(" ")}
    >
      <UiVariantHost
        variantId={manifest.id}
        admission={admission}
        model={projection.model}
        referenceClient={referenceClient}
        dispatchIntent={(request) => live.dispatchVariantIntent(request, projection.model, admission)}
      />
    </section>
  );
}

export function UiLabVariantsPanel() {
  const live = useLiveEmployee();
  const base = `/ui-lab/employee/${live.employeeId}/variant`;
  const decisions = Object.values(UI_VARIANT_REGISTRY).map(({ manifest }) => ({
    manifest,
    admission: admitUiVariantForRuntime({ manifest, surface: "live_owner_workbench", adapterKey: "owner_web", operatorAcknowledged: false }),
    acknowledged: admitUiVariantForRuntime({ manifest, surface: "live_owner_workbench", adapterKey: "owner_web", operatorAcknowledged: true }),
  }));
  return (
    <section className="ui-live-panel">
      <h1>Designs</h1>
      <p style={{ color: "#667085", maxWidth: 720 }}>
        Each design renders your live employee only when it is cleared for it. Designs still under review open for
        inspection only, and designs limited to sample data never receive live state here.
      </p>
      <div className="ui-live-grid">
        {decisions.map(({ manifest, admission, acknowledged }) => (
          <article className="ui-live-card" key={manifest.id} data-ui-variant={manifest.id} data-ui-variant-admission={admission.reason_code}>
            <strong>{manifest.name}</strong>
            <p>{manifest.summary}</p>
            <p style={{ color: admission.admitted ? "#166534" : "#854d0e", fontSize: 12, fontWeight: 750 }}>
              {admission.owner_message}
            </p>
            {admission.admitted ? (
              <a href={`${base}/${manifest.id}`}>Open over live employee</a>
            ) : acknowledged.admitted ? (
              <a href={`${base}/${manifest.id}?admission=lab_review`}>Open for review only</a>
            ) : (
              <a href="/ui-lab/fixtures">Open with sample data</a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
