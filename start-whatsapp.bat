@echo off
title AKITDA WhatsApp Server
cd /d "%~dp0"
echo =======================================================
echo   Starting AKITDA WhatsApp Server...
echo   (Keep this window open or minimized in the taskbar)
echo =======================================================
node scripts/wa-server.mjs
pause
