"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Draft = {
  artifact_id: string;
  html: string;
  text: string;
  payload: Record<string, unknown>;
};

type ChatMessage = { id: string; role: "visitor" | "employee"; body: string; status?: "sending" | "failed" };

const STARTER = "I need an estimate for repainting two bedrooms. Walls only, average size rooms, standard prep, customer wants it done this month.";

export function FreeEstimatorClient() {
  const [visitorSessionId, setVisitorSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(STARTER);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Starting Avery.");
  const [busy, setBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [trialClicked, setTrialClicked] = useState(false);

  const canAct = Boolean(visitorSessionId && draft);

  const createSession = useCallback(async () => {
    const res = await fetch("/api/public-estimator/session", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(json.message ?? "Avery is not available right now.");
      return;
    }
    setVisitorSessionId(String(json.visitor_session_id ?? ""));
    setStatus(json.resumed ? "Your draft session is open." : "Avery is ready.");
  }, []);

  const refreshDraft = useCallback(async (sessionId = visitorSessionId) => {
    if (!sessionId) return;
    const res = await fetch(`/api/public-estimator/current-draft?visitor_session_id=${encodeURIComponent(sessionId)}`);
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.current_draft) setDraft(json.current_draft);
  }, [visitorSessionId]);

  useEffect(() => { void createSession(); }, [createSession]);
  useEffect(() => { if (visitorSessionId) void refreshDraft(visitorSessionId); }, [visitorSessionId, refreshDraft]);

  async function send() {
    const text = input.trim();
    if (!text || !visitorSessionId || busy) return;
    setInput("");
    setBusy(true);
    const pendingId = `visitor:${Date.now()}`;
    setMessages((m) => [...m, { id: pendingId, role: "visitor", body: text, status: "sending" }]);
    setStatus("Avery is drafting.");
    const res = await fetch("/api/public-estimator/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_session_id: visitorSessionId, message: text }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMessages((m) => m.map((msg) => msg.id === pendingId ? { ...msg, status: "failed" } : msg));
      setStatus(json.message ?? "Avery could not finish that.");
      return;
    }
    setMessages((m) => [
      ...m.map((msg) => msg.id === pendingId ? { ...msg, status: undefined } : msg),
      ...(json.reply ? [{ id: `employee:${Date.now()}`, role: "employee" as const, body: String(json.reply) }] : []),
    ]);
    if (json.current_draft) setDraft(json.current_draft);
    setStatus(json.current_draft ? "Draft ready." : "Avery replied.");
  }

  async function action(actionName: "copy" | "download" | "trial_intent") {
    if (!visitorSessionId) return;
    const res = await fetch("/api/public-estimator/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_session_id: visitorSessionId, action: actionName }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(json.message ?? "That action is not available.");
      return;
    }
    if (actionName === "copy") {
      await navigator.clipboard?.writeText(String(json.text ?? draft?.text ?? ""));
      setStatus("Draft copied.");
    } else if (actionName === "download") {
      const blob = new Blob([String(json.body ?? "")], { type: String(json.mime_type ?? "text/html") });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = String(json.filename ?? "amtech-estimate-draft.html");
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Draft downloaded.");
    } else {
      setTrialClicked(true);
      setStatus("Trial intent recorded.");
    }
  }

  async function sendEmail() {
    if (!visitorSessionId || emailBusy) return;
    setEmailBusy(true);
    const res = await fetch("/api/public-estimator/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_session_id: visitorSessionId, email }),
    });
    const json = await res.json().catch(() => ({}));
    setEmailBusy(false);
    setStatus(res.ok ? "Draft email recorded." : json.message ?? "Email is not available.");
  }

  const transcript = useMemo(() => messages.length ? messages : [
    { id: "seed", role: "employee" as const, body: "Send one real job note. I will ask for missing facts or draft the estimate with line items and assumptions." },
  ], [messages]);

  return (
    <main className="pe-root">
      <style>{CSS}</style>
      <header className="pe-top">
        <Link className="pe-logo" href="/">AMTECH<span>.</span></Link>
        <nav>
          <Link href="/create-ai-employee">Create your employee</Link>
          <Link href="/login">Sign in</Link>
        </nav>
      </header>

      <section className="pe-shell">
        <div className="pe-chat">
          <div className="pe-head">
            <p>Free estimator employee</p>
            <h1>Try Avery on one real job.</h1>
            <span>{status}</span>
          </div>
          <div className="pe-thread" aria-live="polite">
            {transcript.map((m) => (
              <div key={m.id} className={`pe-msg ${m.role}`}>
                <span>{m.role === "visitor" ? "You" : "Avery"}</span>
                <p>{m.body}</p>
                {m.status === "sending" && <em>Sending</em>}
                {m.status === "failed" && <em>Failed</em>}
              </div>
            ))}
          </div>
          <div className="pe-compose">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5} />
            <button type="button" onClick={send} disabled={!visitorSessionId || busy}>{busy ? "Drafting" : "Send to Avery"}</button>
          </div>
        </div>

        <aside className="pe-draft">
          <div className="pe-draft-bar">
            <div>
              <p>Current draft</p>
              <strong>{draft ? "Estimate draft" : "Waiting for job details"}</strong>
            </div>
            <div className="pe-actions">
              <button type="button" onClick={() => void action("copy")} disabled={!canAct}>Copy</button>
              <button type="button" onClick={() => void action("download")} disabled={!canAct}>Download HTML</button>
            </div>
          </div>
          {draft ? (
            <iframe title="Estimate draft" sandbox="" srcDoc={draft.html} />
          ) : (
            <div className="pe-empty">
              <strong>No draft yet.</strong>
              <p>Avery will show the first structured estimate here once there is enough scope to price.</p>
            </div>
          )}
          <div className="pe-email">
            <label>
              Email this draft to me
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@company.com" />
            </label>
            <button type="button" onClick={sendEmail} disabled={!canAct || emailBusy}>{emailBusy ? "Sending" : "Send draft"}</button>
          </div>
          <div className="pe-trial">
            <p>Want this estimator to remember your pricing, format, materials, service area, and follow-up rules?</p>
            <Link onClick={() => void action("trial_intent")} href="/create-ai-employee">
              {trialClicked ? "Continue setup" : "Start the free trial"}
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

const CSS = `
  .pe-root{min-height:100vh;background:#fff;color:#0a0a0a;font-family:var(--font-inter),Inter,-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif}
  .pe-top{height:58px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(10,10,10,.12);padding:0 20px}
  .pe-logo{font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;text-decoration:none;color:#0a0a0a;font-weight:700;letter-spacing:.09em}
  .pe-logo span{color:#e11d2a}.pe-top nav{display:flex;gap:16px}.pe-top nav a{font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#0a0a0a;text-decoration:none}.pe-top nav a:hover{color:#e11d2a}
  .pe-shell{display:grid;grid-template-columns:minmax(320px,440px) 1fr;min-height:calc(100vh - 58px)}
  .pe-chat{border-right:1px solid rgba(10,10,10,.12);display:grid;grid-template-rows:auto 1fr auto;min-height:calc(100vh - 58px)}
  .pe-head{padding:22px 20px;border-bottom:1px solid rgba(10,10,10,.08)}.pe-head p,.pe-draft-bar p{font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:10px;color:#e11d2a;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px}.pe-head h1{font-size:30px;line-height:1.05;margin:0 0 12px;font-weight:900;letter-spacing:0}.pe-head span{font-size:14px;color:rgba(10,10,10,.58)}
  .pe-thread{padding:18px 20px;display:flex;flex-direction:column;gap:12px;overflow:auto}.pe-msg{border-left:3px solid rgba(10,10,10,.18);padding:10px 12px;background:#fafafa}.pe-msg.visitor{border-left-color:#e11d2a;background:#fff}.pe-msg span{font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(10,10,10,.55)}.pe-msg p{margin:5px 0 0;line-height:1.5;font-size:15px}.pe-msg em{display:block;margin-top:6px;font-style:normal;font-size:12px;color:#e11d2a}
  .pe-compose{border-top:1px solid rgba(10,10,10,.12);padding:14px;display:grid;gap:10px}.pe-compose textarea{width:100%;resize:vertical;border:1px solid rgba(10,10,10,.18);padding:12px;font:inherit;line-height:1.45}.pe-compose button,.pe-actions button,.pe-email button,.pe-trial a{height:42px;border:1px solid #e11d2a;background:#e11d2a;color:#fff;font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:11px;text-transform:uppercase;letter-spacing:.07em;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;padding:0 14px}.pe-compose button:disabled,.pe-actions button:disabled,.pe-email button:disabled{opacity:.45;cursor:not-allowed}.pe-actions button{background:#fff;color:#e11d2a}
  .pe-draft{display:grid;grid-template-rows:auto 1fr auto auto;min-height:calc(100vh - 58px);background:#f7f7f7}.pe-draft-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border-bottom:1px solid rgba(10,10,10,.12);background:#fff}.pe-draft-bar strong{font-size:18px}.pe-actions{display:flex;gap:8px;flex-wrap:wrap}
  .pe-draft iframe{width:100%;height:100%;border:0;background:#fff}.pe-empty{padding:28px;align-self:start}.pe-empty strong{font-size:20px}.pe-empty p{color:rgba(10,10,10,.6);line-height:1.5;max-width:420px}
  .pe-email{display:flex;gap:10px;align-items:end;padding:14px 18px;background:#fff;border-top:1px solid rgba(10,10,10,.12)}.pe-email label{flex:1;font-family:var(--font-plex-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(10,10,10,.62)}.pe-email input{display:block;width:100%;height:42px;margin-top:6px;border:1px solid rgba(10,10,10,.18);font:14px var(--font-inter),Inter,sans-serif;padding:0 10px;text-transform:none;letter-spacing:0}
  .pe-trial{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 18px;background:#e11d2a;color:#fff}.pe-trial p{margin:0;line-height:1.45;font-weight:700;max-width:700px}.pe-trial a{background:#fff;color:#e11d2a;border-color:#fff;white-space:nowrap}
  @media(max-width:900px){.pe-shell{grid-template-columns:1fr}.pe-chat{border-right:0;border-bottom:1px solid rgba(10,10,10,.12);min-height:auto}.pe-draft{min-height:70vh}.pe-top nav{display:none}.pe-email,.pe-trial,.pe-draft-bar{align-items:stretch;flex-direction:column}.pe-actions{width:100%}.pe-actions button,.pe-email button,.pe-trial a{width:100%}}
`;
