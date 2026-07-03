# Provisioning And Runtime

Status: complete

## Purpose

Provisioning creates the real employee, routes, runtime state, and first contact point after account setup.

## Required Provisioning Steps

`provision_employee` must:

1. Validate account, verified phone, consent, and manifest.
2. Create employee, manifest, business brain, profile build, and runtime records.
3. Select a registered AMTECH profile package (`contractor_estimator` first; not hardcoded as the platform).
4. Render identity, memory, skills, params, distribution metadata, and workspace from the manifest.
5. Validate the generated profile package before runtime start.
6. Allocate SMS route and web route.
7. Start SMS gateway and webchat/API runtime.
8. Register default schedules.
9. Run health checks.
10. Send first live SMS.
11. Return proof to the front door.

Claim-time provisioning is package rendering, not prompt-to-repo authoring. `codegraphtheory/hermes-profile-template`-style tooling belongs in the upstream package-authoring workflow; once a package is registered, provisioning renders it deterministically for the employee.

## Runtime Routes

Minimum routes:

- owner web: `agent.amtechai.com/{employee_id}`
- artifact: `agent.amtechai.com/{employee_id}/output/{artifact_id}`
- Twilio: `api.amtechai.com/webhooks/twilio/{employee_id}`
- Gmail Pub/Sub: `api.amtechai.com/webhooks/gmail`
- Stripe: `api.amtechai.com/webhooks/stripe`

## Health Checks

Required:

- profile exists;
- SMS inbound route valid;
- SMS outbound test capability;
- webchat/API route valid;
- artifact workspace/storage reachable;
- Manager tools reachable;
- default entitlement policy exists;
- runtime logs writable.

Connector health checks are added after Gmail/Stripe connection.

## First Live Message

The first SMS comes from the employee:

```text
I'm live. Text me the job you just walked, an estimate you need, or the office work you want off your plate.
```

## Failure States

Track:

- validation failed;
- account binding failed;
- profile create failed;
- route allocation failed;
- runtime start failed;
- first SMS failed;
- web route failed;
- artifact storage failed.

Every failure needs a repair command and should leave no orphaned public route without an employee record.

## Pilot Containment

Demo can run on one AMTECH-controlled host. First pilots need a real containment boundary for tool/file execution, plus profile-scoped credentials and per-employee provider secrets.

## Hermes Runtime Expansion

Current-docs research note, 2026-06-29: provisioning should create more than a prompt/profile. It should prepare the Hermes profile, selected skills, memory/business-brain seed, allowed toolsets, MCP server filters, API server/session mapping, messaging route, Jobs/Cron defaults, and capability health checks. Use Hermes discovery endpoints where available so AMTECH can confirm which skills/toolsets/MCP servers are live for the employee before claiming success.
