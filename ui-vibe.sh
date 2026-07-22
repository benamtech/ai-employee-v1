#!/usr/bin/env bash
set -Eeuo pipefail

REPO_URL="https://github.com/benamtech/ai-employee-v1.git"
BRANCH="agent/employee-ui-port-adapters-current"
REPO_DIR="${AMTECH_REPO_DIR:-$HOME/src/ai-employee-v1}"
MVP_DIR="$REPO_DIR/mvp-build"
DEFAULT_SCENARIO="clothing-ops"

say() { printf '\n\033[1;36m%s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }
command_exists() { command -v "$1" >/dev/null 2>&1; }

say "AMTECH UI vibe-coding setup"
printf "You will only be asked to name the UI variant.\n"

if command_exists pacman; then
  say "Installing or confirming Manjaro/Arch system requirements"
  sudo pacman -Syu --needed --noconfirm \
    git nodejs npm base-devel \
    nss atk at-spi2-core cups libdrm dbus libxkbcommon mesa \
    pango cairo alsa-lib gtk3 xdg-utils
else
  command_exists git || fail "Git is required. Install Git, then rerun this script."
  command_exists node || fail "Node.js 20 or newer is required. Install Node.js, then rerun this script."
  command_exists npm || fail "npm is required. Install npm, then rerun this script."
fi

mkdir -p "$(dirname "$REPO_DIR")"

if [[ ! -d "$REPO_DIR/.git" ]]; then
  say "Downloading AMTECH"
  git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"
git fetch origin

if [[ -n "$(git status --porcelain)" ]]; then
  current_branch="$(git branch --show-current)"
  [[ "$current_branch" == "$BRANCH" ]] || fail "The repository has uncommitted work on '$current_branch'. Commit or move it before switching to '$BRANCH'."
  printf "Existing uncommitted UI work detected. The script will not pull over it.\n"
else
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git switch "$BRANCH"
  else
    git switch --track "origin/$BRANCH"
  fi
  git pull --ff-only origin "$BRANCH"
fi

cd "$MVP_DIR"

say "Installing project dependencies"
npm install
npm run local:browser-install
node scripts/ui-variant.mjs doctor

if ! command_exists claude; then
  say "Installing Claude Code"
  npm install -g @anthropic-ai/claude-code || fail "Claude Code installation failed. Configure npm global installs for your user, then rerun this script."
fi

printf '\nName this UI variant using lowercase words and hyphens.\n'
printf 'Example: amtech-command-center\n\n'
read -r -p "Variant name: " VARIANT

[[ "$VARIANT" =~ ^[a-z][a-z0-9-]{1,62}[a-z0-9]$ ]] || fail "Use 3-64 lowercase letters, numbers, and hyphens; start with a letter and end with a letter or number."

say "Starting the live UI workspace"
printf "Claude may ask you to sign in the first time. Follow the instructions it displays.\n"
exec node scripts/ui-variant-collaborator.mjs "$VARIANT" --agent claude --scenario "$DEFAULT_SCENARIO"
