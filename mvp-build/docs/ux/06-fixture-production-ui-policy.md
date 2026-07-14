# Fixture And Production UI Policy

Status: active policy  
Purpose: keep UI tests useful without letting fake data leak into pod-like environments

## Rule

The current production UI and the UI used in testing must be the same route/component implementation.
Fixture mode may replace only data source and local action simulation. It must never be enabled in
pod-like, staging, or production environments.

## Allowed

- `npm run ui:dev`, `npm run ui:test`, and `npm run ui:test:headed` may set
  `NEXT_PUBLIC_AMTECH_UI_FIXTURES=1`.
- Fixture data may live in local fixture modules and simulate local approvals/messages.
- Screenshots may use representative fake businesses as long as they are labeled fixture/local.

## Not Allowed

- Pod-like environment with `NEXT_PUBLIC_AMTECH_UI_FIXTURES=1`.
- Production/staging build with fixture data.
- Separate test-only UI shell that bypasses production components.
- Marking fixture screenshots as live provider/runtime acceptance.

## Guard

`apps/web/app/_lib/ui-fixtures.ts` centralizes fixture-mode policy. It rejects fixture mode when:

- `NODE_ENV=production`;
- `AMTECH_ENVIRONMENT_NAME` names a pod/prod/production/staging environment;
- `AMTECH_PRODUCTION_LIKE=1`.

`prod-env:proof` also reports fixture mode as a failure when enabled in a production-like environment.

## Next Proof

After live provider credits land, run a pod-like browser proof with fixture mode disabled. It should
exercise the same owner route, signed Review route, and proof surfaces against real Manager data.
