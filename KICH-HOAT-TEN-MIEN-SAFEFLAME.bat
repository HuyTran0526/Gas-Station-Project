@echo off
title Kich Hoat Ten Mien safeflame.vn
chcp 65001 >nul

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ========================================================
    echo   DANG XIN QUYEN QUAN TRI VIEN (ADMINISTRATOR)...
    echo ========================================================
    echo Vui long bam [YES] tren hop thoai Windows de cap quyen...
    powershell -NoProfile -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

set "HOSTS_FILE=%windir%\System32\drivers\etc\hosts"

findstr /i /c:"safeflame.vn" "%HOSTS_FILE%" >nul
if %errorlevel% neq 0 (
    echo. >> "%HOSTS_FILE%"
    echo # Ten mien du an SafeFlame >> "%HOSTS_FILE%"
    echo 127.0.0.1 safeflame.vn >> "%HOSTS_FILE%"
    echo 127.0.0.1 www.safeflame.vn >> "%HOSTS_FILE%"
    echo [OK] Da them safeflame.vn vao file hosts thanh cong!
) else (
    echo [OK] Ten mien safeflame.vn da ton tai san trong file hosts!
)

ipconfig /flushdns >nul
echo [OK] Da lam moi bo nho dem DNS (Flush DNS)!
echo.
echo ========================================================
echo   DA KICH HOAT THANH CONG TEN MIEN: safeflame.vn!
echo ========================================================
echo.
echo Bay gio ban co the mo trinh duyet va vao dia chi:
echo   👉 http://safeflame.vn:5173
echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul
