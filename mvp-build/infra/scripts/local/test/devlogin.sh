#!/usr/bin/env bash
# Owner "login" for live testing: opens a headed browser at the dev-login URL, which
# mints an owner web session, sets the amtech_owner_session cookie, and redirects to
# that employee's Work Surface — so you land logged in. Solves `owner_session_invalid`
# (the real /login is a Phase 1 stub). Needs DEV_OWNER_LOGIN=1 (set by live:up) and web up.
#
# Run:  bash infra/scripts/local/test/devlogin.sh <employeeId> [--print]
#   --print  only print the URL, do not open a browser.
set -uo pipefail
emp="${1:-}"
[ -z "$emp" ] && { echo "usage: devlogin.sh <employeeId> [--print]" >&2; exit 1; }
url="http://localhost:3000/api/dev/login?employeeId=$emp"
echo "$url"
if [ "${2:-}" != "--print" ]; then
  nohup xdg-open "$url" >/dev/null 2>&1 &
  echo "[live] opened headed browser (logs in + lands on /agent/$emp)"
fi
