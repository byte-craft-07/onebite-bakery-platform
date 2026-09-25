Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    Starting Onebite Bakery Platform Locally" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "1. Launching Backend on http://localhost:5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\backend'; Write-Host '--- ONEBITE BACKEND (Port 5000) ---' -ForegroundColor Green; npm run dev"

Write-Host "2. Launching Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\frontend'; Write-Host '--- ONEBITE FRONTEND (Port 5173) ---' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Both Backend and Frontend are launching in separate windows!" -ForegroundColor Green
Write-Host "  * Local Frontend:       http://localhost:5173" -ForegroundColor White
Write-Host "  * Local Backend:        http://localhost:5000/api/v1" -ForegroundColor White
Write-Host "  * Live Production URL:  https://onebite-bakery-platform.vercel.app" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
