"use client";

import { useEffect, useState } from "react";

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
    <main style={{ maxWidth: 640, margin: "6vh auto", padding: 24 }}>
      <h1>Claim your AI employee</h1>
      <p>Phone: <strong>{phone || "not locked"}</strong></p>
      <p><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" /> <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /> <button onClick={createAccount}>Create account</button></p>
      <p><button disabled={!accountId} onClick={provision}>Provision employee</button></p>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12 }}>{status || JSON.stringify(manifest, null, 2)}</pre>
    </main>
  );
}
