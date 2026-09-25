@echo off
title Onebite Bakery Platform - Local Development Launcher
echo ===================================================
echo     Starting Onebite Bakery Platform Locally
echo ===================================================
echo.
echo 1. Launching Backend on http://localhost:5000...
start "Onebite Backend (Port 5000)" cmd /k "cd backend && npm run dev"

echo 2. Launching Frontend on http://localhost:5173...
start "Onebite Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Both Backend and Frontend are launching in separate windows!
echo - Local Frontend: http://localhost:5173
echo - Local Backend API: http://localhost:5000/api/v1
echo - Live Production Backend: https://onebite-bakery-platform.onrender.com
echo ===================================================
timeout /t 5 >nul
start http://localhost:5173
