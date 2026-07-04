# Local VPS-faithful test loop (Docker + Caddy, no SMS)

Run the whole AI Employee spine on this machine, exactly as it runs on a VPS —
Hermes in Docker (one container per employee, its own port + API key), Caddy in
front, the real `provision_employee` tool — with the **only** shortcut being
Twilio SMS (skipped locally; the Manager owns SMS ingress anyway).

**The loop:** browser Work Surface (or a terminal script) → Manager
`/manager/employee/:id/message` → `deliverOwnerTurnToRuntime` → `executeHermesTurn`
→ the employee's **local Hermes container** → OpenRouter/OpenAI → reply on the
Work Surface. All real, no SMS.

```
  Browser (Work Surface)  ─┐
                           ├─► Next.js web (:3000, proxy) ─► Manager (:8080) ─► Hermes container (:81xx, api_server)
  Terminal chat.mjs      ─┘                                        │                        │
                                                            Supabase (hosted)         OpenRouter/OpenAI
```

---

## 0. Prereqs (one-time)

**Docker + Caddy** (Manjaro):
```
sudo pacman -S --needed docker docker-compose caddy
sudo systemctl enable --now docker.service
sudo usermod -aG docker $USER   # then log out/in (or `newgrp docker`)
docker ps                       # must work without sudo
```

**Build the Hermes image** (from the installed hermes-agent source):
```
docker build -t hermes-agent ~/.hermes/hermes-agent
```

**Hermes model/provider** must be configured so the agent can actually reply.
You already have OpenRouter + OpenAI keys in `~/.hermes/.env`; confirm a default
model is set (`hermes model`). The per-employee container copies `~/.hermes/config.yaml`
+ those provider keys, so it inherits your working setup.

**Supabase** — project `amtech-ai-employee-mvp` (`uxuruijrgghshfwnaagb`) is created.
From the dashboard grab two secrets:
- Settings → API → **service_role** key
- Settings → Database → **Connection string (URI)** → the `postgresql://...` `DATABASE_URL`

---

## 1. Configure env (one-time)

```
cd mvp-build
cp .env.local.example .env
# edit .env: paste SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL
cp apps/web/.env.local.example apps/web/.env.local   # matches MANAGER_INTERNAL_TOKEN
```

Load the Manager env into your shell (Manager uses `tsx watch`, which does not
read .env on its own):
```
set -a && source .env && set +a
```

**Apply the schema** (migrations 0001–0015):
```
npm run db:migrate      # uses DATABASE_URL
npm run db:status       # all 15 should show "applied"
```

---

## 2. Bring up the stack (4 terminals)

Each terminal that runs Node needs the env: `set -a && source .env && set +a` first.

```
# T1 — Manager control plane (:8080)
set -a && source .env && set +a
npm run manager:dev

# T2 — Web / Work Surface (:3000)  [reads apps/web/.env.local automatically]
npm run web:dev

# T3 — Caddy (optional for the core loop; faithful agent subdomains)
caddy run --config infra/caddy/Caddyfile.local

# T4 — your driver terminal (provision + chat)
set -a && source .env && set +a
```

Sanity: `curl -s localhost:8080/health` → `{"status":"ok",...}`.

---

## 3. Provision one employee (real tool, no SMS)

In T4:
```
node infra/scripts/local/bootstrap.mjs
```
This inserts a verified phone (bypassing Twilio Verify), runs `create_account`
and `provision_employee`, and starts the employee's Hermes container via
`infra/scripts/hermes-runtime-docker.sh`. It prints:
- `employee_id`
- `owner_session_token`
- Work Surface URL: `http://localhost:3000/agent/<employee_id>`
- a ready-to-run terminal-chat command

Check the container:
```
docker ps | grep hermes-        # hermes-<employee_id> should be Up
curl -s -H "Authorization: Bearer <api_key>" http://127.0.0.1:<port>/health
```
(`<port>`/key are in the container's data dir `~/amtech-local/clients/<emp>/hermes-home/.env`.)

---

## 4. Use it

**Terminal** (fastest first proof) — the command bootstrap printed, e.g.:
```
OWNER_SESSION_TOKEN='ow_...' EMPLOYEE_ID='emp_...' \
  MANAGER_INTERNAL_TOKEN='...' node infra/scripts/local/chat.mjs "hi, what can you do?"
```
A real LLM reply = the whole spine works.

**Browser (Work Surface):**
1. Open `http://localhost:3000`.
2. Set the session cookie (DevTools → Application → Cookies → `http://localhost:3000`):
   name `amtech_owner_session`, value = the `owner_session_token` from bootstrap.
3. Open `http://localhost:3000/agent/<employee_id>` and chat. Messages route through
   the same Manager path; replies render on the Work Surface.

---

## 5. Troubleshooting

- **provision "failed" at runtime** → the container didn't come up. `docker logs hermes-<emp>`.
  Common causes: image not built (`docker images | grep hermes-agent`), no model/provider
  configured, or port already in use.
- **`runtime_auth` on chat** → the sealed API key doesn't match the container's
  `API_SERVER_KEY`. The wrapper writes both from the same provisioned key; if you
  re-provisioned, restart from a clean `~/amtech-local/clients/<emp>`.
- **Manager 401** → `MANAGER_INTERNAL_TOKEN` in `.env` and `apps/web/.env.local` must match.
- **DB errors** → confirm `npm run db:status` shows all 15 migrations applied.
- **Reset a run** → `docker rm -f hermes-<emp>` and delete `~/amtech-local/clients/<emp>`,
  then re-run bootstrap (it makes a fresh account each time).

---

## What's faithful vs. shortcut

| Piece | Local | Production |
|---|---|---|
| Hermes runtime | Docker container per employee, own port + API key | same |
| Reverse proxy | Caddy (`*.agents.localhost`, http) | Caddy (`*.agents.amtechai.com`, https) |
| Provisioning | real `provision_employee` tool | same |
| DB / Auth / Storage | hosted Supabase | hosted Supabase |
| Model | your OpenRouter/OpenAI keys | employee model keys |
| **SMS** | **skipped** (`PROVISIONER_SKIP_SMS=1`) | Twilio 10DLC |
| Phone verify | seeded `verified_phones` row | Twilio Verify |

Optional upgrades (later): **Resend** for the estimate→email-reply flow, **ngrok**
to expose the Manager for real inbound webhooks, **Netlify** to host the web surface.
