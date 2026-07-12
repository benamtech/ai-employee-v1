# Production Networking, DNS & TLS — Pod Alpha

Status: design · 2026-07-11 · author: source audit + cited design (no live host) · scope = Part B of the two-way-surface pass

Founder decision this session: managed DNS provider = **Cloudflare**. Companion docs:
[`inbound-two-way-surface-map.md`](inbound-two-way-surface-map.md) (Part A),
[`roles-and-delegated-permissions-design.md`](roles-and-delegated-permissions-design.md) (Part C).

## Problem statement

The outbound routing substrate is proven on a real Docker host (`caddy-activation.ts` writes a per-client
snippet and reloads Caddy via the Admin API — see
[`../memory/2026-07-11-1900-pod-alpha-lifecycle-dns-routing-proven-on-host.md`](../memory/2026-07-11-1900-pod-alpha-lifecycle-dns-routing-proven-on-host.md)).
What does NOT yet exist anywhere in the repo: **public DNS zone management, a wildcard for per-employee
subdomains, per-subdomain TLS strategy, and IPv6/dual-stack.** For a real person or a provider webhook to
reach an employee in production, the box needs a public name that resolves, a valid cert for it, and a
firewall posture that admits only the right traffic.

The mental model stays simple: **fixed core + dynamic fleet on one shared Docker network**. The fixed core
(`manager`, `web`, `caddy`) is docker-compose topology. The dynamic fleet is one provisioner-launched Hermes
container per customer. Both populations live on `amtech_runtime`, so Caddy can route public names to
employee container DNS aliases and Manager can keep launching/retiring employees as tenant data.

## Current state (confirmed in-repo)

`infra/caddy/Caddyfile`:
- Owner surfaces: `amtechai.com`, `www.amtechai.com`, `agent.amtechai.com` → Web (`localhost:3000`).
- Backend/webhooks: `api.amtechai.com` → Manager (`localhost:8080`) — the only surface Twilio/Gmail/Stripe/
  Intuit hit.
- Per-employee gateways: `import ./clients/*.caddy`; each snippet (`infra/caddy/client-snippet.tpl`) is a
  static site block `{{CLIENT_SLUG}}.agents.amtechai.com { reverse_proxy localhost:{{GATEWAY_PORT}} }`.

`infra/deploy/docker-compose.yml`:
- `caddy` publishes `80:80` and `443:443`; `manager` and `web` publish to **`127.0.0.1:8080`/`127.0.0.1:3000`
  (loopback only)**. All three plus the per-employee `amtech-hermes-<id>` containers share the host-owned
  external network `amtech_runtime` (Docker-DNS routes Caddy → each employee by alias).
- `manager` mounts `/var/run/docker.sock` (it launches employee containers) — a total-host blast radius if
  the Manager process is compromised.

**Gaps:** no wildcard site block, **no `on_demand_tls`, no `ask` endpoint**, no DNS provider integration
(Caddy uses its default per-domain ACME issuance on reload for each imported snippet), no AAAA/IPv6, no DNS
zone-as-code, no per-env callback URL matrix. There is also a **naming split to resolve in DNS**:
owner uses `agent.amtechai.com` (singular host) while employees use `*.agents.amtechai.com` (plural, a
subdomain that itself has children). Both must be covered.

## 1. Public DNS zone for `amtechai.com` (Cloudflare)

Records for Pod Alpha (single VPS, one public IPv4 `A_IP`, optional IPv6 `AAAA_IP`):

| Name | Type | Value | Purpose |
|---|---|---|---|
| `amtechai.com` | A (+ AAAA later) | `A_IP` (+ `AAAA_IP`) | apex owner site |
| `www` | A/AAAA or CNAME→apex | `A_IP` | www owner site |
| `api` | A (+ AAAA later) | `A_IP` | Manager webhooks/API (Twilio/Gmail/Stripe/Intuit ingress) |
| `agent` | A (+ AAAA later) | `A_IP` | owner employee web route (Next handles `/agent/*`) |
| `*.agents` | A (+ AAAA later) | `A_IP` | **wildcard** — every employee subdomain resolves with no per-client DNS write |

Cloudflare wildcard DNS records are first-label `*` records; Cloudflare documents that exact records take
precedence over wildcard records and that wildcard records can be DNS-only or proxied. That matches the
fleet shape: `*.agents.amtechai.com` is a static wildcard record, while `api.amtechai.com` and
`agent.amtechai.com` remain exact records. Source:
<https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/>.

The wildcard `*.agents.amtechai.com` is the key record: provisioning a new employee writes only a Caddy
snippet (already built) and needs **zero DNS mutation** — the name already resolves. This keeps per-client
provisioning to "write snippet + reload Caddy," which is the proven path.

**Cloudflare proxy (orange-cloud) vs DNS-only (grey-cloud):** run the wildcard and `api` **DNS-only (grey)**
for Pod Alpha. The intent is for Cloudflare to be the registrar/DNS provider and DNS-01 API, while the VPS
terminates TLS in Caddy. Cloudflare does support proxied WebSockets, with WAF inspection on the initial
upgrade request and long-lived-connection accounting caveats, so proxied mode is not impossible; it is just
an avoidable extra variable for webhook signature debugging, SSE/long-lived streams, and Caddy's own cert
lifecycle. Source: <https://developers.cloudflare.com/network/websockets/>.

**Provisioning:** wildcard is a **static** record — set once, no API-driven per-client DNS. TTL: use
Cloudflare DNS-only `Auto`/300s or an explicit 300s during Pod Alpha bring-up for quick change propagation;
raise only after the zone is stable. Cloudflare documents DNS-only TTLs as configurable, with Auto = 300s.
Source: <https://developers.cloudflare.com/dns/manage-dns-records/reference/ttl/>.

## 2. Per-subdomain TLS — the decision

Two viable strategies can give every `*.agents.amtechai.com` employee a valid cert:

### Option A — Caddy on-demand TLS (per-host issuance + an `ask` endpoint)

Caddy on-demand TLS obtains a certificate during the first TLS handshake for an SNI hostname not yet known
at config load. Caddy's docs require abuse restrictions for production, primarily an `ask` endpoint that
returns permission for the requested hostname; without that, public on-demand TLS can be abused to exhaust
server or CA resources. Source: <https://caddyserver.com/docs/automatic-https>.

- Pros: no DNS provider API credential; useful for customer-owned domains or domains unknown at config load.
- Cons: issuance happens **on live traffic**; the first hit to a new employee subdomain can wait on ACME.
  Each concrete employee hostname is a separate certificate unless a configured wildcard applies. This runs
  against Let's Encrypt's new-order and registered-domain limits if a burst or bug causes per-employee
  issuance. Let's Encrypt currently documents 300 new orders per account per 3 hours and 50 certificates per
  registered domain every 7 days. Source: <https://letsencrypt.org/docs/rate-limits/>.

### Option B — Wildcard cert via DNS-01 (Cloudflare) — RECOMMENDED

Build Caddy with the Cloudflare DNS plugin (`caddy-dns/cloudflare`) and issue a **single wildcard cert for
`*.agents.amtechai.com`** (plus SAN `agents.amtechai.com` if needed) via the DNS-01 challenge, using a
**scoped Cloudflare API token**. Caddy documents that wildcard certificates require DNS validation and shows
the Cloudflare Caddyfile shape `tls { dns cloudflare {env.CLOUDFLARE_API_TOKEN} }`. Sources:
<https://caddyserver.com/docs/automatic-https>,
<https://caddyserver.com/docs/caddyfile/directives/tls>, and
<https://github.com/caddy-dns/cloudflare>.

- Pros: **one cert, issued ahead of traffic** — no first-hit ACME race, no per-subdomain issuance, no public
  `ask` endpoint, and no per-employee DNS writes. The DNS challenge does not require open inbound ports and
  lets Caddy set/clear `_acme-challenge` TXT records through Cloudflare's API. Source:
  <https://caddyserver.com/docs/automatic-https>.
- Cons: needs a Cloudflare API token scoped to the `amtechai.com` zone. The Cloudflare plugin recommends a
  single token with `Zone.Zone:Read` and `Zone.DNS:Edit`; Cloudflare's token docs also support limiting a
  token to specific zone resources. Sources: <https://github.com/caddy-dns/cloudflare> and
  <https://developers.cloudflare.com/fundamentals/api/get-started/create-token/>. This also requires a custom
  Caddy build (the stock `caddy:2.8-alpine` compose image has no DNS plugins). The wildcard only covers one
  label under `agents`; employee slugs must stay single-label.

The owner surfaces (`amtechai.com`, `www`, `api`, `agent`) keep Caddy's default automatic HTTPS (HTTP-01 /
TLS-ALPN-01 on 443) — they are a fixed, small set with public A records, so no wildcard needed there.

**Recommendation for Pod Alpha: Option B (Cloudflare DNS-only + static `*.agents` DNS + Caddy wildcard
DNS-01).** It removes the on-demand issuance race and the per-subdomain rate-limit exposure, needs no public
`ask` endpoint, and fits the "wildcard DNS + one cert" shape of a per-employee-subdomain fleet. The only new
dependency is a one-time scoped DNS token plus a plugin-built Caddy image. Keep Option A documented as the
fallback if a DNS token is ever unavailable.

### Renewal & failure modes

- Caddy manages automatic certificate renewal and stores certs/account material in its data storage. Keep the
  existing `caddy_data` named volume in the backup/restore story so a host rebuild does not unnecessarily
  reissue. Source: <https://caddyserver.com/docs/automatic-https>.
- Let's Encrypt duplicate-certificate and exact-identifier limits still apply to the wildcard. A single
  wildcard reissued occasionally is nowhere near those limits, but deleting `caddy_data` repeatedly during
  troubleshooting can burn the exact-set limit. Let's Encrypt documents 5 certificates per exact set of
  identifiers every 7 days. Source: <https://letsencrypt.org/docs/rate-limits/>.
- Wire wildcard-renewal failure into the P2 red-health alert. One wildcard renewal failure is a single
  alertable event, not a per-tenant scatter.

## 3. IPv4 vs IPv6 (dual-stack)

- **IPv4:** one public `A_IP`; Caddy binds `0.0.0.0:80`/`:443` (compose publishes `80:80`,`443:443`).
- **IPv6:** optional/deferred for Pod Alpha. If the VPS has a clean `AAAA_IP`, add AAAA records for apex/
  `www`/`api`/`agent`/`*.agents` and ensure Docker + Caddy bind dual-stack. Docker documents IPv6 enablement
  through `/etc/docker/daemon.json` (`"ipv6": true`, `fixed-cidr-v6`) and notes `ip6tables` for IPv6 packet
  filtering/port mapping. Source: <https://docs.docker.com/engine/daemon/ipv6/>.
- **Recommendation:** ship IPv4-first for Pod Alpha unless the VPS/provider requirement changes. No provider
  webhook source in scope requires inbound IPv6, and dual-stack Docker adds operational surface. Revisit after
  the one-VPS path is stable or if a client network/SEO requirement demands AAAA.
- **Outbound IPv6 from employee containers:** not needed; provider APIs are reachable over IPv4. Keeping
  employees IPv4-only also simplifies the egress allowlist.
- **Reverse DNS (PTR):** set a PTR for the mail-adjacent story if AMTECH ever sends email from the box; not
  required now (Gmail send goes through the Gmail API, not SMTP from the VPS).

## 4. Webhook ingress vs egress default-deny

All provider callbacks POST to **`api.amtechai.com`** (Manager, `localhost:8080`): Twilio SMS +
status callbacks, Gmail Pub/Sub push, Stripe events, Intuit/QuickBooks. Requirements:

- `api.amtechai.com` must be publicly reachable on 443 with a valid cert **before** any provider webhook is
  registered, and the exact per-env callback URL must be configured provider-side (`SMS_WEBHOOK_BASE_URL`
  already drives the Twilio-signed URL in `webhooks/twilio.ts:24-29`; the signature check fails if the public
  URL and the signed URL disagree, so the callback URL and env var must match per environment).
- **Inbound is unaffected by egress default-deny.** The P2 egress control (roadmap) is about the *employee
  containers'* OUTBOUND network being default-deny with an allowlist (lethal-trifecta closure). Provider
  webhooks are inbound to Manager and do not traverse employee egress. What DOES belong on an allowlist is the
  **Manager's own outbound** calls to provider APIs (Twilio/Gmail/Stripe/Intuit) and to Supabase — those are
  Manager egress, not employee egress, and should be allowlisted when egress control lands.

## 5. VPS firewall posture

- **Public:** only `80` and `443` (Caddy). 80 stays open for ACME HTTP-01 on the owner surfaces and for
  HTTP→HTTPS redirect; with DNS-01 wildcard for employees, 80 is not needed for employee-subdomain issuance.
- **Loopback only:** Manager `8080` and Web `3000` are already bound to `127.0.0.1` in compose — never expose
  them publicly; Caddy reaches them over the `amtech_runtime` Docker network / loopback.
- **`docker.sock` blast radius:** Manager mounts the Docker socket to launch employees. A Manager compromise =
  full host control. Mitigations to document (not all Pod-Alpha-blocking): run Manager as least-privilege,
  keep the socket read-restricted where possible, treat the Manager image + deps as the top security-review
  priority, and rely on the employee-egress default-deny so a prompt-injected *employee* (the untrusted-content
  surface) cannot reach the socket — only Manager can, and Manager does not execute model-authored code.
- Recommend `ufw`/`nftables` default-deny inbound except 22 (SSH, key-only, ideally IP-allowlisted) + 80 + 443.

## Built path added after this design

The production networking path is now executable without claiming live DNS/TLS acceptance:

- `infra/scripts/cloudflare-dns.mjs` / `npm run dns:cloudflare:plan` computes the Cloudflare desired state
  for apex, `www`, `api`, `agent`, and static `*.agents` records. It is dry-run by default; apply requires
  `--apply` plus `CLOUDFLARE_DNS_APPLY_CONFIRM=amtechai.com`.
- `infra/deploy/caddy.Dockerfile` builds Caddy with `github.com/caddy-dns/cloudflare`, and
  `infra/caddy/production.Caddyfile` keeps owner/API hosts on normal Automatic HTTPS while using DNS-01 for
  `*.agents.amtechai.com`.
- `npm run ops:caddy-wildcard-proof` validates the production config and plugin presence locally; it does
  not order a certificate.
- `npm run prod-env:proof` aggregates the latest proof JSONs into a production-environment status record for
  admin readiness. Proof tiers stay explicit: `static`, `local_mirror`, `limited_live_infra`, and
  `provider_runtime_live`.
- The admin console now displays this environment readiness read-only. Cloudflare apply, egress apply, and
  production deploy operations remain CLI-gated operator actions.

## Part D — where networking sits in the sequence

This is no longer docs-only: the safe desired-state, Caddy build path, proof aggregation, and admin visibility
are source-wired. It still slots into the deploy-foundation work (roadmap P0) and the "limited real-VPS
production tests" step, reconciled with
[`../second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md`](../second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md):

1. **Now:** source-wired DNS desired-state tooling, plugin Caddy path, local proof scripts, and admin visibility.
2. **P0 deploy foundation:** stand up the compose stack, the concrete employee `docker run`, and run the
   Cloudflare/Caddy scripts on the target host. This makes the production path executable but not yet public-DNS
   or certificate accepted.
3. **P2 (build, no creds):** egress default-deny (employee containers) with the Manager-outbound allowlist;
   backup of `caddy_data` + profiles/workspaces.
4. **Limited real-VPS tests (creds):** prove DNS resolves, wildcard cert issues, a provider webhook reaches
   `api.amtechai.com` end to end, reboot recovery, and a real per-pod capacity number (target modest: ~20–25
   employees per 64GB node — honest, not blitzscale).
5. **Roles/delegation:** designed now (Part C), built last on the proven base.

## Sources

- Caddy Automatic HTTPS: <https://caddyserver.com/docs/automatic-https>
- Caddy Caddyfile `tls` directive: <https://caddyserver.com/docs/caddyfile/directives/tls>
- Caddy Cloudflare DNS module: <https://github.com/caddy-dns/cloudflare>
- Let's Encrypt rate limits: <https://letsencrypt.org/docs/rate-limits/>
- Cloudflare wildcard DNS records: <https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/>
- Cloudflare DNS TTL behavior: <https://developers.cloudflare.com/dns/manage-dns-records/reference/ttl/>
- Cloudflare API token creation/scoping: <https://developers.cloudflare.com/fundamentals/api/get-started/create-token/>
- Docker IPv6 networking: <https://docs.docker.com/engine/daemon/ipv6/>
- Cloudflare WebSockets/proxied long-lived connection notes: <https://developers.cloudflare.com/network/websockets/>
