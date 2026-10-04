@echo off
title Cai Dat Ten Mien SafeFlame Cho May Tinh
chcp 65001 >nul

:: Kiem tra quyen Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo =======================================================
    echo   DANG XIN QUYEN ADMINISTRATOR...
    echo =======================================================
    echo Vui long bam [YES] tren hop thoai Windows hien len...
    
    :: Tao script VBS de mo UAC chinh xac 100%
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\elevate_safeflame.vbs"
    echo UAC.ShellExecute "cmd.exe", "/c """"%~f0""""", "", "runas", 1 >> "%temp%\elevate_safeflame.vbs"
    cscript //nologo "%temp%\elevate_safeflame.vbs"
    del /f /q "%temp%\elevate_safeflame.vbs" >nul 2>&1
    exit /b
)

echo =======================================================
echo   DANG CAI DAT TEN MIEN SAFEFLAME VAO FILE HOSTS
echo =======================================================
echo.

set "HOSTS_FILE=%windir%\System32\drivers\etc\hosts"

:: Xoa bo cac dong cu neu co de cap nhat moi nhat
findstr /i /c:"safeflame.local" "%HOSTS_FILE%" >nul
if %errorlevel% neq 0 (
    echo. >> "%HOSTS_FILE%"
    echo # Cau hinh ten mien noi bo cho du an SafeFlame >> "%HOSTS_FILE%"
    echo 127.0.0.1 safeflame.local >> "%HOSTS_FILE%"
    echo 127.0.0.1 safeflame >> "%HOSTS_FILE%"
    echo 127.0.0.1 safeflame.com >> "%HOSTS_FILE%"
    echo 127.0.0.1 safeflame.net >> "%HOSTS_FILE%"
    echo 127.0.0.1 safeflame.vn >> "%HOSTS_FILE%"
    echo [OK] Da them cac ten mien safeflame vao file hosts thanh cong!
) else (
    echo [OK] Ten mien safeflame.local da co san trong file hosts!
)

ipconfig /flushdns >nul
echo [OK] Da lam moi bo nho dem DNS (Flush DNS)!
echo.
echo =======================================================
echo  DA CAI DAT THANH CONG!
echo  Ban co the truy cap vao:
echo    - http://safeflame.local
echo    - http://safeflame
echo =======================================================
echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul
