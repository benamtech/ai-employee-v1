# Production Normal Employee Scenario Verification

Status: pre-live verification standard

This document explains how AMTECH handles the launch scenarios required before going live:

- one account with no employees;
- one account with one employee;
- one account with many employees;
- many accounts with one or many employees;
- the founder phone `+18058869173` reused across close-to-prod accounts during this deployment phase;
- all employees created from the public production onboarding surface.

It is written at two levels: plain terms for shared understanding, then technical terms for implementation and proof.

## Plain-English Model

AMTECH has one public front door and many employee runtimes.

The owner uses `https://agent.amtechai.com/create-ai-employee` to describe the business, verify a phone, create an account, and start an employee. After an account exists, the owner dashboard can start another employee for that same account without creating a second account.

An account can have no employees, one employee, or many employees. An employee belongs to exactly one account. Many accounts can exist at the same time, and employees from different accounts can run at the same time.

For this deployment/testing phase, the same founder phone can be used on multiple different accounts because one operator is creating those accounts. Email uniqueness is not relaxed. A duplicate phone inside the same account is still not allowed.

## Technical Model

The system is a fixed core plus a dynamic fleet.

Fixed core:

- Web: Next.js public/owner UI.
- Manager: Hono control plane, onboarding, account/session APIs, provisioning, webhooks, owner messaging.
- Caddy: public reverse proxy.
- Cloudflare Tunnel for local production-like public ingress, or public DNS directly to Caddy on a VPS.

Dynamic fleet:

- Each live employee runs as its own Docker container named `amtech-hermes-<employee_id>`.
- Manager launches employee containers through the provisioner path.
- Core containers and employee containers share the external Docker network `amtech_runtime`.
- Runtime identity is stored in `runtime_endpoints`, `provisioning_jobs`, and `employee_mcp_credentials`.

Data boundaries:

- `accounts` is the tenant boundary.
- `users` and `account_memberships` bind the owner to the account.
- `owner_web_sessions` stores the owner session token hash.
- `verified_phones` is unique by `(account_id, phone_e164)`, not globally.
- `employees.account_id` binds an employee to one account.
- `runtime_endpoints.employee_id`, `provisioning_jobs.employee_id`, and `employee_mcp_credentials.employee_id` must be distinct per employee.

## Network Path

Local production-like path:

```text
public browser
  -> Cloudflare HTTPS for agent.amtechai.com
  -> named Cloudflare Tunnel
  -> local Caddy on host :80
  -> Web for /create-ai-employee, /dashboard, /agent/*
  -> Manager for proxied /api/front-door/* and /api/employee/*
  -> amtech-hermes-<employee_id> runtime when owner messages the employee
```

VPS/direct production path:

```text
public DNS
  -> Caddy on :80/:443
  -> Web for owner surfaces
  -> Manager for API/webhooks
  -> per-employee Hermes containers on amtech_runtime
```

Only Caddy should be public. Web and Manager are bound to loopback or the Docker network. Employee runtimes are reached through Manager/Caddy routing, not as public raw container ports.

## Scenario Verification

### One Account, No Employees

Plain terms: an owner can create an account and stop before starting an employee.

Technical expectation:

- `accounts`, `users`, `account_memberships`, `owner_web_sessions`, and claimed `verified_phones` rows exist.
- No `employees`, `provisioning_jobs`, `runtime_endpoints`, or `amtech-hermes-*` container exists for that account yet.
- `/dashboard` loads from the production owner session and shows no employees.

Pass evidence:

- Dashboard returns 200 and renders the empty state.
- DB query finds zero employees for the account.

Fail evidence:

- Account creation automatically provisions an employee.
- Dashboard requires dev login.
- Dashboard leaks another account's employees.

### One Account, One Employee

Plain terms: an owner starts the first employee, opens it, and sends a real web message.

Technical expectation:

- One employee row exists for the account.
- One provisioning job exists for the employee.
- One runtime endpoint exists for the employee.
- One active scoped MCP credential exists for the employee.
- One Docker container exists: `amtech-hermes-<employee_id>`.
- Owner web messages and employee replies are written with the same `account_id` and `employee_id`.

Pass evidence:

- `/dashboard` lists exactly that employee.
- `/agent/<employee_id>` opens under the owner session.
- `employee_messages` contains `to_employee` and provider-backed `to_owner` evidence.
- `docker ps` shows the matching Hermes container.

Fail evidence:

- Runtime row missing.
- Container missing or dead while employee is marked live.
- Web message lands on another employee or account.
- Provider failure is reported as infrastructure failure instead of a provider gate.

### One Account, Many Employees

Plain terms: from the dashboard, the owner creates another employee for the same business account.

Technical expectation:

- Dashboard links to `/create-ai-employee?account=current`.
- The create page uses the existing `amtech_owner_session` cookie.
- Manager `/manager/onboarding/owner-context` attaches the owner account and existing verified phone to the new onboarding session.
- The owner chats through the same public onboarding page, then Start Employee provisions a fresh employee under the existing `account_id`.
- No new account or email/password form is required for this same-account employee.

Pass evidence:

- Same `account_id`, multiple distinct `employee_id` values.
- Each employee has a distinct provisioning job, runtime endpoint, route, container, and MCP credential.
- Dashboard lists all employees for that account.

Fail evidence:

- The second employee creates a second account.
- The second employee overwrites or shares the first employee's runtime endpoint, route, or credential.
- Dashboard only shows one employee after two successful provisions.

### Many Accounts, Same Founder Phone

Plain terms: during this deployment phase, the founder can use `+18058869173` to create multiple close-to-prod accounts, as long as each account uses a fresh email and fresh Twilio verification proof.

Technical expectation:

- `verified_phones` permits the same `phone_e164` across different `account_id` values.
- `verified_phones` rejects duplicate `(account_id, phone_e164)` rows inside one account.
- Supabase Auth/email uniqueness remains unchanged.

Pass evidence:

- Account A and Account B both have `verified_phones.phone_e164 = '+18058869173'`.
- Each account has its own Twilio Verify SID/status proof.
- Duplicate email attempt returns `account_email_already_registered`.

Fail evidence:

- Global phone uniqueness blocks Account B.
- Same account can claim the same phone twice.
- Email uniqueness is relaxed.

### Many Accounts, Many Employees

Plain terms: multiple accounts can each run zero, one, or many employees at the same time.

Technical expectation:

- Every employee row has one owning `account_id`.
- Every runtime row points to one employee.
- Every active MCP credential points to one employee.
- Every Hermes container name includes the employee id.
- Owner dashboard scope is derived from `owner_web_sessions.account_id`.

Pass evidence:

- Account A dashboard never shows Account B employees.
- Cross-account employee route access returns unauthorized/not found.
- Docker shows one live Hermes container per live employee.
- Web/SMS events route to the intended `employee_id`.

Fail evidence:

- Cross-account dashboard leakage.
- Cross-account employee route access.
- Shared runtime endpoint or credential.
- SMS/web event delivered to the wrong employee.

## Required Proof Commands

Core and ingress:

```bash
docker ps -a --format '{{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}'
curl -sS http://127.0.0.1:8080/health
curl -I http://127.0.0.1/create-ai-employee -H 'Host: agent.amtechai.com'
curl -I -L --max-time 30 https://agent.amtechai.com/create-ai-employee
```

Production observer:

```bash
npm run prod:onboarding-proof -- --scenario=account-a-first-employee
```

Production validator:

```bash
npm run prod:normal:validate -- --proof=infra/proofs/production-onboarding-<timestamp>.json
```

The observer captures IDs. The validator checks live infrastructure and database state. Neither replaces the real public browser flow.

## What Does Not Count

The following do not count as launch proof:

- `/api/dev/login`;
- local fixture onboarding;
- `TWILIO_VERIFY_DEV_BYPASS`;
- `prod-like:public-estimator:*`;
- `trycloudflare.com`;
- direct internal Manager tool calls that skip public onboarding.

## Operator Rule

When proof fails, classify the failure at the correct layer:

- networking: Cloudflare/Tunnel/Caddy/DNS/TLS;
- web development: Next route, cookie, API proxy, owner dashboard;
- Manager/control plane: onboarding, owner session, provisioning, account scoping;
- runtime: Hermes container, endpoint, MCP credential, health;
- provider: Twilio/xAI/SMS or another external provider.

Do not turn provider gates such as `provider_auth_or_credit_gated` into infrastructure failures.
