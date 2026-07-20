#!/usr/bin/env node
console.log(`AMTECH local-machine production control plane

Dependency authority
  Root: pnpm orchestration only
  Application: mvp-build/package-lock.json + npm ci

Commands
  pnpm audit          Static per-script boundary, attack, fidelity, idempotency, and performance audit
  pnpm preflight      Source/toolchain/environment/hardware preflight
  pnpm typecheck      Measured TypeScript validation
  pnpm lint           Measured lint validation
  pnpm build          Measured app build + exact-SHA production images; does not start services
  pnpm test           Full unit/source + blank-PostgreSQL integration suite; external network denied
  pnpm verify         Runs the complete source/local verification sequence and writes evidence
  pnpm dev            Starts existing production compose locally from exact-SHA images only
  pnpm s9:go-no-go    Emits blocker-only S9 readiness decision from exact-SHA proofs
  pnpm sdrt:validate  Validate the example/formal SDRT-v2 document
  pnpm sdrt:roundtrip Prove parse -> emit -> parse identity
  pnpm sdrt:query     Query SDRT entities
  pnpm sdrt:mcp       Dry-run the read-only SDRT MCP server
  pnpm admin -- ...   S8 platform-principal/session/step-up/lease operator CLI

Required order
  npm --prefix mvp-build ci
  pnpm audit
  pnpm preflight --strict
  pnpm typecheck && pnpm lint
  pnpm build
  pnpm test
  pnpm verify
  pnpm dev
  pnpm s9:go-no-go

No command silently converts the npm workspace to pnpm, pulls test images, starts a tunnel, applies remote infrastructure, or promotes a release.
`);
