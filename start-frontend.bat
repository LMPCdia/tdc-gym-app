@echo off
REM ─────────────────────────────────────────────
REM  TDC Gym - Frontend (React + Vite)
REM ─────────────────────────────────────────────
REM Desactiva el modo Quick-Edit (evita que la consola se pause al hacer click)
reg add "HKCU\Console\%%SystemRoot%%_system32_cmd.exe" /v QuickEdit /t REG_DWORD /d 0 /f >nul 2>&1

cd /d "%~dp0frontend"

echo.
echo [1/3] Verificando .env.local...
if not exist ".env.local" (
    echo VITE_API_URL=http://localhost:8000 > .env.local
    echo .env.local creado.
) else (
    echo .env.local ya existe.
)

echo.
echo [2/3] Instalando dependencias de npm...
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo ERROR: Fallo npm install. Verifica que Node.js este instalado.
        pause
        exit /b 1
    )
) else (
    echo node_modules ya existe, saltando install.
)

echo.
echo ============================================
echo  Iniciando frontend en http://localhost:5173/tdc-gym/
echo  (Ctrl+C para detener)
echo ============================================
echo.
call npm run dev
pause
