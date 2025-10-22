#!/bin/bash
# --- Aegis Setup Protocol V1.0 ---
# A single, canonical script to create a stable, snapshot-ready environment.
set -e # Exit immediately if a command fails

echo "--- [Aegis] Starting Full Environment Setup ---"

# --- 1. Synchronize Python Dependencies ---
echo "--- [Aegis] Step: Installing Python Dependencies..."
# We remove the checksum logic as this is a one-time clean install.
find . -name 'requirements.txt' -not -path './Aegis/*' -exec pip install -r {} \;
echo "--- [Aegis] ✅ Python Dependencies Installed."

# --- 2. Synchronize Node.js Dependencies ---
echo ""
echo "--- [Aegis] Step: Installing Node.js Dependencies (gemini-citadel)..."
yarn --cwd gemini-citadel install --frozen-lockfile
echo "--- [Aegis] ✅ Node.js Dependencies Installed."

# --- 3. Compile Smart Contracts (Essential for a complete state) ---
echo ""
echo "--- [Aegis] Step: Compiling Smart Contracts..."
yarn --cwd gemini-citadel hardhat compile
echo "--- [Aegis] ✅ Smart Contracts Compiled."

# --- Completion ---
echo ""
echo "--- [Aegis] Aegis Setup Protocol Complete ---"
echo "✅✅✅ ENVIRONMENT STABLE. READY FOR SNAPSHOT. ✅✅✅"
