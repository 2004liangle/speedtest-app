@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo ���������ٹ��� - Windows 7 ���ݰ汾
echo ===================================================
echo.

:: ����·��
set "SCRIPT_DIR=%~dp0"
set "NODE_PATH=%SCRIPT_DIR%portable-node\win7-node\node.exe"
set "SERVER_PATH=%SCRIPT_DIR%server\server.js"

:: ���Node.js�Ƿ����
if not exist "%NODE_PATH%" (
    echo ����: δ�ҵ�Windows 7���ݰ汾��Node.js
    echo ��ȷ���ļ�������: %NODE_PATH%
    echo.
    pause
    exit /b 1
)

:: ���������ļ��Ƿ����
if not exist "%SERVER_PATH%" (
    echo ����: δ�ҵ��������ļ�
    echo ��ȷ���ļ�������: %SERVER_PATH%
    echo.
    pause
    exit /b 1
)

echo ʹ��Windows 7���ݰ汾��Node.js (v13.14.0)
echo ��������������...
echo.

:: ����������
"%NODE_PATH%" "%SERVER_PATH%"

:: ����������쳣�˳�
echo.
echo ��������ֹͣ���С�
pause
exit /b 0 