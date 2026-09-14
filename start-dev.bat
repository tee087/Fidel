@echo off
setlocal
cd /d "%~dp0"
powershell -Command "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force"
call npm run dev
endlocal