@echo off
REM CallPilot Application Launcher for Windows
REM This script helps you start both backend and frontend servers

echo ============================================================
echo              CallPilot Application Launcher
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Python and Node.js are installed
echo.

REM Run quick check
echo Running configuration check...
python quick_check.py
if errorlevel 1 (
    echo.
    echo [ERROR] Configuration check failed
    echo Please fix the issues above before continuing
    pause
    exit /b 1
)

echo.
echo ============================================================
echo                    Launch Options
echo ============================================================
echo.
echo 1. Start Backend Server (Terminal 1)
echo 2. Start Frontend Server (Terminal 2)
echo 3. Run Configuration Check
echo 4. Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Starting Backend Server...
    echo Backend will run on: http://localhost:8000
    echo API Docs: http://localhost:8000/docs
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python start.py
) else if "%choice%"=="2" (
    echo.
    echo Starting Frontend Server...
    echo Frontend will run on: http://localhost:5173
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    npm run dev
) else if "%choice%"=="3" (
    echo.
    python quick_check.py
    echo.
    pause
) else if "%choice%"=="4" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice!
    pause
    exit /b 1
)
