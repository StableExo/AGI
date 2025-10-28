#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Verifying Dependency Integrity (yarn install --check-files) ---"
yarn install --check-files
integrity_check=$?

echo -e "\n--- Auditing Dependencies for Vulnerabilities (yarn audit) ---"
yarn audit
audit_check=$?

if [ $integrity_check -eq 0 ] && [ $audit_check -eq 0 ]; then
  echo -e "\n✅ Dependencies are stable and secure. Green light."
  exit 0
else
  echo -e "\n❌ Dependency conflict or vulnerability detected. Red light."
  exit 1
fi
