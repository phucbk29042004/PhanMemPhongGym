@echo off
chcp 65001 > nul
title Cài đặt Hệ thống Quản lý GYM

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║    HỆ THỐNG QUẢN LÝ PARADISE GYM        ║
echo  ║    Phiên bản 1.0                         ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ── Kiểm tra Docker ──────────────────────────
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Docker Desktop chưa được cài đặt!
    echo.
    echo  Vui lòng thực hiện theo các bước sau:
    echo  1. Nhấn OK để mở trang tải Docker Desktop
    echo  2. Tải và cài đặt Docker Desktop
    echo  3. Khởi động lại máy tính
    echo  4. Mở Docker Desktop, chờ hiện "Docker is running"
    echo  5. Chạy lại file cai-dat.bat này
    echo.
    pause
    start https://www.docker.com/products/docker-desktop/
    exit
)

echo  [✓] Docker đã được cài đặt
echo.

:: ── Kiểm tra Docker đang chạy ────────────────
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Docker Desktop chưa khởi động!
    echo.
    echo  Vui lòng:
    echo  1. Mở Docker Desktop từ Start Menu
    echo  2. Chờ đến khi hiện "Docker is running"
    echo  3. Chạy lại file này
    echo.
    pause
    exit
)

echo  [✓] Docker Desktop đang chạy
echo.
echo  [→] Đang cài đặt hệ thống...
echo      Lần đầu có thể mất 5-10 phút
echo      Vui lòng không tắt cửa sổ này
echo.

:: ── Build và khởi động ───────────────────────
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo  [✗] Có lỗi xảy ra khi cài đặt!
    echo  Xem chi tiết lỗi:
    docker-compose logs
    echo.
    pause
    exit
)

:: ── Chờ backend khởi động ────────────────────
echo.
echo  [→] Đang chờ hệ thống khởi động...
timeout /t 5 /nobreak > nul

:: ── Hoàn tất ─────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║          CÀI ĐẶT THÀNH CÔNG!            ║
echo  ╠══════════════════════════════════════════╣
echo  ║                                          ║
echo  ║  Truy cập hệ thống tại:                  ║
echo  ║  → http://localhost:8080                 ║
echo  ║                                          ║
echo  ║  Tài khoản mặc định:                     ║
echo  ║  → Admin:  admin / 123123                ║
echo  ║                                          ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Tự động mở trình duyệt
start http://localhost:8080

pause
