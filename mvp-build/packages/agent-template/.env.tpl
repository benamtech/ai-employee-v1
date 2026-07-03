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

# Model + connector provider secrets are provided as secret references by the Manager.
# Manager tool access is an AMTECH-controlled runtime credential for this profile.
MANAGER_API_ORIGIN={{MANAGER_API_ORIGIN}}
MANAGER_INTERNAL_TOKEN={{MANAGER_INTERNAL_TOKEN}}
