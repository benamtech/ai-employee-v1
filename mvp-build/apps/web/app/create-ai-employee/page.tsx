"use client";

import { useState } from "react";

export default function CreateAiEmployee() {
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
    <main style={{ maxWidth: 760, margin: "6vh auto", padding: 24 }}>
      <h1>Set up your AI employee</h1>
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, minHeight: 220 }}>
        {messages.map((m, i) => (
          <p key={i}><strong>{m.role === "owner" ? "You" : "AMTECH"}:</strong> {m.body}</p>
        ))}
      </div>
      <p>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tell me what your business does..." style={{ width: "75%" }} />
        <button onClick={sendMessage}>Send</button>
      </p>
      <h2>Verify and claim</h2>
      <p><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15705551234" /> <button onClick={sendCode}>Send code</button></p>
      <p><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" /> <button onClick={checkCode}>Check code</button></p>
      <p><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" /> <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /> <button onClick={createAccount}>Create account</button></p>
      <p><button disabled={!accountId} onClick={provision}>Provision employee</button></p>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12 }}>{status || JSON.stringify(manifest, null, 2)}</pre>
    </main>
  );
}
