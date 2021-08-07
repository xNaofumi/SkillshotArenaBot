@echo off
cls

:start
node .
timeout 5 >nul
goto start