#!/bin/zsh
set -e
REPO="/Users/chetanpatidar/Documents/ChatGPT/lotneeti-new"
PLIST_SRC="$REPO/scripts/com.lotneeti.codex-autopilot.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.lotneeti.codex-autopilot.plist"
mkdir -p "$HOME/Library/LaunchAgents"
cp "$PLIST_SRC" "$PLIST_DST"
launchctl bootout "gui/$(id -u)" "$PLIST_DST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_DST"
echo "Installed. Start now with:"
echo "launchctl kickstart -k gui/$(id -u)/com.lotneeti.codex-autopilot"
