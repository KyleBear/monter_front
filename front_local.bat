@echo off
title Monter Frontend Server
color 0A

cd /d "%~dp0"

echo =================================
echo Monter Frontend Server
echo =================================

REM Node.js 설치 확인
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Node.js 버전 확인
echo Checking Node.js...
node --version
echo.

REM 의존성 확인 및 설치
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
)

REM 포트 설정
set PORT=3000

REM 서버 시작
echo =================================
echo Starting server on port %PORT%...
echo =================================
echo.
echo Access URLs:
echo   - http://localhost:%PORT%
echo   - http://115.68.195.145:%PORT%
echo.
echo Press Ctrl+C to stop the server
echo =================================
echo.

node server.js

pause

