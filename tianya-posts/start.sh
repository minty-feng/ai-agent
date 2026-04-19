#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "=== 天涯神贴 — 启动服务 ==="

# Backend
echo "▶ 启动后端 (port 8000)..."
cd backend
pip install -q -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend
echo "▶ 启动前端 (port 3006)..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 服务已启动："
echo "   前端: http://localhost:3006"
echo "   后端 API: http://localhost:8000/api/posts"
echo "   后台管理: http://localhost:8000/admin"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
