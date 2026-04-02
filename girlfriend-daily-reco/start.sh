#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PYTHON_BIN="python3.12"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "未找到 python3.12，请先安装 Python 3.12。"
  exit 1
fi

PY_VERSION="$($PYTHON_BIN -c 'import sys; print(f\"{sys.version_info.major}.{sys.version_info.minor}\")')"
if [[ "$PY_VERSION" != "3.12" ]]; then
  echo "检测到 Python 版本为 $PY_VERSION，要求 3.12。"
  exit 1
fi

if "$PYTHON_BIN" -m venv .venv >/dev/null 2>&1; then
  source .venv/bin/activate
  pip install --disable-pip-version-check -r requirements.txt
else
  echo "venv 不可用，回退到用户级安装..."
  "$PYTHON_BIN" -m pip install --user --disable-pip-version-check -r requirements.txt
fi

exec "$PYTHON_BIN" -m uvicorn server:app --host 0.0.0.0 --port 8000
