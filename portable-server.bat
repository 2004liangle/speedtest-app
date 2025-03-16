@echo off
echo ===================================
echo 局域网测速软件便携版启动脚本
echo ===================================
echo.

:: 设置环境变量
set "CURRENT_DIR=%~dp0"
set "NODE_DIR=%CURRENT_DIR%portable-node"
set "PATH=%NODE_DIR%;%PATH%"

:: 检查便携版Node.js是否存在
if not exist "%NODE_DIR%\node.exe" (
    echo 未检测到便携版Node.js，正在下载...
    echo.
    
    :: 创建目录
    mkdir "%NODE_DIR%" 2>nul
    
    :: 下载便携版Node.js
    echo 正在下载便携版Node.js...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v16.20.2/win-x86/node.exe' -OutFile '%NODE_DIR%\node.exe'}"
    
    if not exist "%NODE_DIR%\node.exe" (
        echo 下载Node.js失败！
        echo 请手动下载Node.js便携版并放置在 %NODE_DIR% 目录下
        pause
        exit /b 1
    )
    
    :: 下载npm
    echo 正在下载npm...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v16.20.2/node_modules.zip' -OutFile '%NODE_DIR%\node_modules.zip'}"
    
    if not exist "%NODE_DIR%\node_modules.zip" (
        echo 下载npm失败！
        echo 但Node.js已下载成功，将继续尝试启动服务器
        echo.
    ) else (
        :: 解压npm
        echo 正在解压npm...
        powershell -Command "& {Expand-Archive -Path '%NODE_DIR%\node_modules.zip' -DestinationPath '%NODE_DIR%' -Force}"
        echo.
    )
    
    echo 便携版Node.js设置完成！
    echo.
)

:: 显示Node.js版本
echo 当前Node.js版本:
"%NODE_DIR%\node.exe" -v
echo.

:: 进入服务器目录
cd /d "%CURRENT_DIR%server"
if not exist "%CD%" (
    echo 错误: 服务器目录不存在
    echo 当前路径: %CURRENT_DIR%
    pause
    exit /b 1
)

:: 检查是否需要安装依赖
if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    "%NODE_DIR%\node.exe" "%NODE_DIR%\node_modules\npm\bin\npm-cli.js" install
    if %ERRORLEVEL% neq 0 (
        echo 安装依赖失败！
        echo 将尝试直接启动服务器...
        echo.
    ) else (
        echo 依赖安装完成！
        echo.
    )
)

:: 显示本机IP地址
echo 本机IP地址:
ipconfig | findstr /i "IPv4"
echo.
echo 请使用上述IP地址之一加端口号(默认3000)连接服务端
echo 例如: http://192.168.1.100:3000
echo.

:: 启动服务器
echo 正在启动测速服务器...
echo 按Ctrl+C可以停止服务器
echo.
"%NODE_DIR%\node.exe" server.js

:: 如果服务器异常退出
echo.
echo 服务器已停止运行。
pause 