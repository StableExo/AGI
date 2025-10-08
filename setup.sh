#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Environment Variable Check ---
echo "Checking for required environment variables..."
if [ -z "$AGI_BUILDER_PAT" ]; then
  echo "FATAL ERROR: The AGI_BUILDER_PAT environment variable is not set." >&2
  echo "This variable is critical for the environment. Please set it and run the script again." >&2
  exit 1
fi
echo "Environment variables check passed."
echo

# --- Dependency Installation ---
echo "Searching for and installing Python dependencies from requirements.txt files..."
find . -name "requirements.txt" -print0 | while IFS= read -r -d $'\0' file; do
  if [ -f "$file" ]; then
    echo "Installing dependencies from $file..."
    pip install -r "$file"
    echo "Finished installing dependencies from $file."
    echo
  fi
done
echo "All Python dependencies installed."
echo

# --- Node.js Dependency Installation ---
echo "Installing Node.js dependencies for gemini-citadel..."
if [ -d "gemini-citadel" ] && [ -f "gemini-citadel/package.json" ]; then
  echo "Found gemini-citadel project. Running yarn install..."
  (cd gemini-citadel && yarn install)
  echo "Finished installing gemini-citadel dependencies."
else
  echo "Warning: 'gemini-citadel/package.json' not found. Skipping Node.js dependency installation."
fi
echo

# --- Tool Permissions ---
echo "Setting execute permissions for scripts in the tools/ directory..."
if [ -d "tools" ]; then
  for tool_script in tools/*; do
    if [ -f "$tool_script" ]; then
      echo "Making $tool_script executable..."
      chmod +x "$tool_script"
    fi
  done
  echo "Tool permissions set."
else
  echo "Warning: 'tools/' directory not found. Skipping permission setup."
fi
echo

echo "Setup complete. The development environment is ready."