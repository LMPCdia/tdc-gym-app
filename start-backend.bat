@echo off
REM ─────────────────────────────────────────────
REM  TDC Gym - Backend (FastAPI + Uvicorn)
REM ─────────────────────────────────────────────
REM Desactiva el modo Quick-Edit (evita que la consola se pause al hacer click)
reg add "HKCU\Console\%%SystemRoot%%_system32_cmd.exe" /v QuickEdit /t REG_DWORD /d 0 /f >nul 2>&1

cd /d "%~dp0backend"

echo.
echo [1/4] Creando entorno virtual (si no existe)...
if not exist "venv" (
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: No se pudo crear el venv. Verifica que Python este instalado.
        pause
        exit /b 1
    )
)

echo.
echo [2/4] Activando venv...
call venv\Scripts\activate.bat

echo.
echo [3/4] Instalando dependencias (puede tardar 2-5 min la primera vez)...
echo       Si parece "colgado", NO hagas click en esta ventana (pausa el proceso).
echo.
python -m pip install --upgrade pip --disable-pip-version-check
pip install --disable-pip-version-check --prefer-binary -r requirements.txt
if errorlevel 1 (
    echo.
    echo ERROR: Fallo la instalacion de dependencias.
    pause
    exit /b 1
)

echo.
echo [4/4] Sembrando base de datos (idempotente)...
python seed.py

echo.
echo ============================================
echo  Iniciando API en http://localhost:8000
echo  Docs Swagger: http://localhost:8000/docs
echo  (Ctrl+C para detener)
echo ============================================
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
