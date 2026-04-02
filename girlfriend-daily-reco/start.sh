#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if python3 -m venv .venv >/dev/null 2>&1; then
  source .venv/bin/activate
  pip install --disable-pip-version-check -r requirements.txt
else
  echo "venv 不可用，回退到用户级安装..."
  python3 -m pip install --user --disable-pip-version-check -r requirements.txt
fi

exec python3 -m uvicorn server:app --host 0.0.0.0 --port 8000
