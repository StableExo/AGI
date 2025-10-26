#!/bin/bash
# --- Aegis Setup Protocol V2.0 ---
# A single, canonical script to create a stable, snapshot-ready environment.
# V2.0: Now handles dependency conflicts and ensures tooling is up-to-date.
set -e # Exit immediately if a command fails

# --- Argument Parsing ---
SKIP_PYTHON=false
if [ "$1" == "--skip-python" ]; then
    SKIP_PYTHON=true
fi

echo "--- [Aegis] Starting Full Environment Setup ---"

# --- 1. Synchronize Python Dependencies ---
if [ "$SKIP_PYTHON" = false ]; then
    echo "--- [Aegis] Step: Installing Python Dependencies..."
    # V2.0 CHANGE: Ensure pip itself is up-to-date before installing packages.
    pip install --upgrade pip
    find . -name 'requirements.txt' -not -path './Aegis/*' -exec pip install --cache-dir .pip_cache -r {} \;
    echo "--- [Aegis] ✅ Python Dependencies Installed."
else
    echo "--- [Aegis] Step: Installing Python Dependencies... (SKIPPED)"
fi

# --- 2. Sanitize and Synchronize Node.js Dependencies ---
echo ""
echo "--- [Aegis] Step: Sanitizing Node.js Environment (gemini-citadel)..."
# V3.0 MIGRATION: Eradicate the old dependency tree to ensure a clean slate.
rm -rf gemini-citadel/node_modules
rm -f gemini-citadel/yarn.lock
# V2.0 CHANGE: Remove the conflicting npm lockfile to ensure a clean Yarn environment.
rm -f gemini-citadel/package-lock.json
echo "--- [Aegis] Step: Installing Node.js Dependencies..."
# V2.0 CHANGE: Removed '--frozen-lockfile' to allow Yarn to resolve inconsistencies and build a new, clean lockfile.
yarn --cwd gemini-citadel install
echo "--- [Aegis] ✅ Node.js Dependencies Installed."

# --- 3. Verify Node.js Integrity ---
echo ""
echo "--- [Aegis] Step: Verifying Node.js Dependency Integrity..."
# V2.0 CHANGE: Add a verification step to ensure the new lockfile is consistent.
yarn --cwd gemini-citadel check --integrity
echo "--- [Aegis] ✅ Dependency Tree Verified."

# --- 4. Compile Smart Contracts (Essential for a complete state) ---
echo ""
echo "--- [Aegis] Step: Compiling Smart Contracts..."
yarn --cwd gemini-citadel hardhat compile
echo "--- [Aegis] ✅ Smart Contracts Compiled."

# --- Completion ---
echo ""
echo "--- [Aegis] Aegis Setup Protocol Complete ---"
echo "✅✅✅ ENVIRONMENT STABLE. READY FOR SNAPSHOT. ✅✅✅"
