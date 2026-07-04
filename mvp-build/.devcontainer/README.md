# Dev Container

Status: active

This dev container is for the AMTECH local test rig: reproducible Node tooling, live Supabase, local Manager/Web, and host Docker-controlled employee runtimes.

## Docker Outside Of Docker

The default is Docker-outside-of-Docker via the host Docker socket. That means:

- the dev container is the operator workspace;
- `provision_employee` still starts sibling `amtech-hermes-<employee_id>` containers on the host Docker daemon;
- Caddy/ports behave like the host/VPS path;
- Docker image cache and container state survive devcontainer rebuilds.

This is closer to the VPS deployment than Docker-in-Docker for the current AMTECH test goal.

## Docker-In-Docker

Docker-in-Docker is a fallback for CI-style isolation, but it is not the default here. It would put employee containers inside the devcontainer's nested daemon, making port routing, Caddy, host paths, image cache, and future VPS parity more awkward.

## Use

Open `mvp-build/` in the devcontainer, then:

```bash
cp .env.local.example .env
set -a && source .env && set +a
npm run local:check
npm run local:build-hermes
npm run db:migrate
```

Run Manager and Web in separate terminals, then bootstrap/chat per `infra/local/RUNBOOK.md`.
