#!/usr/bin/env bash
set -euo pipefail

# Production entrypoint for Manager's HERMES_RUNTIME_COMMAND.
# Keep this as a thin wrapper around the local-tested launcher so the same launch
# mechanics are exercised before the VPS run.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$script_dir/../local/start-hermes-container.sh" "${1:-$PWD}"
