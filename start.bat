@echo off
chcp 65001 >nul
echo =========================================
echo   启动抽奖系统前后端服务
echo =========================================
echo.

REM 检查conda环境是否存在
conda env list | findstr /C:"nianhui" >nul
if %errorlevel% neq 0 (
    echo ❌ Conda环境 'nianhui' 不存在
    echo 请先运行: conda create -n nianhui python=3.12 -y
    pause
    exit /b 1
)

REM 检查后端依赖是否已安装
echo 📦 检查后端依赖...
cd backend
conda run -n nianhui pip list | findstr /C:"fastapi" >nul
if %errorlevel% neq 0 (
    echo 📥 安装后端依赖...
    conda run -n nianhui pip install -r requirements.txt
)
cd ..

REM 启动后端服务
echo.
echo 🚀 启动后端服务...
start "Lottery Backend" conda run -n nianhui python backend/main.py
echo ✅ 后端服务已启动
echo    API地址: http://localhost:8000
echo    API文档: http://localhost:8000/docs
echo.

REM 等待后端服务启动
timeout /t 3 /nobreak >nul

REM 启动前端服务
echo 🚀 启动前端服务...
where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    start "Lottery Frontend" pnpm dev
    echo ✅ 前端服务已启动 (使用 pnpm)
    echo    前端地址: http://localhost:5173
) else (
    where npm >nul 2>&1
    if %errorlevel% equ 0 (
        start "Lottery Frontend" npm run dev
        echo ✅ 前端服务已启动 (使用 npm)
        echo    前端地址: http://localhost:5173
    ) else (
        echo ❌ 未找到 pnpm 或 npm
        pause
        exit /b 1
    )
)

echo.
echo =========================================
echo   服务启动完成！
echo =========================================
echo.
echo 按任意键关闭此窗口（服务将继续运行）
pause
