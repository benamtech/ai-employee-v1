# Per-profile env (template). Rendered per client. Secrets are injected BY REFERENCE
# at provision time, never committed. SMS signature must never be disabled in prod.

CLIENT_ID={{CLIENT_ID}}
ACCOUNT_ID={{ACCOUNT_ID}}
EMPLOYEE_ID={{EMPLOYEE_ID}}
EMPLOYEE_NAME={{EMPLOYEE_NAME}}
OWNER_PHONE_E164={{OWNER_PHONE_E164}}
TIMEZONE={{TIMEZONE}}

# Twilio (employee's own number). Allowlist trusts the signature, not the From field.
EMPLOYEE_NUMBER_E164={{EMPLOYEE_NUMBER_E164}}
SMS_ALLOWED_USERS={{OWNER_PHONE_E164}}
SMS_WEBHOOK_URL={{WEBHOOK_URL}}
SMS_INSECURE_NO_SIGNATURE=false

# Hermes API server. The api_server platform reads config.yaml (e.g.
# platform_toolsets.api_server, mcp_servers) — these keys are NOT ignored; env
# and config.yaml both apply. Secrets stay in env; capability wiring is in config.
# Bind 0.0.0.0 (all container interfaces) so the Manager can reach the runtime
# through Docker's port publish, which forwards to the container's eth0 — a
# 127.0.0.1 bind is only reachable from the container's own loopback and yields
# runtime_unreachable. Host exposure is already limited: the port is published on
# 127.0.0.1 only and every request requires the API_SERVER_KEY bearer.
API_SERVER_ENABLED=true
API_SERVER_KEY={{API_SERVER_KEY}}
API_SERVER_PORT={{GATEWAY_PORT}}
API_SERVER_HOST=0.0.0.0

# Model + connector provider secrets are provided as secret references by the Manager.
# Manager tool access is rendered into config.yaml as a scoped per-employee MCP
# credential, never the global Manager internal bearer.
#
# Local no-key model bridge (you-are-the-LLM): when HERMES_MODEL_PROVIDER is set the
# renderer fills these with a dummy key + the bridge base_url so the custom provider
# reaches the parked-request bridge; both are empty in production (real key is a
# Manager-injected secret ref, and the shipped model is claude-opus-4-8 on Anthropic).
OPENAI_API_KEY={{MODEL_BRIDGE_API_KEY}}
OPENAI_BASE_URL={{MODEL_BRIDGE_BASE_URL}}
MANAGER_API_ORIGIN={{MANAGER_API_ORIGIN}}
