@echo off
setlocal
title Dependency Installer - Logistic Monitoring System

echo ==========================================
echo   Installing Dependencies
echo   Logistic Monitoring System
echo ==========================================
echo.

:: Install Server Dependencies
echo [1/2] Navigating to SERVER and installing...
cd server
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Could not find 'server' directory.
    goto error
)
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install failed in 'server' directory.
    goto error
)
cd ..

echo.
echo ------------------------------------------
echo.

:: Install Client Dependencies
echo [2/2] Navigating to CLIENT and installing...
cd client
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Could not find 'client' directory.
    goto error
)
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install failed in 'client' directory.
    goto error
)
cd ..

echo.
echo ==========================================
echo   SUCCESS: All dependencies installed!
echo ==========================================
pause
exit /b 0

:error
echo.
echo ==========================================
echo   FAILURE: Installation failed.
echo ==========================================
cd %~dp0
pause
exit /b 1
