#!/bin/bash
# --- Operation Hot-Load ---
# A rapid, parallelized environment setup script for development.
# Skips all tests and compilation for maximum speed.
set -e # Exit immediately if a command fails

log_step() {
  echo ""
  echo "--- [Hot-Load] Step: $1 ---"
}

# --- 1. Prerequisite Check ---
log_step "Verifying Prerequisites (node, yarn, pip)..."
command -v node >/dev/null 2>&1 || { echo >&2 "❌ Prerequisite Failure: 'node' is not installed. Aborting."; exit 1; }
command -v yarn >/dev/null 2>&1 || { echo >&2 "❌ Prerequisite Failure: 'yarn' is not installed. Aborting."; exit 1; }
command -v pip >/dev/null 2>&1 || { echo >&2 "❌ Prerequisite Failure: 'pip' is not installed. Aborting."; exit 1; }
echo "✅ Prerequisites Met."

# --- 2. Parallel Dependency Installation ---
log_step "Starting Parallel Dependency Installation..."

# Start Node.js installation in the background
(
  echo "[Hot-Load] Synchronizing Node.js Dependencies (gemini-citadel)..."
  yarn --cwd gemini-citadel install --frozen-lockfile
  echo "[Hot-Load] ✅ Node.js dependencies are in sync."
) &
NODE_PID=$!

# Start Python installation in the background
(
  echo "[Hot-Load] Synchronizing Python Dependencies (Repository-Wide)..."
  CHECKSUM_FILE=".keystone_checksums"
  CURRENT_CHECKSUM=$(find . -name 'requirements.txt' -not -path './Aegis/*' -print0 | sort -z | xargs -0 cat | sha256sum | awk '{ print $1 }')
  PREVIOUS_CHECKSUM=""
  if [ -f "$CHECKSUM_FILE" ]; then PREVIOUS_CHECKSUM=$(cat "$CHECKSUM_FILE"); fi

  if [ "$CURRENT_CHECKSUM" = "$PREVIOUS_CHECKSUM" ]; then
    echo "[Hot-Load] ✅ Python dependencies are already in sync. Skipping."
  else
    echo "[Hot-Load] >>> Installing Python dependencies..."
    find . -name 'requirements.txt' -not -path './Aegis/*' -exec pip install --cache-dir .pip_cache -r {} \;
    echo "$CURRENT_CHECKSUM" > "$CHECKSUM_FILE"
    echo "[Hot-Load] ✅ Python dependencies synchronized."
  fi
) &
PYTHON_PID=$!

# Wait for both background jobs to complete
wait $NODE_PID
NODE_STATUS=$?
wait $PYTHON_PID
PYTHON_STATUS=$?

# Check if either of the background jobs failed
if [ $NODE_STATUS -ne 0 ] || [ $PYTHON_STATUS -ne 0 ]; then
    echo "❌ One or more dependency installations failed. Aborting."
    exit 1
fi

echo "[Hot-Load] ✅ Parallel installations complete."

# --- Completion ---
log_step "Hot-Load Protocol Complete"
echo ""
echo "✅✅✅ WORKSPACE READY. AWAITING OPERATOR COMMAND. ✅✅✅"
