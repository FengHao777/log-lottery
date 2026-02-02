#!/bin/bash

# 启动前后端服务的脚本

echo "========================================="
echo "  启动抽奖系统前后端服务"
echo "========================================="
echo ""

# 检查conda环境是否存在
if ! conda env list | grep -q "nianhui"; then
    echo "❌ Conda环境 'nianhui' 不存在"
    echo "请先运行: conda create -n nianhui python=3.12 -y"
    exit 1
fi

# 检查后端依赖是否已安装
echo "📦 检查后端依赖..."
cd backend
if ! conda run -n nianhui pip list | grep -q "fastapi"; then
    echo "📥 安装后端依赖..."
    conda run -n nianhui pip install -r requirements.txt
fi
cd ..

# 启动后端服务
echo ""
echo "🚀 启动后端服务..."
conda run -n nianhui python backend/main.py &
BACKEND_PID=$!
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo "   API地址: http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo ""

# 等待后端服务启动
sleep 3

# 启动前端服务
echo "🚀 启动前端服务..."
if command -v pnpm &> /dev/null; then
    pnpm dev &
    FRONTEND_PID=$!
    echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
    echo "   前端地址: http://localhost:5173"
elif command -v npm &> /dev/null; then
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
    echo "   前端地址: http://localhost:5173"
else
    echo "❌ 未找到 pnpm 或 npm"
    kill $BACKEND_PID
    exit 1
fi

echo ""
echo "========================================="
echo "  服务启动完成！"
echo "========================================="
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" INT TERM

wait
