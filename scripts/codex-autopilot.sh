#!/bin/zsh
set -u

REPO="/Users/chetanpatidar/Documents/ChatGPT/lotneeti-new"
LOG_DIR="$REPO/.codex-autopilot/logs"
LOCK_DIR="/tmp/lotneeti-codex-autopilot.lock"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
mkdir -p "$LOG_DIR"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "$(date): another LotNeeti Codex run is already active" >> "$LOG_DIR/supervisor.log"
  exit 0
fi
cleanup() { rmdir "$LOCK_DIR" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

cd "$REPO" || exit 1

if ! command -v codex >/dev/null 2>&1; then
  echo "$(date): codex CLI not found" >> "$LOG_DIR/supervisor.log"
  exit 1
fi

# Prevent accidental API-key billing in this unattended process.
unset OPENAI_API_KEY
unset CODEX_API_KEY

# Keep autonomous work isolated from main.
if git show-ref --verify --quiet refs/heads/codex/autopilot; then
  git switch codex/autopilot >/dev/null 2>&1 || exit 1
else
  git switch -c codex/autopilot >/dev/null 2>&1 || exit 1
fi

STAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG="$LOG_DIR/run-$STAMP.log"
PROMPT=$(cat CODEX_AUTOPILOT.md)

echo "$(date): starting autonomous Codex run" >> "$LOG_DIR/supervisor.log"

# The sandboxed full-auto mode may edit the workspace and run normal project commands.
# It must never be replaced with an unrestricted/bypass-sandbox mode.
codex exec --full-auto "$PROMPT" > "$LOG" 2>&1
CODE=$?

echo "$(date): Codex exited with code $CODE" >> "$LOG_DIR/supervisor.log"
exit 0
