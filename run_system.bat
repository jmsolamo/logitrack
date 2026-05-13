@echo off
echo ==========================================
echo   Starting Logistic Monitoring System
echo ==========================================
echo.
echo Cleaning up ports 3000 and 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
echo Done cleaning.
echo.

:: Start Server in a new window
echo Starting Server...
start "LogiTrack Server" cmd /k "cd server && npm run dev -- --host"

:: Wait for server to start
echo Waiting for server to initialize...
timeout /t 5 /nobreak >nul

:: Start Client in a new window
echo Starting Client...
start "LogiTrack Client" cmd /k "cd client && npm run dev -- --host"

echo.
echo Both systems are starting in separate windows.
echo You can close this window now.
echo ==========================================
pause
