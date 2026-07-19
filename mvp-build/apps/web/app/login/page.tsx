"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

type AccountOption = {
  id: string;
  display_name: string;
  slug: string | null;
  role: string;
};

type LoginResponse = {
  error?: string;
  accounts?: AccountOption[];
  account_id?: string;
};

function redirectTarget(): string {
  if (typeof window === "undefined") return "/";
  const candidate = new URLSearchParams(window.location.search).get("next") ?? "/";
  return candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : "/";
}

function errorMessage(code: string | undefined): string {
  switch (code) {
    case "email_and_password_required":
      return "Enter both your email and password.";
    case "invalid_login":
      return "The email or password did not match an AMTECH owner account.";
    case "owner_user_not_found":
    case "owner_membership_not_found":
    case "account_access_denied":
      return "This sign-in is not authorized for the selected AMTECH account.";
    case "owner_login_unavailable":
      return "Owner sign-in is temporarily unavailable. Your work remains held safely.";
    default:
      return "AMTECH could not complete sign-in. Review the details and try again.";
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitLogin(accountId?: string) {
    setSubmitting(true);
    setError("");
    setStatus(accountId ? "Opening the selected business…" : "Checking your owner account…");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        ...(accountId ? { account_id: accountId } : {}),
      }),
    }).catch(() => null);

    if (!response) {
      setStatus("");
      setError(errorMessage("owner_login_unavailable"));
      setSubmitting(false);
      return;
    }

    const body = await response.json().catch(() => ({})) as LoginResponse;
    if (response.status === 409 && body.error === "account_selection_required" && body.accounts?.length) {
      setAccounts(body.accounts);
      setSelectedAccountId("");
      setStatus("Choose the business you want to open.");
      setSubmitting(false);
      return;
    }

    if (!response.ok) {
      setStatus("");
      setError(errorMessage(body.error));
      setSubmitting(false);
      return;
    }

    setStatus("Signed in. Opening your AMTECH workspace…");
    window.location.assign(redirectTarget());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitLogin(accounts.length ? selectedAccountId : undefined);
  }

  return (
    <main className="login-root">
      <style>{LOGIN_CSS}</style>
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <Link className="login-logo" href="/">AMTECH<span aria-hidden>.</span></Link>
          <span className="login-eyebrow">Owner sign-in</span>
        </header>

        <div className="login-intro">
          <h1 id="login-title">Return to your AI employee</h1>
          <p>Sign in to review current work, answer decisions, and verify completed actions.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="owner-email">Email</label>
            <input
              id="owner-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting || accounts.length > 0}
            />
          </div>

          <div className="login-field">
            <label htmlFor="owner-password">Password</label>
            <input
              id="owner-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting || accounts.length > 0}
            />
          </div>

          {accounts.length > 0 ? (
            <fieldset className="account-picker">
              <legend>Choose a business</legend>
              <p>Your sign-in belongs to more than one AMTECH account. Select the exact business to open.</p>
              <div className="account-options">
                {accounts.map((account) => (
                  <label className="account-option" key={account.id}>
                    <input
                      type="radio"
                      name="account_id"
                      value={account.id}
                      checked={selectedAccountId === account.id}
                      onChange={() => setSelectedAccountId(account.id)}
                      disabled={submitting}
                    />
                    <span>
                      <strong>{account.display_name}</strong>
                      <small>{account.slug ? `${account.slug} · ` : ""}{account.role}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {error ? <p className="login-error" role="alert">{error}</p> : null}
          <p className="login-status" role="status" aria-live="polite">{status}</p>

          <button
            className="login-submit"
            type="submit"
            disabled={submitting || !email.trim() || !password || (accounts.length > 0 && !selectedAccountId)}
          >
            {submitting ? "Signing in…" : accounts.length ? "Open selected business" : "Sign in"}
          </button>

          {accounts.length > 0 ? (
            <button
              className="login-reset"
              type="button"
              onClick={() => {
                setAccounts([]);
                setSelectedAccountId("");
                setStatus("");
              }}
              disabled={submitting}
            >
              Use a different sign-in
            </button>
          ) : null}
        </form>

        <footer className="login-footer">
          <div>
            <strong>New to AMTECH?</strong>
            <span>Create and verify your first AI employee through the guided setup.</span>
          </div>
          <Link href="/create-ai-employee">Create your AI employee</Link>
        </footer>
      </section>
    </main>
  );
}

const LOGIN_CSS = `
  .login-root {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 32px 20px;
    color: #111111;
    background:
      radial-gradient(circle at 8% 5%, rgba(37, 99, 235, 0.08), transparent 30rem),
      radial-gradient(circle at 92% 92%, rgba(225, 29, 42, 0.06), transparent 28rem),
      #f7f9fc;
    font-family: Inter, system-ui, sans-serif;
  }
  .login-card {
    width: min(100%, 560px);
    overflow: hidden;
    border: 1px solid rgba(17, 17, 17, 0.08);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 24px 70px rgba(17, 17, 17, 0.10);
    backdrop-filter: blur(28px);
  }
  .login-header,
  .login-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 20px 24px;
  }
  .login-header { border-bottom: 1px solid rgba(17, 17, 17, 0.08); }
  .login-logo {
    color: #111111;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-decoration: none;
  }
  .login-logo span { color: #e11d2a; }
  .login-eyebrow {
    color: rgba(17, 17, 17, 0.58);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .login-intro { padding: 32px 24px 16px; }
  .login-intro h1 {
    margin: 0;
    font-size: clamp(2rem, 7vw, 3rem);
    line-height: 1.02;
    letter-spacing: -0.045em;
  }
  .login-intro p {
    max-width: 440px;
    margin: 16px 0 0;
    color: rgba(17, 17, 17, 0.66);
    font-size: 15px;
    line-height: 1.6;
  }
  .login-form { display: grid; gap: 20px; padding: 24px; }
  .login-field { display: grid; gap: 8px; }
  .login-field label,
  .account-picker legend {
    font-size: 13px;
    font-weight: 750;
  }
  .login-field input {
    width: 100%;
    min-height: 48px;
    border: 1px solid rgba(17, 17, 17, 0.16);
    border-radius: 12px;
    padding: 0 14px;
    color: #111111;
    background: #ffffff;
    font: inherit;
  }
  .login-field input:disabled { background: #f7f9fc; color: rgba(17, 17, 17, 0.54); }
  .account-picker {
    min-width: 0;
    margin: 0;
    border: 0;
    padding: 8px 0 0;
  }
  .account-picker > p {
    margin: 8px 0 16px;
    color: rgba(17, 17, 17, 0.64);
    font-size: 14px;
    line-height: 1.5;
  }
  .account-options { display: grid; gap: 8px; }
  .account-option {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    border: 1px solid rgba(17, 17, 17, 0.10);
    border-radius: 14px;
    padding: 10px 14px;
    background: #ffffff;
    cursor: pointer;
  }
  .account-option:has(input:checked) {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
  }
  .account-option input { width: 18px; height: 18px; accent-color: #2563eb; }
  .account-option span { display: grid; gap: 3px; }
  .account-option strong { font-size: 14px; }
  .account-option small { color: rgba(17, 17, 17, 0.60); font-size: 12px; }
  .login-error {
    margin: 0;
    border-left: 3px solid #e11d2a;
    border-radius: 8px;
    padding: 10px 12px;
    color: #991b1b;
    background: rgba(225, 29, 42, 0.07);
    font-size: 14px;
    line-height: 1.5;
  }
  .login-status { min-height: 20px; margin: -8px 0 0; color: #2563eb; font-size: 13px; }
  .login-submit,
  .login-reset,
  .login-footer a {
    min-height: 48px;
    border-radius: 999px;
    padding: 0 20px;
    font: inherit;
    font-size: 14px;
    font-weight: 750;
    cursor: pointer;
  }
  .login-submit {
    border: 1px solid #e11d2a;
    color: #ffffff;
    background: #e11d2a;
  }
  .login-submit:disabled { border-color: rgba(17, 17, 17, 0.10); color: rgba(17, 17, 17, 0.42); background: #f7f9fc; cursor: default; }
  .login-reset { border: 1px solid rgba(17, 17, 17, 0.12); color: #111111; background: #ffffff; }
  .login-footer {
    align-items: flex-start;
    border-top: 1px solid rgba(17, 17, 17, 0.08);
    background: rgba(223, 246, 255, 0.38);
  }
  .login-footer div { display: grid; gap: 5px; }
  .login-footer strong { font-size: 14px; }
  .login-footer span { color: rgba(17, 17, 17, 0.62); font-size: 13px; line-height: 1.45; }
  .login-footer a {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    color: #111111;
    border: 1px solid rgba(17, 17, 17, 0.12);
    background: #ffffff;
    text-decoration: none;
  }
  .login-field input:focus-visible,
  .account-option:focus-within,
  .login-submit:focus-visible,
  .login-reset:focus-visible,
  .login-footer a:focus-visible,
  .login-logo:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.35);
    outline-offset: 3px;
  }
  @media (max-width: 520px) {
    .login-root { padding: 0; place-items: stretch; }
    .login-card { min-height: 100vh; border: 0; border-radius: 0; }
    .login-footer { flex-direction: column; }
    .login-footer a { width: 100%; justify-content: center; }
  }
  @media (prefers-reduced-motion: reduce) {
    .login-root *, .login-root *::before, .login-root *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`;
