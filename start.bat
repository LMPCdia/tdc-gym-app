@echo off
title TDC Gym - Iniciando servidores...
color 0A

echo.
echo  ============================================
echo   TDC GYM ^& FITNESS - Iniciando sistema...
echo  ============================================
echo.

:: Detectar y actualizar IPs en los .env
echo [1/3] Detectando IP de red...
python setup_network.py
if errorlevel 1 (
    echo [ERROR] No se pudo detectar la IP. Usando localhost.
)

echo.

:: Iniciar backend en nueva ventana
echo [2/3] Iniciando backend (FastAPI)...
start "TDC Backend" cmd /k "cd /d "%~dp0backend" && uvicorn main:app --reload --host 0.0.0.0 && pause"

:: Esperar un segundo para que el backend arranque primero
timeout /t 2 /nobreak > nul

:: Iniciar frontend en nueva ventana
echo [3/3] Iniciando frontend (Vite)...
start "TDC Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host && pause"

echo.
echo  ============================================
echo   Servidores iniciados. Revisa las ventanas.
echo  ============================================
echo.
pause
