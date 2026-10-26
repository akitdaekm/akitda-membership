@echo off
echo =======================================================
echo   Stopping AKITDA WhatsApp Server on port 8085...
echo =======================================================
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8085" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a
)
echo WhatsApp Server stopped.
pause
