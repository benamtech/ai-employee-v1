# xAI Grok estimator test handoff

Date: 2026-07-15 04:10 ET
Status: next-session test directive; no source/runtime status changed
Scope: Token-efficient provider proof for the already-provisioned AMTECH public estimator employee, then later full onboarding-created employee proof.

## Critical update

Use xAI Grok for the next provider-backed estimator test.

- Provider/API: xAI Grok build-compatible API.
- The API is OpenAI-compatible for Responses, tool calling, and structured output.
- Production env source: `infra/deploy/.env.production`.
- API key env var in production env: `xai_api_key`.
- Exact model env var in production env: `xai_model`.
- Do not print, repeat, or copy the API key value. Report only presence/length/status.

Assumption for the next agent: if the code path expects OpenAI-compatible configuration names, map from
`xai_api_key` and `xai_model` into the existing OpenAI-compatible provider/model settings at runtime or in
the production env, without adding a custom xAI integration unless source inspection proves it is required.
The user expects no special provider implementation because xAI is OpenAI-compatible for the needed surfaces.

## Credit constraint

There is only about **$5 of xAI API credit** available.

The next provider test must be token-efficient:

- Do not run exploratory provider calls.
- Do not run repeated message smokes.
- Use the no-message smoke first because it proves Web/API/session/draft lookup without spending provider tokens.
- Then run exactly one concise message turn unless the first provider call fails before reaching the provider.
- Keep the visitor message short but sufficient to trigger one estimate-draft attempt.
- Stop immediately after capturing proof or a sanitized provider error class.

## Test order

First test the existing estimator employee:

- Employee: `emp_5omv4ihbvggc8ibe31nj43`
- Account: `acct_x7kt6lu4hjl0r9fzjj5q3b`
- Profile package: `website_estimator_conversation`
- Public route: `/estimator`
- Compatibility route: `/free-estimator`

Expected efficient sequence:

```bash
npm run prod-like:public-estimator:up -- --down-first --reprovision-employee
npm run prod-like:public-estimator:smoke
npm run prod-like:public-estimator:smoke -- --send-message --message="Two bedrooms, walls only, light patching, two coats. Need a draft range."
```

If the message turn succeeds, capture:

- smoke proof JSON path;
- visitor session id;
- turn job id;
- work run id;
- Hermes/provider external id if surfaced;
- artifact id/current draft id if created.

Only after this existing-estimator proof is done, later in the next session, test a newly provisioned employee
created through the full onboarding flow. Do not start with full onboarding while the $5 provider budget is the
active constraint.

## DNS/tunnel context

For public access during the test, use the current tunnel handoff:

- `memory/2026-07-15-0258-cloudflare-tunnel-and-production-dns-handoff.md`

Quick Tunnel proof exists, but campaign/client readiness needs a named Cloudflare Tunnel routed to
`agent.amtechai.com`. DNS/A-record publishing to the local PC is the wrong path unless inbound `80/443`
is actually reachable.

## Status language

- Do not claim `provider-accepted` until a real xAI-backed successful turn/provider id exists.
- Do not call an xAI credit/auth rejection a Hermes outage.
- Do not call `agent.amtechai.com/estimator` ready until the named Cloudflare Tunnel or equivalent production
  domain route is verified.
- Do not attempt Resend email proof until a current draft exists and sender/reply-to env are valid.
