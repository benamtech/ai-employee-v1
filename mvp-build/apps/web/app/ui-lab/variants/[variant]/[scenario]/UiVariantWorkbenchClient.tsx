"use client";

import { useMemo, useState } from "react";
import { UI_VARIANT_MANIFESTS } from "../../../../../ui-variants/registry.generated";
import { FIXTURE_SCENARIOS, type FixtureScenarioId } from "../../../../agent/[employeeId]/fixture-runtime";

const VIEWPORTS = {
  responsive: { label: "Responsive", width: "100%", height: 920 },
  desktop: { label: "Desktop 1440", width: 1440, height: 960 },
  tablet: { label: "Tablet 1024", width: 1024, height: 900 },
  mobile: { label: "Mobile 390", width: 390, height: 844 },
} as const;

type Viewport = keyof typeof VIEWPORTS;

export function UiVariantWorkbenchClient({ variantId, scenarioId }: { variantId: string; scenarioId: FixtureScenarioId }) {
  const [viewport, setViewport] = useState<Viewport>("responsive");
  const [adapter, setAdapter] = useState("owner_web");
  const [mode, setMode] = useState("workspace_fixture");
  const [revision, setRevision] = useState(0);
  const variant = UI_VARIANT_MANIFESTS.find((item) => item.id === variantId)!;
  const scenario = FIXTURE_SCENARIOS.find((item) => item.id === scenarioId)!;
  const spec = VIEWPORTS[viewport];
  const preview = useMemo(() => `/ui-lab/preview/${scenarioId}?variant=${encodeURIComponent(variantId)}&adapter=${adapter}&mode=${mode}&rev=${revision}`, [adapter, mode, revision, scenarioId, variantId]);

  return (
    <main className="variant-workbench">
      <style>{CSS}</style>
      <header>
        <div><small>AMTECH UI VARIANT</small><h1>{variant.name}</h1><p>{variant.description}</p></div>
        <nav>
          <button onClick={() => setRevision((value) => value + 1)}>Reload preview</button>
          <a href={preview} target="_blank" rel="noreferrer">Open alone</a>
        </nav>
      </header>
      <aside aria-label="Variant preview controls">
        <label>Variant<select value={variantId} onChange={(event) => location.assign(`/ui-lab/variants/${event.target.value}/${scenarioId}`)}>{UI_VARIANT_MANIFESTS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Scenario<select value={scenarioId} onChange={(event) => location.assign(`/ui-lab/variants/${variantId}/${event.target.value}`)}>{FIXTURE_SCENARIOS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Adapter<select value={adapter} onChange={(event) => setAdapter(event.target.value)}>{variant.adapters.map((item) => <option key={item} value={item}>{readable(item)}</option>)}</select></label>
        <label>Fixture mode<select value={mode} onChange={(event) => setMode(event.target.value)}><option value="workspace_fixture">Interactive fixture</option><option value="full_owner_client">Full owner-client slot</option></select></label>
        <label>Viewport<select value={viewport} onChange={(event) => setViewport(event.target.value as Viewport)}>{Object.entries(VIEWPORTS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
        <section><strong>Folder boundary</strong><code>apps/web/ui-variants/{variantId}/</code><span>{variant.conformance}</span><span>{variant.status}</span></section>
        <section><strong>Capabilities</strong>{variant.capabilities.map((item) => <span key={item}>{item}</span>)}</section>
        <p>Keep this browser open. Next Fast Refresh updates the isolated preview while the coding agent edits only the variant folder.</p>
      </aside>
      <section className="stage" aria-label={`${scenario.label} variant preview`}>
        <div className="device" style={{ width: spec.width, maxWidth: "100%", height: spec.height }}>
          <iframe key={preview} title={`${variant.name} preview`} src={preview} />
        </div>
      </section>
    </main>
  );
}

function readable(value: string) { return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

const CSS = `
.variant-workbench{min-height:100dvh;display:grid;grid-template-columns:320px minmax(0,1fr);grid-template-rows:auto 1fr;background:#0a0c11;color:#f5f7fb;font:14px/1.45 system-ui}.variant-workbench *{box-sizing:border-box}.variant-workbench header{grid-column:1/-1;display:flex;justify-content:space-between;gap:24px;padding:18px 22px;border-bottom:1px solid #292e38;background:#10131a}.variant-workbench header div{display:grid;gap:4px}.variant-workbench header small{color:#ff5d6c;font-weight:900;letter-spacing:.15em}.variant-workbench h1,.variant-workbench p{margin:0}.variant-workbench h1{font-size:24px}.variant-workbench header p{color:#99a2b3}.variant-workbench nav{display:flex;align-items:center;gap:8px}.variant-workbench button,.variant-workbench a{min-height:44px;padding:0 13px;border:1px solid #39404d;border-radius:9px;background:#1a1f29;color:#fff;text-decoration:none;font-weight:750}.variant-workbench aside{display:grid;align-content:start;gap:15px;padding:18px;border-right:1px solid #292e38;background:#12151c;overflow:auto}.variant-workbench label{display:grid;gap:6px;color:#aab2c1;font-size:12px;font-weight:800}.variant-workbench select{min-height:44px;padding:8px;border:1px solid #39404d;border-radius:9px;background:#1a1f29;color:#fff}.variant-workbench aside section{display:grid;gap:5px;padding:12px;border:1px solid #303744;border-radius:10px}.variant-workbench code{overflow-wrap:anywhere;color:#7aa7ff}.variant-workbench aside span,.variant-workbench aside p{color:#98a2b4}.variant-workbench .stage{min-width:0;padding:24px;overflow:auto;background:radial-gradient(circle at 50% 0,#252c3a,#0a0c11 60%)}.variant-workbench .device{margin:0 auto;border:1px solid #3a4250;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 30px 90px rgba(0,0,0,.45)}.variant-workbench iframe{width:100%;height:100%;border:0}@media(max-width:800px){.variant-workbench{grid-template-columns:1fr}.variant-workbench header{display:grid}.variant-workbench aside{border-right:0;border-bottom:1px solid #292e38}.variant-workbench .stage{padding:10px}}
`;
