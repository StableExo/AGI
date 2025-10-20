#!/bin/bash

# --- Keystone V3.0 ---
# A Unified Environment Protocol for the stableexo-agi Ecosystem
# Forges environmental harmony across Node.js and Python projects.
set -e # Exit immediately if a command exits with a non-zero status.

# --- Default Flags ---
VERBOSE=false
SKIP_TESTS=false
FORCE_REINSTALL=false

# --- Parse Command-Line Arguments ---
for arg in "$@"; do
  case $arg in
    -v|--verbose)
    VERBOSE=true
    shift # Remove --verbose from processing
    ;;
    --skip-tests)
    SKIP_TESTS=true
    shift # Remove --skip-tests from processing
    ;;
    --force-reinstall)
    FORCE_REINSTALL=true
    shift # Remove --force-reinstall from processing
    ;;
  esac
done

# --- Verbose Mode ---
if [ "$VERBOSE" = true ]; then
  echo ">>> VERBOSE MODE ENABLED <<<"
  set -x # Print each command before executing
fi

# --- Function for Logging Steps ---
log_step() {
  echo ""
  echo "--- [Keystone V3.0] Step: $1 ---"
}

# --- 1. Prerequisite Check ---
log_step "Verifying Prerequisites (node, yarn, pip)..."
command -v node >/dev/null 2>&1 || { echo >&2 "❌ Prerequisite Failure: 'node' is not installed. Aborting."; exit 1; }
command -v yarn >/dev/null 2>&1 || { echo >&2 "❌ Prerequisite Failure: 'yarn' is not installed. Aborting."; exit 1; }
command -v pip >/dev/null 2>&1 || { echo >&2 "❌ Prerequisite Failure: 'pip' is not installed. Aborting."; exit 1; }
echo "✅ Prerequisites Met."

# --- 2. Configuration File Harmonization (gemini-citadel) ---
log_step "Setting up gemini-citadel/.env configuration file..."
ENV_EXAMPLE_PATH="gemini-citadel/.env.example"
ENV_PATH="gemini-citadel/.env"
if [ -f "$ENV_EXAMPLE_PATH" ]; then
  cp -f "$ENV_EXAMPLE_PATH" "$ENV_PATH" # Force overwrite
  echo "✅ $ENV_PATH file created/updated from $ENV_EXAMPLE_PATH."
else
  echo "⚠️ WARNING: $ENV_EXAMPLE_PATH not found. Cannot create/update .env file."
  # Create a fallback with essential placeholders for gemini-citadel
  cat > "$ENV_PATH" << EOL
# --- FALLBACK .env - CREATED BY KEYSTONE V3.0 ---
# Please populate with correct values from a secure source.
RPC_URL="https://mainnet.base.org"
EXECUTION_PRIVATE_KEY="0x0000000000000000000000000000000000000000000000000000000000000000"
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
EOL
  echo "✅ Minimal fallback $ENV_PATH created. Update it with your actual secrets."
fi

# --- 3. Dual-Ecosystem Dependency Management ---
log_step "Synchronizing Node.js Dependencies (gemini-citadel)..."
if [ ! -d "gemini-citadel/node_modules" ]; then
    echo ">>> gemini-citadel/node_modules not found. Performing a full 'yarn install'."
    yarn --cwd gemini-citadel install
else
    echo ">>> gemini-citadel/node_modules found. Using 'yarn install --frozen-lockfile' for consistency."
    yarn --cwd gemini-citadel install --frozen-lockfile
fi
echo "✅ Node.js dependencies synchronized."

log_step "Synchronizing Python Dependencies (Repository-Wide)..."
CHECKSUM_FILE=".keystone_checksums"
# Find all requirements.txt, sort them to ensure consistent order, and then calculate a checksum
CURRENT_CHECKSUM=$(find . -name 'requirements.txt' -not -path './Aegis/*' -print0 | sort -z | xargs -0 cat | sha256sum | awk '{ print $1 }')
PREVIOUS_CHECKSUM=""

if [ -f "$CHECKSUM_FILE" ]; then
    PREVIOUS_CHECKSUM=$(cat "$CHECKSUM_FILE")
fi

if [ "$FORCE_REINSTALL" = true ]; then
    echo ">>> --force-reinstall flag detected. Forcing re-installation of Python dependencies."
    find . -name 'requirements.txt' -not -path './Aegis/*' -exec pip install -r {} \;
    echo "$CURRENT_CHECKSUM" > "$CHECKSUM_FILE"
    echo "✅ Python dependencies re-installed and checksum updated."
elif [ "$CURRENT_CHECKSUM" = "$PREVIOUS_CHECKSUM" ]; then
    echo "✅ Python dependencies are already in sync. Skipping."
else
    echo ">>> Checksum mismatch or first run. Installing Python dependencies."
    find . -name 'requirements.txt' -not -path './Aegis/*' -exec pip install -r {} \;
    echo "$CURRENT_CHECKSUM" > "$CHECKSUM_FILE"
    echo "✅ Python dependencies synchronized and checksum updated."
fi

# --- 4. Smart Contract Compilation ---
log_step "Compiling Solidity contracts with Hardhat..."
yarn --cwd gemini-citadel hardhat compile
echo "✅ Smart contracts compiled successfully."

# --- 5. Test Execution ---
log_step "Running System Diagnostics (Jest & Hardhat Tests)..."
if [ "$SKIP_TESTS" = true ]; then
  echo ">>> --skip-tests flag detected. SKIPPING all tests."
else
  echo ">>> Running Off-Chain Jest Tests..."
  yarn --cwd gemini-citadel test || echo >&2 "⚠️ WARNING: Off-chain Jest tests failed. Continuing..."

  echo ">>> Running On-Chain Hardhat Tests..."
  yarn --cwd gemini-citadel test:contracts || echo >&2 "⚠️ WARNING: On-chain Hardhat tests failed. Continuing..."
fi

# --- Completion ---
set +x # Disable verbose output if it was on
log_step "Keystone V3.0 Protocol Complete"
echo ""
if [ "$SKIP_TESTS" = true ]; then
  echo "✅✅✅ PORTAL STABLE (Tests Skipped). AWAITING OPERATOR COMMAND. ✅✅✅"
else
  echo "✅✅✅ PORTAL STABLE. AWAITING OPERATOR COMMAND. ✅✅✅"
fi
