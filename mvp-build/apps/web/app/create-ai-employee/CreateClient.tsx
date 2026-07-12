"use client";

import Link from "next/link";
import { useState } from "react";
import { FLOW_CSS } from "../flow-styles";

export function CreateAiEmployeeClient() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Record<string, any>>({});
  const [messages, setMessages] = useState<Array<{ role: string; body: string }>>([]);
  const [input, setInput] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [verifiedPhoneRef, setVerifiedPhoneRef] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountId, setAccountId] = useState("");
  const [status, setStatus] = useState("");

  async function sendMessage() {
    if (!input.trim()) return;
    const ownerMessage = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "owner", body: ownerMessage }]);
    const res = await fetch("/api/front-door/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, surface: "web", message: ownerMessage }),
    });
    const json = await res.json();
    if (json.session_id) setSessionId(json.session_id);
    if (json.manifest_draft) setManifest(json.manifest_draft);
    setMessages((m) => [...m, { role: "employee", body: json.assistant_message ?? "I hit an onboarding error." }]);
  }

  async function sendCode() {
    const res = await fetch("/api/front-door/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_e164: phone, session_id: sessionId }),
    });
    const json = await res.json();
    setStatus(json.user_facing_summary_hint ?? JSON.stringify(json.proof ?? json));
    if (json.proof?.verification_attempt_id) sessionStorage.setItem("verification_attempt_id", json.proof.verification_attempt_id);
  }

  async function checkCode() {
    const res = await fetch("/api/front-door/check-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verification_attempt_id: sessionStorage.getItem("verification_attempt_id"), code }),
    });
    const json = await res.json();
    setStatus(json.user_facing_summary_hint ?? JSON.stringify(json.proof ?? json));
    if (json.proof?.verified_phone_ref) setVerifiedPhoneRef(json.proof.verified_phone_ref);
  }

  async function createAccount() {
    const res = await fetch("/api/front-door/create-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password_or_auth_ref: password,
        verified_phone_ref: verifiedPhoneRef,
        business_display_name: manifest.business_display_name,
        timezone: manifest.timezone ?? "America/New_York",
      }),
    });
    const json = await res.json();
    setStatus(json.user_facing_summary_hint ?? JSON.stringify(json.proof ?? json));
    if (json.proof?.account_id) setAccountId(json.proof.account_id);
  }

  async function provision() {
    const res = await fetch("/api/front-door/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account_id: accountId,
        manifest: { ...manifest, account_id: accountId, verified_phone_e164: phone, verification_method: "twilio_verify", consent_channel: "web", owner_email: email },
        transcript_ref: sessionId,
        idempotency_key: `${accountId}:${sessionId}`,
      }),
    });
    const json = await res.json();
    setStatus(json.user_facing_summary_hint ?? JSON.stringify(json.proof ?? json));
  }

  return (
    <main className="fl-root">
      <style>{FLOW_CSS}</style>
      <div className="fl-card">
        <header className="fl-head">
          <Link className="fl-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
          <span className="fl-head-note">New employee</span>
        </header>

        <div className="fl-title">
          <h1>Set up your AI employee</h1>
          <p>Four short steps. Tell it about the business, prove your phone, claim the account, and it goes to work.</p>
        </div>

        <section className="fl-step">
          <span className="fl-step-tag">Step 01 — Tell it about the business</span>
          <div className="fl-thread">
            {!messages.length ? <span className="fl-empty">Start with what your business does — painting, landscaping, anything.</span> : null}
            {messages.map((m, i) => (
              <div key={i} className={`fl-msg ${m.role === "owner" ? "owner" : ""}`}>
                <span className="who">{m.role === "owner" ? "You" : "AMTECH"}</span>
                {m.body}
              </div>
            ))}
          </div>
          <div className="fl-row">
            <input className="fl-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void sendMessage(); }} placeholder="Tell me what your business does..." />
            <button className="fl-btn" onClick={sendMessage}>Send</button>
          </div>
        </section>

        <section className="fl-step">
          <span className="fl-step-tag">Step 02 — Prove your phone</span>
          <h2>Your employee texts you here</h2>
          <div className="fl-row">
            <input className="fl-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15705551234" />
            <button className="fl-btn quiet" onClick={sendCode}>Send code</button>
          </div>
          <div className="fl-row">
            <input className="fl-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code from the text" />
            <button className="fl-btn quiet" onClick={checkCode}>Check code</button>
          </div>
        </section>

        <section className="fl-step">
          <span className="fl-step-tag">Step 03 — Claim the account</span>
          <h2>How you sign in later</h2>
          <div className="fl-row">
            <input className="fl-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" />
            <input className="fl-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button className="fl-btn" onClick={createAccount}>Create account</button>
          </div>
        </section>

        <section className="fl-step">
          <span className="fl-step-tag">Step 04 — Put it to work</span>
          <div className="fl-row">
            <button className="fl-btn red" disabled={!accountId} onClick={provision}>Start your employee</button>
          </div>
        </section>

        {(status || Object.keys(manifest).length > 0) ? (
          <pre className="fl-status">{status || JSON.stringify(manifest, null, 2)}</pre>
        ) : null}
      </div>
    </main>
  );
}
