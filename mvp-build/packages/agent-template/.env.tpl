# Per-profile env (template). Rendered per client. Production profiles contain
# only employee-scoped gateway credentials and Manager-scoped credentials, never
# provider master keys. SMS signature must never be disabled in prod.

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
# and config.yaml both apply. Capability wiring is in config.
API_SERVER_ENABLED=true
API_SERVER_KEY={{API_SERVER_KEY}}
API_SERVER_PORT={{GATEWAY_PORT}}
API_SERVER_HOST=0.0.0.0

# Model Gateway custody. The employee uses a scoped gateway credential bound to
# account_id, employee_id, allowed aliases/providers, limits, expiry, and
# credential_version. Provider selection and provider master secrets live only in
# the host-private gateway, not this profile.
MODEL_GATEWAY_URL={{MODEL_GATEWAY_URL}}
MODEL_GATEWAY_TOKEN={{MODEL_GATEWAY_TOKEN}}
MODEL_GATEWAY_MODEL_ALIAS={{MODEL_GATEWAY_MODEL_ALIAS}}
MODEL_GATEWAY_CREDENTIAL_VERSION={{MODEL_GATEWAY_CREDENTIAL_VERSION}}
MODEL_GATEWAY_POLICY_JSON={{MODEL_GATEWAY_POLICY_JSON}}

MANAGER_API_ORIGIN={{MANAGER_API_ORIGIN}}
HERMES_DOCKER_NETWORK={{HERMES_DOCKER_NETWORK}}

# CE-1 native context primer hook. This scoped credential is the same
# per-employee Manager MCP bearer rendered into config.yaml; it is not the global
# Manager internal token.
HERMES_ACCEPT_HOOKS=1
MANAGER_MCP_TOKEN={{MANAGER_MCP_TOKEN}}
