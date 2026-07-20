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
    const response = await fetch("/api/public-estimator/session", { method: "POST" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.message ?? "Avery is not available right now.");
      return;
    }
    setVisitorSessionId(String(json.visitor_session_id ?? ""));
    setStatus(json.resumed ? "Your draft session is open." : "Avery is ready.");
  }, []);

  const refreshDraft = useCallback(async (sessionId = visitorSessionId) => {
    if (!sessionId) return;
    const response = await fetch(`/api/public-estimator/current-draft?visitor_session_id=${encodeURIComponent(sessionId)}`);
    const json = await response.json().catch(() => ({}));
    if (response.ok && json.current_draft) setDraft(json.current_draft);
  }, [visitorSessionId]);

  useEffect(() => { void createSession(); }, [createSession]);
  useEffect(() => { if (visitorSessionId) void refreshDraft(visitorSessionId); }, [visitorSessionId, refreshDraft]);

  async function send() {
    const text = input.trim();
    if (!text || !visitorSessionId || busy) return;
    setInput("");
    setBusy(true);
    const pendingId = `visitor:${Date.now()}`;
    setMessages((current) => [...current, { id: pendingId, role: "visitor", body: text, status: "sending" }]);
    setStatus("Avery is drafting.");
    const response = await fetch("/api/public-estimator/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_session_id: visitorSessionId, message: text }),
    });
    const json = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessages((current) => current.map((message) => message.id === pendingId ? { ...message, status: "failed" } : message));
      setStatus(json.message ?? "Avery could not finish that.");
      return;
    }
    setMessages((current) => [
      ...current.map((message) => message.id === pendingId ? { ...message, status: undefined } : message),
      ...(json.reply ? [{ id: `employee:${Date.now()}`, role: "employee" as const, body: String(json.reply) }] : []),
    ]);
    if (json.current_draft) setDraft(json.current_draft);
    setStatus(json.current_draft ? "Draft ready." : "Avery replied.");
  }

  async function action(actionName: "copy" | "download" | "trial_intent") {
    if (!visitorSessionId) return;
    const response = await fetch("/api/public-estimator/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_session_id: visitorSessionId, action: actionName }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(json.message ?? "That action is not available.");
      return;
    }
    if (actionName === "copy") {
      await navigator.clipboard?.writeText(String(json.text ?? draft?.text ?? ""));
      setStatus("Draft copied.");
    } else if (actionName === "download") {
      const blob = new Blob([String(json.body ?? "")], { type: String(json.mime_type ?? "text/html") });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = String(json.filename ?? "amtech-estimate-draft.html");
      anchor.click();
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
    const response = await fetch("/api/public-estimator/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_session_id: visitorSessionId, email }),
    });
    const json = await response.json().catch(() => ({}));
    setEmailBusy(false);
    setStatus(response.ok ? "Draft email recorded." : json.message ?? "Email is not available.");
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
            <p>Non-canonical preview · free estimator</p>
            <h1>Try one constrained employee task.</h1>
            <span>{status} This preview does not represent the production operating surface or launch proof.</span>
          </div>
          <div className="pe-thread" aria-live="polite">
            {transcript.map((message) => (
              <div key={message.id} className={`pe-msg ${message.role}`}>
                <span>{message.role === "visitor" ? "You" : "Avery"}</span>
                <p>{message.body}</p>
                {message.status === "sending" ? <em>Sending</em> : null}
                {message.status === "failed" ? <em>Failed</em> : null}
              </div>
            ))}
          </div>
          <div className="pe-compose">
            <label htmlFor="estimator-job-note">Job details</label>
            <textarea id="estimator-job-note" value={input} onChange={(event) => setInput(event.target.value)} rows={5} />
            <button type="button" onClick={() => void send()} disabled={!visitorSessionId || busy}>{busy ? "Drafting" : "Send to Avery"}</button>
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
            <label htmlFor="estimator-email">
              Email this draft to me
              <input id="estimator-email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="owner@company.com" />
            </label>
            <button type="button" onClick={() => void sendEmail()} disabled={!canAct || emailBusy}>{emailBusy ? "Sending" : "Send draft"}</button>
          </div>
          <div className="pe-trial">
            <p>The production employee remembers business context, carries active saves, delegates work, and returns decisions and evidence.</p>
            <Link onClick={() => void action("trial_intent")} href="/create-ai-employee">
              {trialClicked ? "Continue setup" : "Create an employee"}
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

const CSS = `
  .pe-root{min-height:100vh;background:radial-gradient(circle at 8% 0%,rgba(223,246,255,.88),transparent 28rem),var(--amtech-canvas);color:var(--amtech-ink);font-family:var(--amtech-font)}
  .pe-top{min-height:64px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--amtech-line);padding:0 20px;background:rgba(255,255,255,.86);backdrop-filter:blur(26px)}.pe-logo{text-decoration:none;color:var(--amtech-ink);font-weight:850;letter-spacing:.04em}.pe-logo span{color:var(--amtech-red)}.pe-top nav{display:flex;gap:16px}.pe-top nav a{font-size:12px;font-weight:720;color:var(--amtech-ink);text-decoration:none}.pe-top nav a:hover{color:var(--amtech-red)}
  .pe-shell{display:grid;grid-template-columns:minmax(320px,460px) 1fr;min-height:calc(100vh - 64px);gap:1px;background:var(--amtech-line)}.pe-chat{display:grid;grid-template-rows:auto 1fr auto;min-height:calc(100vh - 64px);background:rgba(255,255,255,.92)}
  .pe-head{padding:24px 22px;border-bottom:1px solid var(--amtech-line)}.pe-head p,.pe-draft-bar p{font-size:10px;color:var(--amtech-blue);text-transform:uppercase;letter-spacing:.1em;font-weight:780}.pe-head h1{margin:8px 0 12px;font-size:36px;line-height:1.02;font-weight:860;letter-spacing:-.04em}.pe-head span{display:block;font-size:13px;color:var(--amtech-muted);line-height:1.55}
  .pe-thread{padding:20px;display:flex;flex-direction:column;gap:12px;overflow:auto}.pe-msg{padding:12px 14px;border:1px solid var(--amtech-line);border-radius:16px;background:var(--amtech-canvas)}.pe-msg.visitor{align-self:flex-end;max-width:88%;border-color:rgba(37,99,235,.16);background:var(--amtech-cyan)}.pe-msg span{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--amtech-muted);font-weight:760}.pe-msg p{margin-top:5px;line-height:1.5;font-size:15px}.pe-msg em{display:block;margin-top:6px;font-style:normal;font-size:12px;color:var(--amtech-red)}
  .pe-compose{border-top:1px solid var(--amtech-line);padding:16px;display:grid;gap:9px}.pe-compose label{font-size:12px;font-weight:740}.pe-compose textarea{width:100%;resize:vertical;border:1px solid var(--amtech-line-strong);border-radius:14px;padding:12px;font:inherit;line-height:1.45;outline:none}.pe-compose textarea:focus{border-color:var(--amtech-blue);box-shadow:0 0 0 4px var(--amtech-blue-soft)}.pe-compose button,.pe-actions button,.pe-email button,.pe-trial a{min-height:44px;border:1px solid var(--amtech-red);border-radius:999px;background:var(--amtech-red);color:#fff;font-size:12px;font-weight:780;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;padding:0 16px}.pe-compose button:disabled,.pe-actions button:disabled,.pe-email button:disabled{opacity:.45;cursor:not-allowed}.pe-actions button{background:#fff;color:var(--amtech-red)}
  .pe-draft{display:grid;grid-template-rows:auto 1fr auto auto;min-height:calc(100vh - 64px);background:var(--amtech-canvas)}.pe-draft-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid var(--amtech-line);background:#fff}.pe-draft-bar strong{font-size:18px}.pe-actions{display:flex;gap:8px;flex-wrap:wrap}.pe-draft iframe{width:100%;height:100%;border:0;background:#fff}.pe-empty{padding:32px;align-self:start}.pe-empty strong{font-size:20px}.pe-empty p{margin-top:6px;color:var(--amtech-muted);line-height:1.5;max-width:420px}
  .pe-email{display:flex;gap:10px;align-items:end;padding:16px 20px;background:#fff;border-top:1px solid var(--amtech-line)}.pe-email label{flex:1;font-size:11px;font-weight:740;color:var(--amtech-muted)}.pe-email input{display:block;width:100%;height:44px;margin-top:6px;border:1px solid var(--amtech-line-strong);border-radius:12px;font:14px var(--amtech-font);padding:0 12px}.pe-trial{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 20px;background:var(--amtech-blue);color:#fff}.pe-trial p{line-height:1.45;font-weight:680;max-width:700px}.pe-trial a{background:#fff;color:var(--amtech-blue);border-color:#fff;white-space:nowrap}
  @media(max-width:900px){.pe-shell{grid-template-columns:1fr}.pe-chat{min-height:auto}.pe-draft{min-height:70vh}.pe-top nav{display:none}.pe-email,.pe-trial,.pe-draft-bar{align-items:stretch;flex-direction:column}.pe-actions{width:100%}.pe-actions button,.pe-email button,.pe-trial a{width:100%}}
`;
