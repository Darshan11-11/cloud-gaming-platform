@echo off
setlocal enableextensions
title NimbuPlay Localhost Server
cls

echo ========================================================
echo   NimbuPlay Cloud Gaming Platform - Local Web Server
echo ========================================================
echo.

set PORT=8000
set URL=http://localhost:%PORT%

echo Application URL: %URL%
echo.

:: 1. Check Python (verify actual executable, not App Execution Alias)
python --version >nul 2>&1
if %errorlevel% equ 0 goto use_python

:: 2. Check py launcher
py --version >nul 2>&1
if %errorlevel% equ 0 goto use_py

:: 3. Check Node / npx
call npx --version >nul 2>&1
if %errorlevel% equ 0 goto use_npx

:: 4. Fallback to Windows PowerShell built-in server
goto use_powershell

:use_python
echo [INFO] Launching server using Python...
echo [INFO] Opening %URL% in your default browser...
start "" "%URL%"
echo [INFO] Server active. Press Ctrl+C to stop.
echo.
python -m http.server %PORT%
goto end

:use_py
echo [INFO] Launching server using Python (py launcher)...
echo [INFO] Opening %URL% in your default browser...
start "" "%URL%"
echo [INFO] Server active. Press Ctrl+C to stop.
echo.
py -m http.server %PORT%
goto end

:use_npx
echo [INFO] Launching server using Node.js / npx...
echo [INFO] Opening %URL% in your default browser...
start "" "%URL%"
echo [INFO] Server active. Press Ctrl+C to stop.
echo.
npx -y serve . -p %PORT%
goto end

:use_powershell
echo [INFO] Launching server using Windows PowerShell...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port %PORT%

:end
