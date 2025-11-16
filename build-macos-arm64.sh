#!/usr/bin/env bash
set -euo pipefail

# Build script for macOS arm64 for "Heynote + Notemate"
# - Installs deps (using npm ci if package-lock.json exists)
# - Prebuilds renderer and electron bundles
# - Packages with electron-builder for macOS arm64
# Output artifacts will be placed under release/<version>/

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Ensure we run with a predictable PATH (optional: tweak to your environment)
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Avoid auto code signing to keep local builds simple
export CSC_IDENTITY_AUTO_DISCOVERY=${CSC_IDENTITY_AUTO_DISCOVERY:-false}

echo "[1/4] Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Error: node is not installed."; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "Error: npm is not installed.";  exit 1; }

if [[ ! -f "electron-builder.json5" ]]; then
  echo "Error: electron-builder.json5 not found in $ROOT_DIR"
  exit 1
fi

echo "[2/4] Installing dependencies..."
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "[3/4] Prebuilding renderer and electron bundles..."
npm run prebuild

echo "[4/4] Packaging macOS arm64 app (Heynote + Notemate)..."
# --mac uses targets from electron-builder.json5; it is already limited to arm64
npx electron-builder -c electron-builder.json5 --mac

VERSION=$(node -p "require('./package.json').version")
OUT_DIR="release/${VERSION}"

echo
echo "Build completed. Artifacts:"
ls -lh "${OUT_DIR}" || true

echo
echo "Hint: If macOS Gatekeeper blocks the app on first run, right-click the app and choose 'Open'."
