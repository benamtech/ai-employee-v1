"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FLOW_CSS } from "../flow-styles";

type ChatRole = "owner" | "employee";

interface ChatMessage {
  id?: string;
  role: ChatRole;
  body: string;
}

type StepState = "idle" | "pending" | "done" | "error";

interface OnboardingMessageResult {
  session_id?: string;
  assistant_message?: string;
  manifest_draft?: Record<string, any>;
  ready_for_phone_verification?: boolean;
  missing_fields?: string[];
  user_facing_summary_hint?: string;
  error?: string;
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

export function CreateAiEmployeeClient({ useCurrentAccount = false }: { useCurrentAccount?: boolean }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Record<string, any>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "initial", role: "employee", body: initialAssistantMessage }]);
  const [input, setInput] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [verifiedPhoneRef, setVerifiedPhoneRef] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountId, setAccountId] = useState("");
  const [existingAccountName, setExistingAccountName] = useState("");
  const [employeeHref, setEmployeeHref] = useState("");
  const [status, setStatus] = useState("");
  const [businessReady, setBusinessReady] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [verificationSent, setVerificationSent] = useState(false);
  const [agentWorking, setAgentWorking] = useState(false);
  const [phoneSendState, setPhoneSendState] = useState<StepState>("idle");
  const [codeState, setCodeState] = useState<StepState>("idle");
  const [accountState, setAccountState] = useState<StepState>("idle");
  const [provisionState, setProvisionState] = useState<StepState>("idle");
  const pendingMessagesRef = useRef<string[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const ownerContextAttachedRef = useRef<string | null>(null);

  const manifestBusinessName = typeof manifest.business_display_name === "string" ? manifest.business_display_name : "";
  const manifestTimezone = typeof manifest.timezone === "string" ? manifest.timezone : "America/New_York";
  const manifestEmployeeName = typeof manifest.employee_name === "string" ? manifest.employee_name : "";
  const phoneReady = Boolean(verifiedPhoneRef);
  const accountReady = Boolean(accountId);
  const canSendPhone = Boolean(sessionId && businessReady && phone.trim() && !phoneReady && phoneSendState !== "pending");
  const canCheckCode = Boolean(verificationSent && code.trim() && !phoneReady && codeState !== "pending");
  const canCreateAccount = Boolean(!useCurrentAccount && sessionId && businessReady && phoneReady && email.trim() && password && accountState !== "pending" && !accountReady);
  const canProvision = Boolean(sessionId && accountId && phoneReady && provisionState !== "pending");

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!useCurrentAccount || !sessionId || ownerContextAttachedRef.current === sessionId) return;
    ownerContextAttachedRef.current = sessionId;
    void attachOwnerContext(sessionId);
  }, [sessionId, useCurrentAccount]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  function appendMessage(role: ChatRole, body: string) {
    setMessages((m) => [...m, { role, body }]);
  }

  function updateMessage(id: string, body: string) {
    setMessages((m) => m.map((message) => message.id === id ? { ...message, body } : message));
  }

  function applyOnboardingResult(json: OnboardingMessageResult) {
    if (json.session_id) {
      sessionIdRef.current = json.session_id;
      setSessionId(json.session_id);
    }
    if (json.manifest_draft) setManifest(json.manifest_draft);
    const nextMissing = uniqueStrings(json.missing_fields);
    setMissingFields(nextMissing);
    if (json.ready_for_phone_verification) {
      setBusinessReady(true);
      setStatus("Business context captured. Continue with phone verification in the secure step.");
    } else if (nextMissing.length) {
      setStatus(`Still needed: ${nextMissing.join(", ")}.`);
    } else {
      setStatus("");
    }
  }

  async function attachOwnerContext(nextSessionId: string) {
    try {
      const res = await fetch("/api/front-door/owner-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: nextSessionId }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== "ok" || !json.account?.id) {
        setStatus("Open this from the dashboard to create another employee for the current account.");
        return;
      }
      setAccountId(json.account.id);
      setExistingAccountName(json.account.display_name ?? "current account");
      setAccountState("done");
      if (json.owner?.email) setEmail(json.owner.email);
      if (json.verified_phone?.id) setVerifiedPhoneRef(json.verified_phone.id);
      if (json.verified_phone?.phone_e164) setPhone(json.verified_phone.phone_e164);
      setStatus(`This employee will be added to ${json.account.display_name ?? "the current account"}.`);
    } catch {
      setStatus("I could not confirm the current account. Open Dashboard and try Create another again.");
    }
  }

  async function sendJsonOnboardingMessage(ownerMessage: string): Promise<OnboardingMessageResult> {
    const res = await fetch("/api/front-door/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionIdRef.current, surface: "web", message: ownerMessage }),
    });
    return await res.json();
  }

  async function streamOnboardingMessage(ownerMessage: string, messageId: string): Promise<OnboardingMessageResult> {
    const res = await fetch("/api/front-door/message/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionIdRef.current, surface: "web", message: ownerMessage }),
    });
    if (!res.ok || !res.body) throw new Error("stream_unavailable");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamed = "";
    let finalResult: OnboardingMessageResult | null = null;

    function handleFrame(frame: string) {
      let event = "message";
      const data: string[] = [];
      for (const line of frame.split(/\r?\n/)) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      if (!data.length) return;
      const json = JSON.parse(data.join("\n")) as OnboardingMessageResult & { delta?: string; status?: string };
      if (event === "delta" && typeof json.delta === "string") {
        streamed += json.delta;
        updateMessage(messageId, streamed);
      } else if (event === "status" && typeof json.status === "string") {
        setStatus(json.status === "reading" ? "AMTECH is reading." : "AMTECH is working.");
      } else if (event === "done") {
        finalResult = json;
      } else if (event === "error") {
        throw new Error(`provider:${json.user_facing_summary_hint ?? "I could not complete that setup message. Try again in a moment."}`);
      }
    }

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        handleFrame(frame);
        boundary = buffer.indexOf("\n\n");
      }
    }

    if (!finalResult) throw new Error("stream_missing_done");
    return finalResult;
  }

  function scheduleFlush() {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => {
      void flushOwnerMessages();
    }, 650);
  }

  async function flushOwnerMessages() {
    if (inFlightRef.current || pendingMessagesRef.current.length === 0) return;
    const batch = pendingMessagesRef.current.splice(0);
    const ownerMessage = batch.join("\n\n");
    inFlightRef.current = true;
    setAgentWorking(true);
    setStatus(batch.length > 1 ? "AMTECH is reading those together." : "AMTECH is working on that.");
    const messageId = `employee-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setMessages((m) => [...m, { id: messageId, role: "employee", body: "" }]);
    try {
      let json: OnboardingMessageResult;
      try {
        json = await streamOnboardingMessage(ownerMessage, messageId);
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("provider:")) {
          throw new Error(err.message.slice("provider:".length));
        }
        json = await sendJsonOnboardingMessage(ownerMessage);
      }
      applyOnboardingResult(json);
      updateMessage(messageId, json.assistant_message ?? "I had trouble reading that. Tell me the business name, type of work, and the first workflows this employee should handle.");
    } catch (err) {
      const fallback = err instanceof Error && err.message && !["stream_unavailable", "stream_missing_done"].includes(err.message)
        ? err.message
        : "I could not complete that setup message. Try again in a moment.";
      setStatus("I could not reach the setup service. Try that message again.");
      updateMessage(messageId, fallback);
    } finally {
      inFlightRef.current = false;
      setAgentWorking(false);
      if (pendingMessagesRef.current.length) scheduleFlush();
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const ownerMessage = input.trim();
    setInput("");
    appendMessage("owner", ownerMessage);
    pendingMessagesRef.current.push(ownerMessage);
    setStatus(inFlightRef.current ? "AMTECH will fold that into the setup." : "AMTECH is reading.");
    scheduleFlush();
  }

  async function sendCode() {
    if (!sessionId) {
      setStatus("Tell me about the business first, then I can verify your phone.");
      return;
    }
    setPhoneSendState("pending");
    try {
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
        setPhoneSendState("done");
        appendMessage("employee", "I sent the code. Enter it here and I will confirm the phone without putting the code into the conversation.");
      } else {
        setPhoneSendState("error");
      }
    } catch {
      setPhoneSendState("error");
      setStatus("I could not send the verification code. Check the number and try again.");
    }
  }

  async function checkCode() {
    setCodeState("pending");
    try {
      const res = await fetch("/api/front-door/check-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_attempt_id: sessionStorage.getItem("verification_attempt_id"), code }),
      });
      const json = await res.json();
      setStatus(userFacingStatus(json, "I could not verify that code. Try again."));
      if (json.proof?.verified_phone_ref) {
        setVerifiedPhoneRef(json.proof.verified_phone_ref);
        setCodeState("done");
        appendMessage("employee", "Phone confirmed. Now create the owner login here; the password stays in the secure account form, not in the chat transcript.");
      } else {
        setCodeState("error");
      }
    } catch {
      setCodeState("error");
      setStatus("I could not verify that code. Try again.");
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
    setAccountState("pending");
    try {
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
        setAccountState("done");
        appendMessage("employee", "Account created. I have enough to start the employee now.");
      } else {
        setAccountState("error");
      }
    } catch {
      setPassword("");
      setAccountState("error");
      setStatus("I could not create the account. Check the email and try again.");
    }
  }

  async function provision() {
    if (!sessionId || !accountId) return;
    setProvisionState("pending");
    try {
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
      if (json.status === "ok" || json.status === "pending") {
        const employeeId = typeof json.employee_id === "string" ? json.employee_id : typeof json.proof?.employee_id === "string" ? json.proof.employee_id : "";
        const href = typeof json.proof?.web_route === "string" ? json.proof.web_route : employeeId ? `/agent/${employeeId}` : "";
        setEmployeeHref(href);
        setProvisionState("done");
        appendMessage("employee", href ? "The employee is started. Open it now and send the first real work message." : "The employee start request is in. Once it is live, you can open the owner chat and talk to it directly.");
      } else {
        setProvisionState("error");
      }
    } catch {
      setProvisionState("error");
      setStatus("I could not start the employee yet. Try again in a moment.");
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
            {agentWorking ? (
              <div className="fl-msg working">
                <span className="who">AMTECH</span>
                Reading the setup and shaping the employee.
              </div>
            ) : null}

            {businessReady && !useCurrentAccount ? (
              <div className={`fl-msg fl-control ${phoneReady ? "done" : phoneSendState === "error" || codeState === "error" ? "error" : ""}`}>
                <span className="who">Secure step</span>
                <strong>{phoneReady ? "Phone verified" : "Verify your phone"}</strong>
                {phoneReady ? <div className="fl-step-state">Confirmed. Account setup is ready.</div> : (
                  <div className="fl-row">
                    <input className="fl-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15705551234" />
                    <button className="fl-btn quiet" disabled={!canSendPhone} onClick={sendCode}>{phoneSendState === "pending" ? "Sending..." : "Send code"}</button>
                  </div>
                )}
                {verificationSent && !phoneReady ? (
                  <div className="fl-row">
                    <input className="fl-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code from the text" />
                    <button className="fl-btn quiet" disabled={!canCheckCode} onClick={checkCode}>{codeState === "pending" ? "Checking..." : "Confirm"}</button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {phoneReady && !useCurrentAccount ? (
              <div className={`fl-msg fl-control ${accountReady ? "done" : accountState === "error" ? "error" : ""}`}>
                <span className="who">Secure step</span>
                <strong>{accountReady ? "Owner account created" : "Create owner account"}</strong>
                {accountReady ? <div className="fl-step-state">Session is active. Start the employee next.</div> : (
                  <div className="fl-row">
                    <input className="fl-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" />
                    <input className="fl-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="new-password" />
                    <button className="fl-btn" disabled={!canCreateAccount} onClick={createAccount}>{accountState === "pending" ? "Creating..." : "Create account"}</button>
                  </div>
                )}
              </div>
            ) : null}

            {accountReady ? (
              <div className="fl-msg fl-control">
                <span className="who">Launch</span>
                <strong>{useCurrentAccount ? `Start another employee${existingAccountName ? ` for ${existingAccountName}` : ""}` : "Start the employee"}</strong>
                <div className="fl-row">
                  <button className="fl-btn red" disabled={!canProvision} onClick={provision}>{provisionState === "pending" ? "Starting..." : provisionState === "done" ? "Started" : "Start employee"}</button>
                  {employeeHref ? <Link className="fl-btn" href={employeeHref}>Open employee</Link> : null}
                  {employeeHref ? <Link className="fl-btn" href="/dashboard">Dashboard</Link> : null}
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
