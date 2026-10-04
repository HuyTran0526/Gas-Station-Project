@echo off
title Khoi Chay He Thong SafeFlame
chcp 65001 >nul
echo ====================================================
echo    HE THONG CANH BAO KHI GAS - SAFEFLAME
echo ====================================================
echo.

set "BASE_DIR=%~dp0"
if exist "%BASE_DIR%gas-warning-backend" (
    set "BACKEND_DIR=%BASE_DIR%gas-warning-backend"
    set "FRONTEND_DIR=%BASE_DIR%gas-warning-dashboard"
) else (
    set "BACKEND_DIR=%BASE_DIR%Gas-Station-Project-main\gas-warning-backend"
    set "FRONTEND_DIR=%BASE_DIR%Gas-Station-Project-main\gas-warning-dashboard"
)

echo [1/2] Dang khoi chay Backend (Port 5000)...
start "SafeFlame Backend (Node.js)" cmd /k "cd /d ""%BACKEND_DIR%"" && npm start"

echo [2/2] Dang khoi chay Frontend Dashboard (Vite)...
start "SafeFlame Frontend (React)" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm run dev"

echo.
echo ====================================================
echo   Khoi chay thanh cong!
echo   - Dashboard (Ten du an): http://safeflame.vn:5173
echo   - Dashboard (Local):     http://localhost:5173
echo   - Backend API:           http://safeflame.vn:5000
echo.
echo   * De gia lap cam bien gas, mo Terminal va chay:
echo     cd gas-warning-backend ^&^& node simulate.js
echo ====================================================
echo.
pause
