"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUILTIN_EMPLOYEE_UI_COMPONENT_SETS,
  BUILTIN_EMPLOYEE_UI_LAYOUTS,
  BUILTIN_EMPLOYEE_UI_THEMES,
  type EmployeeUiAdapterKey,
  type EmployeeUiBrandTokens,
  type EmployeeUiComponentSetKey,
  type EmployeeUiLayoutKey,
  type EmployeeUiThemeKey,
  type UiLabPresetSummary,
} from "@amtech/shared";
import { EMPLOYEE_UI_ADAPTERS } from "../../_components/employee-ui/EmployeeUiPort";
import {
  FIXTURE_SCENARIOS,
  type FixtureRuntimeProjection,
  type FixtureScenarioId,
} from "../../agent/[employeeId]/fixture-runtime";
import {
  UI_LAB_PREVIEW_MODES,
  UI_LAB_VIEWPORTS,
  previewConfigFromPreset,
  scenarioPresentation,
} from "../ui-lab-config";
import type {
  UiLabPreviewConfig,
  UiLabPreviewMode,
} from "./ProductionFixtureLabClient";

const ADAPTER_KEYS = Object.keys(EMPLOYEE_UI_ADAPTERS) as EmployeeUiAdapterKey[];
const BRAND_KEYS = ["primary", "secondary", "accent", "canvas", "surface", "ink", "muted"] as const;
type ViewportKey = keyof typeof UI_LAB_VIEWPORTS;

interface RegistrySnapshot {
  presets: UiLabPresetSummary[];
  write_enabled: boolean;
  source: {
    git_sha: string | null;
    git_branch: string | null;
    dirty: boolean;
    changed_paths: string[];
    reproducible: boolean;
    captured_at: string;
  };
}

interface PreviewStateMessage {
  type: "amtech.ui-lab.preview-state";
  scenario_id: string;
  mode: UiLabPreviewMode;
  projection: FixtureRuntimeProjection;
  progress: string;
  notice: string;
  running: boolean;
}

interface PresetDraftState {
  id: string;
  display_name: string;
  description: string;
  profile_keys: string;
  business_kinds: string;
  employee_types: string;
  tags: string;
  captured_by: string;
  notes: string;
}

export function UiLabWorkbenchClient({
  scenarioId,
}: {
  scenarioId: FixtureScenarioId;
}) {
  const defaults = useMemo(() => scenarioPresentation(scenarioId), [scenarioId]);
  const [config, setConfig] = useState<UiLabPreviewConfig>(defaults);
  const [mode, setMode] = useState<UiLabPreviewMode>("full_owner_client");
  const [viewport, setViewport] = useState<ViewportKey>("responsive");
  const [registry, setRegistry] = useState<RegistrySnapshot | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [registryError, setRegistryError] = useState("");
  const [previewState, setPreviewState] = useState<PreviewStateMessage | null>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [fixtureCommand, setFixtureCommand] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [draft, setDraft] = useState<PresetDraftState>(() => ({
    id: scenarioId === "clothing-ops" ? "ecommerce-manager" : scenarioId === "office" ? "marketing-agency" : `${scenarioId}-ui`,
    display_name: `${readable(scenarioId)} UI`,
    description: `Presentation checkpoint for the ${readable(scenarioId)} fixture scenario.`,
    profile_keys: "",
    business_kinds: "",
    employee_types: "",
    tags: scenarioId,
    captured_by: "",
    notes: "",
  }));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const appliedQueryRef = useRef(false);

  const scenario = FIXTURE_SCENARIOS.find((item) => item.id === scenarioId)!;
  const preset = registry?.presets.find((item) => item.preset_ref === selectedPreset) ?? null;
  const previewUrl = useMemo(() => buildPreviewUrl(scenarioId, config, mode), [config, mode, scenarioId]);
  const viewportSpec = UI_LAB_VIEWPORTS[viewport];

  async function refreshRegistry(applyQuery = false) {
    try {
      const response = await fetch("/api/ui-lab/presets", { cache: "no-store" });
      if (!response.ok) throw new Error(`registry_http_${response.status}`);
      const next = await response.json() as RegistrySnapshot;
      setRegistry(next);
      setRegistryError("");
      if (applyQuery && !appliedQueryRef.current) {
        appliedQueryRef.current = true;
        const query = new URLSearchParams(window.location.search);
        const ref = query.get("preset");
        const requestedViewport = query.get("viewport");
        const requestedMode = query.get("mode");
        if (requestedViewport && requestedViewport in UI_LAB_VIEWPORTS) setViewport(requestedViewport as ViewportKey);
        if (requestedMode && UI_LAB_PREVIEW_MODES.includes(requestedMode as UiLabPreviewMode)) setMode(requestedMode as UiLabPreviewMode);
        if (ref) {
          const match = next.presets.find((item) => item.preset_ref === ref);
          if (match) applyPreset(match);
        }
      }
    } catch (error) {
      setRegistryError(error instanceof Error ? error.message : String(error));
    }
  }

  useEffect(() => {
    void refreshRegistry(true);
  }, []);

  useEffect(() => {
    const receive = (event: MessageEvent<PreviewStateMessage>) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === "amtech.ui-lab.preview-state") setPreviewState(event.data);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  useEffect(() => {
    const query = new URLSearchParams();
    if (selectedPreset) query.set("preset", selectedPreset);
    if (viewport !== "responsive") query.set("viewport", viewport);
    if (mode !== "full_owner_client") query.set("mode", mode);
    const suffix = query.size ? `?${query}` : "";
    window.history.replaceState(null, "", `/ui-lab/${scenarioId}${suffix}`);
  }, [mode, scenarioId, selectedPreset, viewport]);

  function applyPreset(next: UiLabPresetSummary) {
    setSelectedPreset(next.preset_ref);
    setConfig(previewConfigFromPreset(next.adapter_key, next.presentation));
    setDraft((current) => ({
      ...current,
      id: next.id,
      display_name: next.display_name,
      description: next.description,
      profile_keys: next.targets.profile_keys.join(", "),
      business_kinds: next.targets.business_kinds.join(", "),
      employee_types: next.targets.employee_types.join(", "),
      tags: next.tags.join(", "),
    }));
  }

  function resetPresentation() {
    setSelectedPreset("");
    setConfig(defaults);
    setMode("full_owner_client");
    setPreviewState(null);
  }

  function sendPreviewCommand(action: "reset" | "heartbeat-gap" | "recover" | "submit", body?: string) {
    iframeRef.current?.contentWindow?.postMessage({ type: "amtech.ui-lab.command", action, body }, window.location.origin);
    if (action === "submit") setFixtureCommand("");
  }

  async function saveDraft() {
    setSaveState("saving");
    setSaveMessage("");
    try {
      const response = await fetch("/api/ui-lab/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draft.id.trim(),
          display_name: draft.display_name.trim(),
          description: draft.description.trim(),
          scenario_id: scenarioId,
          adapter_key: config.adapterKey,
          presentation: {
            theme_key: config.themeKey,
            layout_key: config.layoutKey,
            component_set_key: config.componentSetKey,
            density: config.density,
            brand: config.brand,
          },
          targets: {
            profile_keys: csv(draft.profile_keys),
            business_kinds: csv(draft.business_kinds),
            employee_types: csv(draft.employee_types),
          },
          review_viewports: ["desktop", "tablet", "mobile"],
          tags: csv(draft.tags).map(slug),
          ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
          ...(draft.captured_by.trim() ? { captured_by: draft.captured_by.trim() } : {}),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail ?? result.error ?? `save_http_${response.status}`);
      setSaveState("saved");
      setSaveMessage(`Saved ${result.preset.preset_ref}${result.preset.source.dirty ? " as a non-reproducible dirty draft" : ""}.`);
      await refreshRegistry();
      setSelectedPreset(result.preset.preset_ref);
    } catch (error) {
      setSaveState("failed");
      setSaveMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function copyReviewLink() {
    await navigator.clipboard.writeText(window.location.href);
    setSaveMessage("Review link copied.");
  }

  return (
    <main className="ui-lab-workbench">
      <style>{WORKBENCH_CSS}</style>
      <header className="workbench-topbar">
        <div className="workbench-brand">
          <Link href="/ui-lab">AMTECH<span>.</span></Link>
          <div><strong>UI Lab</strong><small>live production-component workbench</small></div>
        </div>
        <div className="workbench-status">
          <span className={previewLoaded ? "live" : "loading"}>{previewLoaded ? "Preview live" : "Loading preview"}</span>
          <button type="button" onClick={() => void refreshRegistry()}>Refresh source</button>
          <button type="button" onClick={() => void copyReviewLink()}>Copy review link</button>
          <a href={previewUrl} target="_blank" rel="noreferrer">Open preview</a>
        </div>
      </header>

      <div className="workbench-layout">
        <aside className="workbench-panel" aria-label="UI Lab controls">
          <section>
            <p className="eyebrow">Fixture scenario</p>
            <h1>{scenario.label}</h1>
            <span>{scenario.summary}</span>
            <label>Scenario
              <select value={scenarioId} onChange={(event) => { window.location.href = `/ui-lab/${event.target.value}`; }}>
                {FIXTURE_SCENARIOS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
          </section>

          <section>
            <div className="section-heading"><div><p className="eyebrow">Versioned UI</p><h2>Preset</h2></div><button type="button" onClick={resetPresentation}>Defaults</button></div>
            <label>Saved version
              <select value={selectedPreset} onChange={(event) => {
                const match = registry?.presets.find((item) => item.preset_ref === event.target.value);
                if (match) applyPreset(match); else resetPresentation();
              }}>
                <option value="">Unsaved scenario defaults</option>
                {(registry?.presets ?? []).map((item) => <option key={item.preset_ref} value={item.preset_ref}>{item.display_name} · v{item.version} · {item.status}</option>)}
              </select>
            </label>
            {preset ? <div className="preset-meta"><strong>{preset.preset_ref}</strong><span>Intended scenario: {readable(preset.scenario_id)}</span><span>{preset.source.reproducible ? "Reproducible source" : "Dirty/non-reproducible checkpoint"}</span></div> : null}
          </section>

          <section>
            <p className="eyebrow">Production experience</p>
            <div className="control-grid">
              <label>Preview mode<select value={mode} onChange={(event) => setMode(event.target.value as UiLabPreviewMode)}>{UI_LAB_PREVIEW_MODES.map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></label>
              <label>Adapter<select value={config.adapterKey} onChange={(event) => setConfig((current) => ({ ...current, adapterKey: event.target.value as EmployeeUiAdapterKey }))}>{ADAPTER_KEYS.map((value) => <option key={value} value={value}>{EMPLOYEE_UI_ADAPTERS[value].label}</option>)}</select></label>
              <label>Theme<select value={config.themeKey} onChange={(event) => setConfig((current) => ({ ...current, themeKey: event.target.value as EmployeeUiThemeKey }))}>{withCurrent(BUILTIN_EMPLOYEE_UI_THEMES, config.themeKey).map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></label>
              <label>Layout<select value={config.layoutKey} onChange={(event) => setConfig((current) => ({ ...current, layoutKey: event.target.value as EmployeeUiLayoutKey }))}>{withCurrent(BUILTIN_EMPLOYEE_UI_LAYOUTS, config.layoutKey).map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></label>
              <label>Components<select value={config.componentSetKey} onChange={(event) => setConfig((current) => ({ ...current, componentSetKey: event.target.value as EmployeeUiComponentSetKey }))}>{withCurrent(BUILTIN_EMPLOYEE_UI_COMPONENT_SETS, config.componentSetKey).map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></label>
              <label>Density<select value={config.density} onChange={(event) => setConfig((current) => ({ ...current, density: event.target.value as UiLabPreviewConfig["density"] }))}><option value="calm">Calm</option><option value="balanced">Balanced</option><option value="dense">Dense</option></select></label>
              <label>Viewport<select value={viewport} onChange={(event) => setViewport(event.target.value as ViewportKey)}>{Object.entries(UI_LAB_VIEWPORTS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
            </div>
          </section>

          <details>
            <summary>Brand tokens</summary>
            <div className="color-grid">
              {BRAND_KEYS.map((key) => <label key={key}>{readable(key)}<span><input type="color" value={config.brand[key] ?? fallbackColor(key)} onChange={(event) => setConfig((current) => ({ ...current, brand: { ...current.brand, [key]: event.target.value } }))} /><input aria-label={`${readable(key)} hex`} value={config.brand[key] ?? ""} placeholder="#000000" onChange={(event) => setConfig((current) => ({ ...current, brand: { ...current.brand, [key]: event.target.value || undefined } }))} /></span></label>)}
            </div>
          </details>

          <details open>
            <summary>Save a new immutable draft version</summary>
            <div className="save-form">
              <label>Preset id<input value={draft.id} onChange={(event) => setDraft((current) => ({ ...current, id: slug(event.target.value) }))} /></label>
              <label>Display name<input value={draft.display_name} onChange={(event) => setDraft((current) => ({ ...current, display_name: event.target.value }))} /></label>
              <label>Description<textarea rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
              <label>Profile keys<input placeholder="marketing_agency, ecommerce_manager" value={draft.profile_keys} onChange={(event) => setDraft((current) => ({ ...current, profile_keys: event.target.value }))} /></label>
              <label>Business kinds<input placeholder="marketing agency, online retail" value={draft.business_kinds} onChange={(event) => setDraft((current) => ({ ...current, business_kinds: event.target.value }))} /></label>
              <label>Employee types<input value={draft.employee_types} onChange={(event) => setDraft((current) => ({ ...current, employee_types: event.target.value }))} /></label>
              <label>Tags<input value={draft.tags} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))} /></label>
              <label>Captured by<input placeholder="Collaborator name" value={draft.captured_by} onChange={(event) => setDraft((current) => ({ ...current, captured_by: event.target.value }))} /></label>
              <label>Notes<textarea rows={3} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} /></label>
              <button type="button" className="primary" disabled={!registry?.write_enabled || saveState === "saving" || !draft.id || !draft.display_name || !draft.description} onClick={() => void saveDraft()}>{saveState === "saving" ? "Saving…" : "Save next draft version"}</button>
              {!registry?.write_enabled ? <small>Writes are disabled. Start with <code>npm run ui:lab</code> on loopback.</small> : null}
              {saveMessage ? <output className={saveState}>{saveMessage}</output> : null}
            </div>
          </details>

          <section>
            <p className="eyebrow">Source provenance</p>
            {registry ? <div className={`source-card ${registry.source.dirty ? "dirty" : "clean"}`}><strong>{registry.source.dirty ? "Dirty worktree" : "Clean commit"}</strong><span>{shortSha(registry.source.git_sha)} · {registry.source.git_branch ?? "detached"}</span>{registry.source.changed_paths.length ? <small>{registry.source.changed_paths.slice(0, 5).join(", ")}{registry.source.changed_paths.length > 5 ? ` +${registry.source.changed_paths.length - 5}` : ""}</small> : null}</div> : <span>Loading source state…</span>}
            {registryError ? <output className="failed">{registryError}</output> : null}
          </section>
        </aside>

        <section className="workbench-canvas" aria-label="Production UI preview canvas">
          <div className="canvas-toolbar">
            <div><strong>{viewportSpec.label}</strong><span>{typeof viewportSpec.width === "number" ? `${viewportSpec.width} × ${viewportSpec.height}` : "fluid width"}</span></div>
            <div className="canvas-state"><span>{previewState ? `${readable(previewState.projection.health)} · ${readable(previewState.projection.phase)}` : "Waiting for preview"}</span><small>{previewState?.notice ?? "The iframe uses the actual Next application and production components."}</small></div>
          </div>
          <div className="device-stage">
            <div className="device-frame" style={{ width: viewportSpec.width, maxWidth: "100%", height: viewportSpec.height }}>
              <iframe ref={iframeRef} title={`${scenario.label} production UI preview`} src={previewUrl} onLoad={() => setPreviewLoaded(true)} />
            </div>
          </div>
          <div className="runtime-harness" aria-label="Fixture runtime controls">
            <button type="button" onClick={() => sendPreviewCommand("reset")}>Reset fixture</button>
            <button type="button" disabled={mode !== "workspace_fixture"} onClick={() => sendPreviewCommand("heartbeat-gap")}>Heartbeat gap</button>
            <button type="button" disabled={mode !== "workspace_fixture"} onClick={() => sendPreviewCommand("recover")}>Recover</button>
            <label>Fixture interaction<input value={fixtureCommand} disabled={mode !== "workspace_fixture"} onChange={(event) => setFixtureCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && fixtureCommand.trim()) sendPreviewCommand("submit", fixtureCommand); }} /></label>
            <button type="button" disabled={mode !== "workspace_fixture" || !fixtureCommand.trim()} onClick={() => sendPreviewCommand("submit", fixtureCommand)}>Run</button>
            <small>{mode === "workspace_fixture" ? previewState?.progress : "Switch to Workspace Fixture to drive deterministic runtime transitions from the workbench."}</small>
          </div>
        </section>
      </div>
    </main>
  );
}

function buildPreviewUrl(scenarioId: string, config: UiLabPreviewConfig, mode: UiLabPreviewMode): string {
  const query = new URLSearchParams({
    adapter: config.adapterKey,
    theme: config.themeKey,
    layout: config.layoutKey,
    components: config.componentSetKey,
    density: config.density,
    mode,
  });
  for (const key of BRAND_KEYS) if (config.brand[key]) query.set(`brand_${key}`, config.brand[key]!);
  return `/ui-lab/preview/${scenarioId}?${query}`;
}

function csv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function slug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function readable(value: string): string {
  return value.replace(/[_:-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function withCurrent<T extends string>(values: readonly T[], current: string): string[] {
  return values.includes(current as T) ? [...values] : [current, ...values];
}

function shortSha(value: string | null): string {
  return value ? value.slice(0, 12) : "no-git-sha";
}

function fallbackColor(key: typeof BRAND_KEYS[number]): string {
  return { primary: "#e11d2a", secondary: "#2563eb", accent: "#dff6ff", canvas: "#f7f9fc", surface: "#ffffff", ink: "#111111", muted: "#667085" }[key];
}

const WORKBENCH_CSS = `
  .ui-lab-workbench{min-height:100dvh;background:#0b0d12;color:#f4f6fb;font-family:var(--font-inter),Inter,ui-sans-serif,system-ui,sans-serif}.ui-lab-workbench *{box-sizing:border-box}.workbench-topbar{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:64px;padding:10px 18px;border-bottom:1px solid #262a33;background:rgba(11,13,18,.96);backdrop-filter:blur(18px)}.workbench-brand{display:flex;align-items:center;gap:14px}.workbench-brand>a{font-weight:950;color:#fff;text-decoration:none;letter-spacing:-.04em}.workbench-brand>a span{color:#ff3446}.workbench-brand>div{display:grid}.workbench-brand small{color:#8f98aa}.workbench-status{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.workbench-status>span{padding:7px 10px;border-radius:999px;font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.08em}.workbench-status>span.live{background:#133d2b;color:#7ef0b1}.workbench-status>span.loading{background:#3b3214;color:#f7d977}.ui-lab-workbench button,.ui-lab-workbench a,.ui-lab-workbench input,.ui-lab-workbench select,.ui-lab-workbench textarea{font:inherit}.workbench-status button,.workbench-status a,.section-heading button,.runtime-harness button{min-height:38px;padding:0 12px;border:1px solid #363c48;border-radius:9px;background:#161a22;color:#e7eaf0;text-decoration:none;font-weight:750}.workbench-layout{display:grid;grid-template-columns:360px minmax(0,1fr);min-height:calc(100dvh - 64px)}.workbench-panel{position:sticky;top:64px;align-self:start;height:calc(100dvh - 64px);overflow:auto;padding:18px;border-right:1px solid #262a33;background:#11141b}.workbench-panel section,.workbench-panel details{display:grid;gap:12px;padding:16px 0;border-bottom:1px solid #262a33}.workbench-panel h1{margin:3px 0;font-size:26px;line-height:1.05;letter-spacing:-.04em}.workbench-panel h2{margin:2px 0;font-size:18px}.workbench-panel section>span,.workbench-panel small,.preset-meta span{color:#929bad;line-height:1.5}.eyebrow{margin:0;color:#ff5a68;font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.workbench-panel label{display:grid;gap:6px;color:#afb6c4;font-size:11px;font-weight:800}.workbench-panel input,.workbench-panel select,.workbench-panel textarea,.runtime-harness input{width:100%;min-height:42px;padding:9px 11px;border:1px solid #343a46;border-radius:9px;background:#191d25;color:#fff;outline:none}.workbench-panel textarea{resize:vertical}.workbench-panel input:focus-visible,.workbench-panel select:focus-visible,.workbench-panel textarea:focus-visible,.ui-lab-workbench button:focus-visible,.ui-lab-workbench a:focus-visible,.runtime-harness input:focus-visible{outline:3px solid #7aa7ff;outline-offset:2px}.section-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.control-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.preset-meta,.source-card{display:grid;gap:4px;padding:11px;border:1px solid #303642;border-radius:10px;background:#171b23}.preset-meta strong{color:#fff}.source-card.clean{border-color:#23543c}.source-card.dirty{border-color:#775d1f}.source-card small{overflow-wrap:anywhere}.workbench-panel summary{cursor:pointer;font-weight:850;color:#fff}.color-grid{display:grid;gap:9px;margin-top:12px}.color-grid label span{display:grid;grid-template-columns:42px 1fr;gap:8px}.color-grid input[type=color]{padding:3px}.save-form{display:grid;gap:10px;margin-top:12px}.save-form .primary{min-height:46px;border:0;border-radius:10px;background:#ff3446;color:#fff;font-weight:900}.save-form .primary:disabled{opacity:.45}.save-form output,.workbench-panel output{display:block;padding:10px;border-radius:8px;background:#192235;color:#bcd1ff;overflow-wrap:anywhere}.save-form output.failed,.workbench-panel output.failed{background:#35191d;color:#ffbdc4}.workbench-panel code{color:#fff}.workbench-canvas{min-width:0;background:radial-gradient(circle at 50% 0,#242936 0,transparent 36rem),#0b0d12}.canvas-toolbar{position:sticky;top:64px;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:62px;padding:10px 18px;border-bottom:1px solid #272c36;background:rgba(14,17,23,.94);backdrop-filter:blur(14px)}.canvas-toolbar>div{display:grid;gap:3px}.canvas-toolbar span,.canvas-toolbar small{color:#929bad}.canvas-state{text-align:right;max-width:620px}.device-stage{display:flex;justify-content:center;align-items:flex-start;min-height:calc(100dvh - 220px);padding:28px;overflow:auto}.device-frame{position:relative;flex:0 0 auto;border:1px solid #424956;border-radius:15px;background:#fff;box-shadow:0 24px 80px rgba(0,0,0,.44);overflow:hidden;transition:width .2s ease,height .2s ease}.device-frame iframe{display:block;width:100%;height:100%;border:0;background:#fff}.runtime-harness{position:sticky;bottom:0;z-index:60;display:grid;grid-template-columns:auto auto auto minmax(220px,1fr) auto;align-items:end;gap:8px;padding:12px 18px;border-top:1px solid #292e38;background:rgba(13,15,21,.96);backdrop-filter:blur(18px)}.runtime-harness label{display:grid;gap:5px;color:#aab2c1;font-size:11px;font-weight:800}.runtime-harness small{grid-column:1/-1;color:#8e97a8}.runtime-harness button:disabled{opacity:.4}.ui-lab-workbench button:hover:not(:disabled),.ui-lab-workbench a:hover{border-color:#667085;background:#202530}@media(max-width:1050px){.workbench-layout{grid-template-columns:310px minmax(0,1fr)}.control-grid{grid-template-columns:1fr}.runtime-harness{grid-template-columns:repeat(3,auto) minmax(180px,1fr) auto}}@media(max-width:780px){.workbench-topbar{position:relative;align-items:flex-start;flex-direction:column}.workbench-layout{display:block}.workbench-panel{position:relative;top:auto;width:100%;height:auto;border-right:0}.canvas-toolbar{top:0}.device-stage{padding:14px}.runtime-harness{position:relative;grid-template-columns:1fr 1fr}.runtime-harness label,.runtime-harness small{grid-column:1/-1}}@media(prefers-reduced-motion:reduce){.device-frame{transition:none}}
`;
