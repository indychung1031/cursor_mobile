@echo off
chcp 65001 >nul
title cursor_mobile Bridge
cd /d "%~dp0..\packages\bridge"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo  [cursor_mobile] Node.js가 설치되어 있지 않습니다.
  echo  https://nodejs.org 에서 Node 22 LTS 이상을 설치한 뒤 다시 실행하세요.
  echo.
  pause
  exit /b 1
)

echo.
echo  cursor_mobile Bridge 시작 중...
echo  - B모드(영상): http://localhost:3921/
echo  - C모드(채팅): http://localhost:3921/chat  ^(BRIDGE_CHAT=1^)
echo  - PC 설정 페이지가 브라우저에서 자동으로 열립니다
echo  - iPhone은 설정 화면의 QR 코드를 스캔하세요
echo  - 이 창을 닫으면 Bridge가 종료됩니다
echo.

set BRIDGE_PORT=3921
set BRIDGE_CHAT=1
npm start

echo.
echo  Bridge가 종료되었습니다.
pause
