@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0maven.ps1" %*
exit /b %ERRORLEVEL%

