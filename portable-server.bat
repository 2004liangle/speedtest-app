@echo off
echo ===================================
echo ���������������Я�������ű�
echo ===================================
echo.

:: ���û�������
set "CURRENT_DIR=%~dp0"
set "NODE_DIR=%CURRENT_DIR%portable-node"
set "PATH=%NODE_DIR%;%PATH%"

:: ����Я��Node.js�Ƿ����
if not exist "%NODE_DIR%\node.exe" (
    echo δ��⵽��Я��Node.js����������...
    echo.
    
    :: ����Ŀ¼
    mkdir "%NODE_DIR%" 2>nul
    
    :: ���ر�Я��Node.js
    echo �������ر�Я��Node.js...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v16.20.2/win-x86/node.exe' -OutFile '%NODE_DIR%\node.exe'}"
    
    if not exist "%NODE_DIR%\node.exe" (
        echo ����Node.jsʧ�ܣ�
        echo ���ֶ�����Node.js��Я�沢������ %NODE_DIR% Ŀ¼��
        pause
        exit /b 1
    )
    
    :: ����npm
    echo ��������npm...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v16.20.2/node_modules.zip' -OutFile '%NODE_DIR%\node_modules.zip'}"
    
    if not exist "%NODE_DIR%\node_modules.zip" (
        echo ����npmʧ�ܣ�
        echo ��Node.js�����سɹ�����������������������
        echo.
    ) else (
        :: ��ѹnpm
        echo ���ڽ�ѹnpm...
        powershell -Command "& {Expand-Archive -Path '%NODE_DIR%\node_modules.zip' -DestinationPath '%NODE_DIR%' -Force}"
        echo.
    )
    
    echo ��Я��Node.js������ɣ�
    echo.
)

:: ��ʾNode.js�汾
echo ��ǰNode.js�汾:
"%NODE_DIR%\node.exe" -v
echo.

:: ���������Ŀ¼
cd /d "%CURRENT_DIR%server"
if not exist "%CD%" (
    echo ����: ������Ŀ¼������
    echo ��ǰ·��: %CURRENT_DIR%
    pause
    exit /b 1
)

:: ����Ƿ���Ҫ��װ����
if not exist "node_modules" (
    echo �״����У����ڰ�װ����...
    "%NODE_DIR%\node.exe" "%NODE_DIR%\node_modules\npm\bin\npm-cli.js" install
    if %ERRORLEVEL% neq 0 (
        echo ��װ����ʧ�ܣ�
        echo ������ֱ������������...
        echo.
    ) else (
        echo ������װ��ɣ�
        echo.
    )
)

:: ��ʾ����IP��ַ
echo ����IP��ַ:
ipconfig | findstr /i "IPv4"
echo.
echo ��ʹ������IP��ַ֮һ�Ӷ˿ں�(Ĭ��3000)���ӷ����
echo ����: http://192.168.1.100:3000
echo.

:: ����������
echo �����������ٷ�����...
echo ��Ctrl+C����ֹͣ������
echo.
"%NODE_DIR%\node.exe" server.js

:: ����������쳣�˳�
echo.
echo ��������ֹͣ���С�
pause 