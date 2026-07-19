"use client";

import { useEffect, useState } from "react";
import { BusinessIdentityControl, type IdentityUiState } from "./BusinessIdentityControl";

export function OnboardingIdentityGate() {
  const [available, setAvailable] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [identityState, setIdentityState] = useState<IdentityUiState>("idle");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;

    async function discoverOwnerSession() {
      try {
        const response = await fetch("/api/front-door/owner-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const json = await response.json().catch(() => ({}));
        if (stopped) return;
        if (response.ok && json.status === "ok" && json.account?.id) {
          setAvailable(true);
          setBusinessName(String(json.account.display_name ?? ""));
          return;
        }
      } catch {
        // The owner account may not exist yet. Discovery continues below.
      }
      if (!stopped) timer = window.setTimeout(discoverOwnerSession, 1800);
    }

    void discoverOwnerSession();
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("amtech:onboarding-identity-state", { detail: { state: identityState } }));
    if (identityState !== "verified") setCollapsed(false);
  }, [identityState]);

  if (!available) return null;

  return (
    <aside className={`onboarding-identity-gate ${collapsed ? "collapsed" : ""}`} aria-label="Required business identity verification">
      <style>{GATE_CSS}</style>
      {collapsed && identityState === "verified" ? (
        <button className="identity-gate-summary" type="button" onClick={() => setCollapsed(false)}>
          <span aria-hidden />
          Business identity verified
        </button>
      ) : (
        <>
          <div className="identity-gate-header">
            <div>
              <span>Required before activation</span>
              <strong>Secure business identity</strong>
            </div>
            {identityState === "verified" ? <button type="button" onClick={() => setCollapsed(true)}>Minimize</button> : null}
          </div>
          <BusinessIdentityControl
            enabled
            businessName={businessName}
            onStateChange={setIdentityState}
          />
        </>
      )}
    </aside>
  );
}

const GATE_CSS = `
  .onboarding-identity-gate{position:fixed;right:18px;bottom:18px;z-index:80;width:min(580px,calc(100% - 36px));max-height:calc(100dvh - 36px);padding:12px;overflow:auto;border:1px solid var(--amtech-line-strong);border-radius:24px;background:rgba(247,249,252,.94);box-shadow:0 28px 80px rgba(30,48,80,.22);backdrop-filter:blur(34px)}
  .onboarding-identity-gate.collapsed{width:auto;max-width:calc(100% - 36px);padding:0;border-radius:999px;overflow:hidden}.identity-gate-header{padding:4px 6px 12px;display:flex;align-items:center;justify-content:space-between;gap:16px}.identity-gate-header>div{display:grid;gap:2px}.identity-gate-header span{font-size:10px;font-weight:780;letter-spacing:.12em;text-transform:uppercase;color:var(--amtech-red)}.identity-gate-header strong{font-size:15px}.identity-gate-header button{min-height:36px;padding:0 13px;border:1px solid var(--amtech-line);border-radius:999px;background:#fff;font-size:12px;font-weight:720}.identity-gate-summary{min-height:48px;padding:0 18px;display:flex;align-items:center;gap:9px;border:0;background:#fff;color:var(--amtech-green);font-weight:780}.identity-gate-summary span{width:9px;height:9px;border-radius:50%;background:var(--amtech-green)}
  @media(max-width:640px){.onboarding-identity-gate{right:8px;bottom:8px;width:calc(100% - 16px);max-height:calc(100dvh - 16px);border-radius:18px}.onboarding-identity-gate.collapsed{width:auto;max-width:calc(100% - 16px)}}
`;
