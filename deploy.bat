@echo off
set "PATH=C:\Program Files\Git\cmd;%PATH%"
echo ========================================
echo STP 项目部署到 GitHub
echo ========================================
echo.
echo 步骤1: 检查 Git 安装
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git 未安装。请从 https://git-scm.com/download/win 下载并安装 Git。
    echo 安装后重新运行此脚本。
    pause
    exit /b 1
)

echo Git 已安装。
echo.

echo 步骤2: 初始化 Git 仓库
if not exist ".git" (
    git init
    git remote add origin https://github.com/henryso6688-svg/stp.git
) else (
    echo Git 仓库已存在。
)

echo.

echo 步骤3: 添加文件并提交
git add .
git commit -m "初始化 STP 项目：三省六部制软件架构框架"

echo.

echo 步骤4: 推送到 GitHub
echo 注意：如果这是第一次推送，可能需要输入 GitHub 凭据。
git branch -M main
git push -u origin main

echo.
echo ========================================
echo 部署完成！
echo ========================================
pause