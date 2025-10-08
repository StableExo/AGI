#!/bin/bash
#
# Pre-flight check to ensure the execution environment has all necessary tools.
set -e # Exit immediately if a command fails

REQUIREMENTS_FILE="tools/requirements.txt"

echo "[PRE-FLIGHT] Starting environment verification..."

if [ -f "$REQUIREMENTS_FILE" ]; then
  echo "[PRE-FLIGHT] Found requirements.txt. Installing Python dependencies..."
  pip install -r "$REQUIREMENTS_FILE"
  echo "[PRE-FLIGHT] Python dependencies are up to date."
else
  echo "[PRE-FLIGHT] No requirements.txt found. Skipping Python dependency installation."
fi

echo "[PRE-FLIGHT] Environment check complete. System ready."