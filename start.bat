@echo off
echo Cleaning up old background processes...
taskkill /F /IM node.exe >nul 2>&1

echo Starting Music Motion Backend Server...
start "Music Motion Backend" cmd /k "cd backend && node server.js"

echo Starting Music Motion Vite Frontend...
start "Music Motion Frontend" cmd /k "cd frontend && npm.cmd run dev"

echo Both servers are starting up! Keep the two new black windows open.
pause
