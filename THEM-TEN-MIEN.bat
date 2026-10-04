@echo off
title Cai Dat safeflame.vn
powershell -NoProfile -Command "Start-Process powershell -ArgumentList '-NoProfile -Command \"Add-Content C:\Windows\System32\drivers\etc\hosts `\"`n127.0.0.1 safeflame.vn`\"; ipconfig /flushdns\"' -Verb RunAs"
echo Da gui lenh cap nhat. Hay bam YES tren hop thoai Windows neu co!
timeout /t 3 >nul
