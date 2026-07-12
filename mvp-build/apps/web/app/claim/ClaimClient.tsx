"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FLOW_CSS } from "../flow-styles";

export function ClaimClient({ tokenParam }: { tokenParam?: string }) {
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [manifest, setManifest] = useState<Record<string, any>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountId, setAccountId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!tokenParam) return;
    setToken(tokenParam);
    fetch("/api/front-door/claim-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenParam }),
    }).then((r) => r.json()).then((json) => {
      setPhone(json.phone_e164 ?? "");
      setSessionId(json.session_id ?? "");
      setManifest(json.manifest_draft ?? {});
      setStatus(json.error ?? "Phone proven by SMS. Create the account to claim the employee.");
    });
  }, [tokenParam]);

  async function createAccount() {
    const res = await fetch("/api/front-door/create-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password_or_auth_ref: password,
        verified_phone_ref: manifest.verified_phone_ref,
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
        manifest: { ...manifest, account_id: accountId, verified_phone_e164: phone, verification_method: "sms_inbound", consent_channel: "sms", owner_email: email },
        transcript_ref: sessionId,
        idempotency_key: `${accountId}:${token}`,
      }),
    });
    const json = await res.json();
    setStatus(json.user_facing_summary_hint ?? JSON.stringify(json.proof ?? json));
  }

  return (
    <main className="fl-root">
      <style>{FLOW_CSS}</style>
      <div className="fl-card" style={{ maxWidth: 561 }}>
        <header className="fl-head">
          <Link className="fl-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
          <span className="fl-head-note">Claim your employee</span>
        </header>

        <div className="fl-title">
          <h1>Claim your AI employee</h1>
          <p>Your phone is already proven from the text thread. Claim the account and your employee keeps working under your name.</p>
        </div>

        <section className="fl-step">
          <span className="fl-step-tag">Proven phone</span>
          <span className="fl-kv">Phone: <strong>{phone || "not locked"}</strong></span>
        </section>

        <section className="fl-step">
          <span className="fl-step-tag">Step 01 — Claim the account</span>
          <div className="fl-row">
            <input className="fl-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" />
            <input className="fl-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button className="fl-btn" onClick={createAccount}>Create account</button>
          </div>
        </section>

        <section className="fl-step">
          <span className="fl-step-tag">Step 02 — Put it to work</span>
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
