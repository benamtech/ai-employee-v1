"use client";

import { useCallback, useEffect, useState } from "react";
import type { ResourcePayload, WorkEventRow } from "./surface-types";
import type { WorkResource, WorkAction, SurfaceEnvelope } from "@amtech/shared";
import { WorkObjectRenderer } from "./components/WorkObjectRenderer";
import { McpUiResource } from "./components/McpUiResource";

type PrimaryView = "home" | "talk" | "proof" | "connected";

interface Props {
  employeeId: string;
  fixtureMode: boolean;
}

const VIEWS: Array<{ id: PrimaryView; label: string }> = [
  { id: "home", label: "Home" },
  { id: "talk", label: "Talk" },
  { id: "proof", label: "Proof" },
  { id: "connected", label: "Connected" },
];

export function AgentSurface({ employeeId, fixtureMode }: Props) {
  const [res, setRes] = useState<ResourcePayload | null>(null);
  const [view, setView] = useState<PrimaryView>("home");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(!fixtureMode);
  const [progress, setProgress] = useState<string>("");

  const refresh = useCallback(async () => {
    if (fixtureMode) {
      // Minimal fixture path — reuse existing fixture builder if present
      setRes(null);
      setLoading(false);
      return;
    }
    const r = await fetch(`/api/employee/${employeeId}/resources`, { method: "POST" });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus(json.error ?? "Could not load work.");
      setLoading(false);
      return;
    }
    setRes(json);
    setLoading(false);
  }, [employeeId, fixtureMode]);

  // Live progress via SSE (progress-bus shape) — uses the thin proxy that forwards MANAGER_API.employeeStream
  useEffect(() => {
    if (fixtureMode) return;
    const es = new EventSource(`/api/employee/${employeeId}/stream`);
    es.onmessage = (ev) => {
      try {
        const p = JSON.parse(ev.data);
        if (p.verb) setProgress(p.verb);
        if (p.kind === "snapshot" && p.snapshot) setRes(p.snapshot);
      } catch {}
    };
    es.onerror = () => setProgress("");
    return () => es.close();
  }, [employeeId, fixtureMode]);

  useEffect(() => { refresh(); }, [refresh]);

  async function sendMessage() {
    if (!input.trim()) return;
    setStatus("Sending…");
    const body = input.trim();
    setInput("");
    const r = await fetch(`/api/employee/${employeeId}/message`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: body }),
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus(json.error ?? "Message failed.");
    } else {
      setStatus("");
      setProgress("");
      await refresh();
    }
  }

  if (loading) return <div className="p-8 text-sm text-neutral-500">Loading Avery…</div>;

  const attention = (res?.resurface_items ?? []).filter(i => i.status === "needs_you" || i.status === "blocked");
  const approvals = res?.approvals ?? [];
  const workEvents = (res?.work_events ?? []).slice(0, 12);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-semibold tracking-tight">Avery</div>
          <div className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">your employee</div>
        </div>
        <nav className="flex gap-1 text-sm">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1 rounded transition ${view === v.id ? "bg-white text-black" : "hover:bg-neutral-900"}`}
            >
              {v.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {status && <div className="mb-4 text-sm text-amber-400">{status}</div>}
        {progress && <div className="mb-4 text-xs text-emerald-400">Avery is working: {progress}</div>}

        {/* HOME — attention first, then live work objects */}
        {view === "home" && (
          <div className="space-y-8">
            <section>
              <div className="text-xs uppercase tracking-[2px] text-neutral-500 mb-3">Needs your say</div>
              {attention.length === 0 && <div className="text-sm text-neutral-500">Nothing waiting right now.</div>}
              {attention.map((item, idx) => (
                <div key={idx} className="mb-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-neutral-400 mt-1">{item.why}</div>
                </div>
              ))}
            </section>

            <section>
              <div className="text-xs uppercase tracking-[2px] text-neutral-500 mb-3">Recent work</div>
              {workEvents.length === 0 && <div className="text-sm text-neutral-500">No recent events.</div>}
              {workEvents.map((ev: WorkEventRow, idx: number) => (
                <div key={idx} className="mb-2 text-sm border-l-2 border-neutral-700 pl-3 text-neutral-300">
                  {ev.summary ?? ev.event_type}
                </div>
              ))}
            </section>
          </div>
        )}

        {/* TALK — command language only */}
        {view === "talk" && (
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-[2px] text-neutral-500">Tell Avery what happened or what you need</div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm outline-none"
                placeholder="e.g. Customer just paid the deposit"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage} className="px-6 rounded-xl bg-white text-black text-sm">Send</button>
            </div>
            <div className="text-[10px] text-neutral-500">Chat is the command language. Avery will create work objects, ask for approval, and leave proof.</div>
          </div>
        )}

        {/* PROOF — audit + what left the business */}
        {view === "proof" && (
          <div>
            <div className="text-xs uppercase tracking-[2px] text-neutral-500 mb-3">Proof ledger</div>
            {approvals.length === 0 && <div className="text-sm text-neutral-500">No approvals yet.</div>}
            {approvals.map((a, idx) => (
              <div key={idx} className="mb-2 text-sm border-l-2 border-emerald-700 pl-3 text-neutral-300">
                {a.kind} — {a.status}
              </div>
            ))}
          </div>
        )}

        {/* CONNECTED — accounts & connectors */}
        {view === "connected" && (
          <div>
            <div className="text-xs uppercase tracking-[2px] text-neutral-500 mb-3">Connected systems</div>
            <div className="text-sm text-neutral-500">Connector status and health will appear here.</div>
          </div>
        )}
      </div>
    </div>
  );
}
