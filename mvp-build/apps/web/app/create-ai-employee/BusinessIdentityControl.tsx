"use client";

import { useEffect, useRef, useState } from "react";

export type IdentityUiState = "idle" | "checking" | "pending" | "verified" | "rejected" | "error";

export function BusinessIdentityControl({
  enabled,
  businessName,
  onStateChange,
}: {
  enabled: boolean;
  businessName: string;
  onStateChange: (state: IdentityUiState) => void;
}) {
  const [identityState, setIdentityState] = useState<IdentityUiState>("idle");
  const [businessType, setBusinessType] = useState("LLC");
  const [legalName, setLegalName] = useState(businessName);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [message, setMessage] = useState("");
  const idempotencyKey = useRef(`identity:${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`);

  function transition(next: IdentityUiState) {
    setIdentityState(next);
    onStateChange(next);
  }

  async function checkStatus(silent = false) {
    if (!enabled) return;
    if (!silent) transition("checking");
    try {
      const response = await fetch("/api/front-door/identity/status", { method: "POST" });
      const json = await response.json().catch(() => ({}));
      if (response.ok && json.allowed) {
        transition("verified");
        setMessage("Business identity verified. Employee activation is now available.");
        return;
      }
      if (json.identity?.status === "pending") {
        transition("pending");
        setMessage("Verification is in progress. AMTECH will enable activation only after the signed provider result is accepted.");
        return;
      }
      if (json.identity?.status === "rejected" || json.error === "identity_rejected_permanent") {
        transition("rejected");
        setMessage("The identity provider rejected this business record. Activation remains blocked; contact AMTECH support with the business documents used.");
        return;
      }
      transition("idle");
      if (!silent) setMessage("Verify the legal business and tax identity before starting the employee.");
    } catch {
      transition("error");
      setMessage("AMTECH could not read the current verification state. No activation was attempted.");
    }
  }

  useEffect(() => {
    if (!enabled) return;
    if (!legalName && businessName) setLegalName(businessName);
    void checkStatus();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || identityState !== "pending") return;
    const timer = window.setInterval(() => { void checkStatus(true); }, 5000);
    return () => window.clearInterval(timer);
  }, [enabled, identityState]);

  async function verify() {
    if (!enabled || identityState === "checking") return;
    transition("checking");
    setMessage("Submitting the sealed tax ID and legal business record to the configured verification provider.");
    try {
      const response = await fetch("/api/front-door/identity/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_type: businessType.trim(),
          business_name: legalName.trim(),
          business_address: {
            address_line1: addressLine1.trim(),
            ...(addressLine2.trim() ? { address_line2: addressLine2.trim() } : {}),
            city: city.trim(),
            state: region.trim().toUpperCase(),
            postal_code: postalCode.trim(),
            country: "US",
          },
          tax_id: taxId.trim(),
          idempotency_key: idempotencyKey.current,
          audit_correlation_id: idempotencyKey.current,
        }),
      });
      const json = await response.json().catch(() => ({}));
      setTaxId("");
      if (response.ok && json.allowed) {
        transition("verified");
        setMessage("Business identity verified. Employee activation is now available.");
        return;
      }
      if (response.status === 202 || json.status === "pending" || json.identity?.status === "pending") {
        transition("pending");
        setMessage("Verification is pending. AMTECH is waiting for the signed provider result and will not start the employee early.");
        return;
      }
      if (response.status === 429) {
        transition("error");
        setMessage(`Verification attempts are temporarily limited. Retry after ${Number(json.retryAfter ?? 0) || "the provider wait period"}.`);
        return;
      }
      if (response.status === 403 || json.error === "identity_rejected_permanent") {
        transition("rejected");
        setMessage("The provider permanently rejected this identity record. Activation remains blocked.");
        return;
      }
      transition("error");
      setMessage("Verification was not accepted. Review the legal name, address, and tax ID before retrying.");
    } catch {
      setTaxId("");
      transition("error");
      setMessage("The verification request did not complete. The employee was not activated.");
    }
  }

  if (!enabled) return null;

  const canVerify = Boolean(
    businessType.trim() && legalName.trim() && addressLine1.trim() && city.trim() && region.trim().length >= 2 && postalCode.trim().length >= 5 && taxId.trim(),
  );

  return (
    <section className={`identity-control ${identityState}`} aria-busy={identityState === "checking"}>
      <style>{IDENTITY_CSS}</style>
      <div className="identity-head">
        <div>
          <span>Secure identity</span>
          <h2>{identityState === "verified" ? "Business verified" : "Verify the business before activation"}</h2>
        </div>
        <strong>{identityLabel(identityState)}</strong>
      </div>

      {identityState === "verified" ? (
        <p className="identity-message">{message}</p>
      ) : (
        <>
          <p className="identity-copy">The legal identity and tax ID stay in protected controls and are never added to the employee conversation. AMTECH stores only the provider record, non-reversible fingerprint, and last four digits required by policy.</p>
          <div className="identity-grid">
            <label>
              Business type
              <input value={businessType} onChange={(event) => setBusinessType(event.target.value)} placeholder="LLC" />
            </label>
            <label className="wide">
              Legal business name
              <input value={legalName} onChange={(event) => setLegalName(event.target.value)} placeholder="Acme Painting LLC" />
            </label>
            <label className="wide">
              Street address
              <input value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} autoComplete="street-address" />
            </label>
            <label className="wide">
              Address line 2 <small>optional</small>
              <input value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} />
            </label>
            <label>
              City
              <input value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" />
            </label>
            <label>
              State
              <input value={region} onChange={(event) => setRegion(event.target.value)} maxLength={3} autoComplete="address-level1" />
            </label>
            <label>
              ZIP code
              <input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} autoComplete="postal-code" inputMode="numeric" />
            </label>
            <label>
              EIN / tax ID
              <input value={taxId} onChange={(event) => setTaxId(event.target.value)} autoComplete="off" inputMode="numeric" type="password" />
            </label>
          </div>
          <div className="identity-actions">
            <button type="button" disabled={!canVerify || identityState === "checking" || identityState === "pending" || identityState === "rejected"} onClick={() => void verify()}>
              {identityState === "checking" ? "Submitting…" : identityState === "pending" ? "Verification pending" : "Verify business"}
            </button>
            {identityState === "pending" || identityState === "error" ? <button className="secondary" type="button" onClick={() => void checkStatus()}>Check status</button> : null}
          </div>
          {message ? <p className="identity-message" role={identityState === "error" || identityState === "rejected" ? "alert" : "status"}>{message}</p> : null}
        </>
      )}
    </section>
  );
}

function identityLabel(state: IdentityUiState): string {
  if (state === "verified") return "Verified";
  if (state === "pending") return "Pending provider";
  if (state === "checking") return "Checking";
  if (state === "rejected") return "Blocked";
  if (state === "error") return "Needs review";
  return "Required";
}

const IDENTITY_CSS = `
  .identity-control{display:grid;gap:16px;padding:20px;border:1px solid var(--amtech-line);border-radius:var(--amtech-radius-card);background:rgba(255,255,255,.9);box-shadow:var(--amtech-shadow-card)}.identity-control.verified{border-color:rgba(22,138,87,.22);background:var(--amtech-green-soft)}.identity-control.rejected,.identity-control.error{border-color:rgba(225,29,42,.22)}
  .identity-head{display:flex;align-items:start;justify-content:space-between;gap:16px}.identity-head span{font-size:11px;font-weight:780;letter-spacing:.12em;text-transform:uppercase;color:var(--amtech-blue)}.identity-head h2{margin-top:4px;font-size:20px;line-height:1.15}.identity-head>strong{padding:6px 10px;border-radius:999px;background:var(--amtech-blue-soft);color:var(--amtech-blue);font-size:11px}.verified .identity-head>strong{background:rgba(22,138,87,.12);color:var(--amtech-green)}.rejected .identity-head>strong,.error .identity-head>strong{background:var(--amtech-danger-soft);color:var(--amtech-red)}
  .identity-copy,.identity-message{color:var(--amtech-muted);font-size:13px;line-height:1.55}.identity-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.identity-grid label{display:grid;gap:6px;font-size:12px;font-weight:720}.identity-grid label.wide{grid-column:1/-1}.identity-grid small{color:var(--amtech-muted);font-weight:500}.identity-grid input{width:100%;height:44px;padding:0 12px;border:1px solid var(--amtech-line-strong);border-radius:12px;background:#fff;outline:none}.identity-grid input:focus{border-color:var(--amtech-blue);box-shadow:0 0 0 4px var(--amtech-blue-soft)}
  .identity-actions{display:flex;gap:8px;flex-wrap:wrap}.identity-actions button{min-height:44px;padding:0 18px;border:1px solid var(--amtech-red);border-radius:999px;background:var(--amtech-red);color:#fff;font-weight:780}.identity-actions button.secondary{border-color:var(--amtech-line-strong);background:#fff;color:var(--amtech-ink)}.identity-actions button:disabled{opacity:.45;cursor:not-allowed}
  @media(max-width:620px){.identity-head{flex-direction:column}.identity-grid{grid-template-columns:1fr}.identity-grid label.wide{grid-column:auto}.identity-actions button{width:100%}}
`;
