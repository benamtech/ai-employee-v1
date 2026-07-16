"use client";

import Link from "next/link";
import { useState } from "react";
import { FLOW_CSS } from "../flow-styles";

type ChatRole = "owner" | "employee";

interface ChatMessage {
  role: ChatRole;
  body: string;
}

function userFacingStatus(json: any, fallback: string): string {
  if (typeof json?.user_facing_summary_hint === "string") return json.user_facing_summary_hint;
  if (typeof json?.message === "string") return json.message;
  if (typeof json?.error === "string") return fallback;
  return fallback;
}

function uniqueStrings(values: unknown): string[] {
  return Array.isArray(values) ? Array.from(new Set(values.filter((v): v is string => typeof v === "string" && v.trim() !== ""))) : [];
}

const initialAssistantMessage = [
  "I can set up an AMTECH employee to help with estimates, follow-up, scheduling reminders, invoicing support, job notes, customer follow-up, content drafts, and owner approvals where they fit.",
  "What business are we setting up, what work do you do, and what should this employee handle first?",
].join(" ");

export function CreateAiEmployeeClient() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Record<string, any>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "employee", body: initialAssistantMessage }]);
  const [input, setInput] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [verifiedPhoneRef, setVerifiedPhoneRef] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountId, setAccountId] = useState("");
  const [status, setStatus] = useState("");
  const [businessReady, setBusinessReady] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [verificationSent, setVerificationSent] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  const manifestBusinessName = typeof manifest.business_display_name === "string" ? manifest.business_display_name : "";
  const manifestTimezone = typeof manifest.timezone === "string" ? manifest.timezone : "America/New_York";
  const manifestEmployeeName = typeof manifest.employee_name === "string" ? manifest.employee_name : "";
  const phoneReady = Boolean(verifiedPhoneRef);
  const accountReady = Boolean(accountId);
  const canSendPhone = Boolean(sessionId && businessReady && phone.trim());
  const canCheckCode = Boolean(verificationSent && code.trim());
  const canCreateAccount = Boolean(sessionId && businessReady && phoneReady && email.trim() && password);
  const canProvision = Boolean(sessionId && accountId && phoneReady && !provisioning);

  function appendMessage(role: ChatRole, body: string) {
    setMessages((m) => [...m, { role, body }]);
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const ownerMessage = input.trim();
    setInput("");
    appendMessage("owner", ownerMessage);
    const res = await fetch("/api/front-door/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, surface: "web", message: ownerMessage }),
    });
    const json = await res.json();
    if (json.session_id) setSessionId(json.session_id);
    if (json.manifest_draft) setManifest(json.manifest_draft);
    const nextMissing = uniqueStrings(json.missing_fields);
    setMissingFields(nextMissing);
    if (json.ready_for_phone_verification) {
      setBusinessReady(true);
      setStatus("Business context captured. Continue with phone verification in the chat.");
    } else if (nextMissing.length) {
      setStatus(`Still needed: ${nextMissing.join(", ")}.`);
    }
    appendMessage("employee", json.assistant_message ?? "I had trouble reading that. Tell me the business name, type of work, and the first workflows this employee should handle.");
  }

  async function sendCode() {
    if (!sessionId) {
      setStatus("Tell me about the business first, then I can verify your phone.");
      return;
    }
    appendMessage("owner", "I entered my phone number.");
    const res = await fetch("/api/front-door/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_e164: phone, session_id: sessionId }),
    });
    const json = await res.json();
    setStatus(userFacingStatus(json, "I could not send the verification code. Check the number and try again."));
    if (json.proof?.verification_attempt_id) {
      sessionStorage.setItem("verification_attempt_id", json.proof.verification_attempt_id);
      setVerificationSent(true);
      appendMessage("employee", "I sent the code. Enter it here and I will confirm the phone without putting the code into the conversation.");
    }
  }

  async function checkCode() {
    appendMessage("owner", "I entered the verification code.");
    const res = await fetch("/api/front-door/check-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verification_attempt_id: sessionStorage.getItem("verification_attempt_id"), code }),
    });
    const json = await res.json();
    setStatus(userFacingStatus(json, "I could not verify that code. Try again."));
    if (json.proof?.verified_phone_ref) {
      setVerifiedPhoneRef(json.proof.verified_phone_ref);
      appendMessage("employee", "Phone confirmed. Now create the owner login here; the password stays in the secure account form, not in the chat transcript.");
    }
  }

  async function createAccount() {
    const missing = [
      !sessionId ? "business context" : "",
      !phoneReady ? "verified phone" : "",
      !email.trim() ? "owner email" : "",
      !password ? "password" : "",
    ].filter(Boolean);
    if (missing.length) {
      setStatus(`Before creating the account, finish: ${missing.join(", ")}.`);
      return;
    }
    appendMessage("owner", "I entered my owner email and password.");
    const res = await fetch("/api/front-door/create-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        email,
        password_or_auth_ref: password,
        verified_phone_ref: verifiedPhoneRef,
        business_display_name: manifestBusinessName,
        timezone: manifestTimezone,
        owner_name: manifest.owner_name,
      }),
    });
    const json = await res.json();
    setPassword("");
    setStatus(userFacingStatus(json, "I could not create the account. Check the email and try again."));
    if (json.proof?.account_id) {
      setAccountId(json.proof.account_id);
      appendMessage("employee", "Account created. I have enough to start the employee now.");
    }
  }

  async function provision() {
    if (!sessionId || !accountId) return;
    setProvisioning(true);
    appendMessage("owner", "Start the employee.");
    const res = await fetch("/api/front-door/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        account_id: accountId,
        idempotency_key: `${accountId}:${sessionId}`,
      }),
    });
    const json = await res.json();
    setStatus(userFacingStatus(json, "I could not start the employee yet. Finish the missing setup items and try again."));
    setProvisioning(false);
    if (json.status === "ok" || json.status === "pending") {
      appendMessage("employee", "The employee start request is in. Once it is live, you can open the owner chat and talk to it directly.");
    }
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
          <p>Answer in chat. Secure account details stay in protected controls inside the thread.</p>
        </div>

        <section className="fl-step fl-chat-step">
          <div className="fl-thread">
            {messages.map((m, i) => (
              <div key={i} className={`fl-msg ${m.role === "owner" ? "owner" : ""}`}>
                <span className="who">{m.role === "owner" ? "You" : "AMTECH"}</span>
                {m.body}
              </div>
            ))}

            {businessReady ? (
              <div className="fl-msg fl-control">
                <span className="who">Secure step</span>
                <strong>Verify your phone</strong>
                <div className="fl-row">
                  <input className="fl-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15705551234" />
                  <button className="fl-btn quiet" disabled={!canSendPhone} onClick={sendCode}>Send code</button>
                </div>
                {verificationSent ? (
                  <div className="fl-row">
                    <input className="fl-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code from the text" />
                    <button className="fl-btn quiet" disabled={!canCheckCode} onClick={checkCode}>Confirm</button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {phoneReady ? (
              <div className="fl-msg fl-control">
                <span className="who">Secure step</span>
                <strong>Create owner account</strong>
                <div className="fl-row">
                  <input className="fl-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" />
                  <input className="fl-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="new-password" />
                  <button className="fl-btn" disabled={!canCreateAccount} onClick={createAccount}>Create account</button>
                </div>
              </div>
            ) : null}

            {accountReady ? (
              <div className="fl-msg fl-control">
                <span className="who">Launch</span>
                <strong>Start the employee</strong>
                <div className="fl-row">
                  <button className="fl-btn red" disabled={!canProvision} onClick={provision}>{provisioning ? "Starting..." : "Start employee"}</button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="fl-row">
            <input className="fl-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void sendMessage(); }} placeholder="Reply here..." />
            <button className="fl-btn" onClick={sendMessage}>Send</button>
          </div>

          {manifestBusinessName ? (
            <p className="fl-kv"><strong>Captured:</strong> {manifestBusinessName}{manifestEmployeeName ? ` · ${manifestEmployeeName}` : ""} · {manifestTimezone}</p>
          ) : null}
          {!businessReady && missingFields.length ? <p className="fl-kv">Still needed: {missingFields.join(", ")}.</p> : null}
        </section>

        {status ? <pre className="fl-status">{status}</pre> : null}
      </div>
    </main>
  );
}
