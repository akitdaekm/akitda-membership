@echo off
echo =======================================================
echo   Checking AKITDA WhatsApp Server Status...
echo =======================================================
curl -s http://localhost:8085/health
echo.
pause
