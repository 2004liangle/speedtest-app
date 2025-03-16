@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo 局域网测速工具 - Windows 7 兼容版本
echo ===================================================
echo.

:: 设置路径
set "SCRIPT_DIR=%~dp0"
set "NODE_PATH=%SCRIPT_DIR%portable-node\win7-node\node.exe"
set "SERVER_PATH=%SCRIPT_DIR%server\server.js"

:: 检查Node.js是否存在
if not exist "%NODE_PATH%" (
    echo 错误: 未找到Windows 7兼容版本的Node.js
    echo 请确保文件存在于: %NODE_PATH%
    echo.
    pause
    exit /b 1
)

:: 检查服务器文件是否存在
if not exist "%SERVER_PATH%" (
    echo 错误: 未找到服务器文件
    echo 请确保文件存在于: %SERVER_PATH%
    echo.
    pause
    exit /b 1
)

echo 使用Windows 7兼容版本的Node.js (v13.14.0)
echo 正在启动服务器...
echo.

:: 启动服务器
"%NODE_PATH%" "%SERVER_PATH%"

:: 如果服务器异常退出
echo.
echo 服务器已停止运行。
pause
exit /b 0 