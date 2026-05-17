@echo off
REM ─────────────────────────────────────────────
REM  TDC Gym - Inicia Backend + Frontend
REM  Abre dos ventanas separadas
REM ─────────────────────────────────────────────
start "TDC Gym - Backend" cmd /k "%~dp0start-backend.bat"
timeout /t 3 /nobreak > nul
start "TDC Gym - Frontend" cmd /k "%~dp0start-frontend.bat"
echo.
echo  Ambos servidores iniciandose en ventanas separadas.
echo  Backend:  http://localhost:8000/docs
echo  Frontend: http://localhost:5173/tdc-gym/
echo.
echo  Esta ventana se puede cerrar.
timeout /t 5
