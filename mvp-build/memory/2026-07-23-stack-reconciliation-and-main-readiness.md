# 2026-07-23 — cumulative stack reconciliation and main readiness

Status: active handoff for the current integration transaction  
Authority: subordinate to source, workflows, `CODEGRAPH.md`, and the active production-readiness program

## What was reconciled

- The incomplete accidental Trace013 attempt was removed by restoring the branch to the last verified Trace012/UI-Lab head before rebuilding documentation.
- Trace011 and Trace012 remain immutable completed decision records for the employee UI port and UI Lab/folder-first variant work.
- `authority-map.json` and `decision/active.json` now exist and route agents without pretending that a new decision transaction is open.
- Trace013 is reserved for a fresh planning computation on a new branch. No candidate or next-step selection is carried forward from the discarded attempt.
- Active documents now distinguish the cumulative source candidate from historical lower-stack coordinates and distinguish exact CI/image evidence from managed, provider, host, browser, pilot, deployment, and production acceptance.

## Current repository position

The cumulative candidate contains the production authority work through migration `0082`, release/recovery and capacity groundwork, connector operating substrate, employee UI presentation adapters, the production UI Lab, and folder-first full employee UI variants.

The current branch has historical exact-candidate evidence for:

- repository governance, typecheck, lint, broad unit tests, and workspace builds;
- blank-ledger and PostgreSQL integration;
- production Compose validation;
- five exact-SHA image builds and image-identity inspection;
- independent signed release-manifest verification.

Those results do not establish managed Supabase application, live provider/OAuth/MCP behavior, target-host isolation or destructive recovery, fixture-free owner/channel/golden-work acceptance, manual accessibility, representative capacity, pilot, deployment, or production.

## Stack integration strategy

The lower PR #35 coordinate is historically red while the cumulative PR #40 coordinate is green. Therefore integration proceeds top-down:

1. finish active-document reconciliation and exact-head verification on PR #40;
2. merge PR #40 into `agent/ws06-ws07-production` (PR #35 head branch);
3. verify the new cumulative PR #35 head;
4. merge PR #35 into `agent/ws05-ws06-owner-runtime` (PR #34 head branch);
5. verify the new cumulative PR #34 head;
6. leave PR #34 as the single ready-to-review pull request targeting `main`.

Do not merge the known-red historical PR #35 coordinate before PR #40 is integrated into it. Do not claim that an ancestor workflow certifies a new merge commit.

## Next session

After the cumulative stack reaches `main`, create a new branch and begin Trace013 from the exact merged coordinate. Re-run authority extraction and candidate generation from scratch. Prior exploratory R01/R02/R03 labels from the discarded attempt have no authority and should not bias the new computation.
