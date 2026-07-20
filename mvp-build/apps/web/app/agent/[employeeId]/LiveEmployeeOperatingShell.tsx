"use client";

import { useEffect, useMemo, useState } from "react";
import { AgentSurface } from "./AgentSurface";

type LiveRun = {
  runId: string;
  messageId: string;
  text: string;
  activity: string;
  status: "streaming" | "completed" | "failed";
  lastSequence: number;
};

/**
 * The Web client is an employee operating environment, not a chat wrapper. The
 * durable AgentSurface remains the workspace; this console projects the current
 * Hermes run token-by-token with no authority of its own.
 */
export function LiveEmployeeOperatingShell({
  employeeId,
  fixtureMode,
}: {
  employeeId: string;
  fixtureMode: boolean;
}) {
  const [runs, setRuns] = useState<Record<string, LiveRun>>({});
  const [streamState, setStreamState] = useState<"live" | "reconnecting" | "offline">(fixtureMode ? "live" : "reconnecting");

  useEffect(() => {
    if (fixtureMode) return;
    let source: EventSource | null = null;
    let closed = false;
    let delay = 500;

    const updateDelta = (payload: Record<string, unknown>) => {
      const runId = typeof payload.run_id === "string" ? payload.run_id : "";
      const messageId = typeof payload.message_id === "string" ? payload.message_id : `assistant:${runId}`;
      const delta = typeof payload.delta === "string" ? payload.delta : "";
      const sequence = Number(payload.sequence ?? -1);
      if (!runId || !delta || !Number.isInteger(sequence) || sequence < 0) return;
      setRuns((current) => {
        const previous = current[runId];
        if (previous && sequence <= previous.lastSequence) return current;
        return {
          ...current,
          [runId]: {
            runId,
            messageId,
            text: `${previous?.text ?? ""}${delta}`,
            activity: previous?.activity ?? "Thinking",
            status: "streaming",
            lastSequence: sequence,
          },
        };
      });
    };

    const updateProgress = (payload: Record<string, unknown>) => {
      const runId = typeof payload.run_id === "string" ? payload.run_id : "";
      if (!runId) return;
      const activity = typeof payload.verb === "string" ? payload.verb : "Working";
      const state = typeof payload.state === "string" ? payload.state : "step";
      setRuns((current) => {
        const previous = current[runId] ?? {
          runId,
          messageId: `assistant:${runId}`,
          text: "",
          activity,
          status: "streaming" as const,
          lastSequence: -1,
        };
        return {
          ...current,
          [runId]: {
            ...previous,
            activity,
            status: state === "completed" ? previous.status : "streaming",
          },
        };
      });
    };

    const completeRun = (payload: Record<string, unknown>) => {
      const runId = typeof payload.run_id === "string" ? payload.run_id : "";
      if (!runId) return;
      const status = String(payload.status ?? "completed");
      setRuns((current) => {
        const previous = current[runId];
        if (!previous) return current;
        return {
          ...current,
          [runId]: {
            ...previous,
            activity: status === "failed" ? "Needs attention" : "Saved to the workspace",
            status: status === "failed" ? "failed" : "completed",
          },
        };
      });
    };

    function consume(event: Event) {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as Record<string, unknown>;
        const kind = String(payload.kind ?? (event as MessageEvent).type ?? "");
        if (kind === "assistant_delta") updateDelta(payload);
        else if (kind === "run_completed") completeRun(payload);
        else if (kind === "work_progress") updateProgress(payload);
      } catch {
        // Malformed projection frames are ignored; durable state remains authoritative.
      }
    }

    function connect() {
      if (closed) return;
      setStreamState("reconnecting");
      source = new EventSource(`/api/employee/${employeeId}/events`);
      source.addEventListener("open", () => {
        delay = 500;
        setStreamState("live");
      });
      source.addEventListener("assistant_delta", consume);
      source.addEventListener("work_progress", consume);
      source.addEventListener("run_completed", consume);
      source.onerror = () => {
        source?.close();
        if (closed) return;
        setStreamState("reconnecting");
        window.setTimeout(connect, delay);
        delay = Math.min(delay * 2, 10_000);
      };
    }

    connect();
    return () => {
      closed = true;
      source?.close();
    };
  }, [employeeId, fixtureMode]);

  const activeRuns = useMemo(
    () => Object.values(runs).sort((left, right) => right.runId.localeCompare(left.runId)).slice(0, 3),
    [runs],
  );

  return (
    <div className="employee-os-shell">
      <style>{SHELL_CSS}</style>
      <AgentSurface employeeId={employeeId} fixtureMode={fixtureMode} />
      {activeRuns.length ? (
        <aside className="employee-live-console" aria-label="Live employee run" aria-live="polite">
          <header>
            <div>
              <span className={`employee-live-dot ${streamState}`} aria-hidden />
              <strong>Live work</strong>
            </div>
            <small>{streamState === "live" ? "Streaming from the employee" : "Restoring the stream"}</small>
          </header>
          <div className="employee-live-runs">
            {activeRuns.map((run) => (
              <article key={run.runId} className={run.status}>
                <div className="employee-live-meta">
                  <span>{run.activity}</span>
                  <small>{run.status === "streaming" ? "now" : run.status}</small>
                </div>
                {run.text ? <p>{run.text}<span className="employee-live-caret" aria-hidden /></p> : <p className="quiet">The employee is working before the first words arrive.</p>}
              </article>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

const SHELL_CSS = `
  .employee-os-shell{min-height:100vh;background:#f4f2ed}
  .employee-live-console{position:fixed;right:18px;bottom:18px;z-index:80;width:min(440px,calc(100vw - 28px));max-height:min(58vh,620px);overflow:hidden;border:1px solid rgba(15,23,42,.14);border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 24px 70px rgba(15,23,42,.18);backdrop-filter:blur(16px)}
  .employee-live-console>header{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:13px 15px;border-bottom:1px solid rgba(15,23,42,.09);background:rgba(248,250,252,.92)}
  .employee-live-console header div{display:flex;align-items:center;gap:8px}.employee-live-console header strong{font-size:13px}.employee-live-console header small{font-size:11px;color:#64748b}
  .employee-live-dot{width:8px;height:8px;border-radius:999px;background:#eab308;box-shadow:0 0 0 4px rgba(234,179,8,.12)}.employee-live-dot.live{background:#16a34a;box-shadow:0 0 0 4px rgba(22,163,74,.12)}
  .employee-live-runs{overflow:auto;max-height:calc(min(58vh,620px) - 50px);padding:8px}
  .employee-live-runs article{padding:12px;border-radius:13px;background:#fff}.employee-live-runs article+article{margin-top:7px;border-top:1px solid #eef2f7}
  .employee-live-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px;color:#475569;font-size:11px;font-weight:650;text-transform:uppercase;letter-spacing:.04em}.employee-live-meta small{color:#94a3b8}
  .employee-live-runs p{white-space:pre-wrap;margin:0;color:#0f172a;font-size:14px;line-height:1.55}.employee-live-runs p.quiet{color:#64748b;font-style:italic}
  .employee-live-caret{display:inline-block;width:2px;height:1em;margin-left:2px;vertical-align:-2px;background:#dc2626;animation:employee-caret 1s steps(1) infinite}.employee-live-runs article.completed .employee-live-caret,.employee-live-runs article.failed .employee-live-caret{display:none}
  .employee-live-runs article.failed{background:#fff7f7}.employee-live-runs article.failed .employee-live-meta{color:#b91c1c}
  @keyframes employee-caret{50%{opacity:0}}
  @media(max-width:720px){.employee-live-console{right:8px;bottom:8px;width:calc(100vw - 16px);max-height:44vh}}
  @media(prefers-reduced-motion:reduce){.employee-live-caret{animation:none}}
`;
