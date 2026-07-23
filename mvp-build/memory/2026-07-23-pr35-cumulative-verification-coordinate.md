# PR #35 cumulative verification coordinate

Date: 2026-07-23  
Status: exact-head verification required

PR #40 was merged into `agent/ws06-ws07-production` at merge commit:

```text
bd1953c46834a79e217ebeb5bd81df81970ed2a7
```

The PR #40 head was exact-green before merge. That ancestor evidence does not certify this merge descendant.

This handoff creates the PR #35 synchronize coordinate. The current PR #35 head must independently pass:

- Trace007 through Trace013 decision and experiment checks;
- experiment compiler doctor, isolated lifecycle, and retrospective benchmark;
- agentic and structural governance;
- typecheck, lint, focused and broad unit regression;
- all-workspace build;
- blank-ledger and complete PostgreSQL integration;
- canonical Compose, five exact-SHA images, image identity, and independent release-manifest verification.

Only after that exact head is green may PR #35 merge into PR #34’s branch. Managed database, live provider, target host, fixture-free channels/golden work, human accessibility, capacity, pilot, deployment, and production remain separate P4 evidence.
