╔══════════════════════════════════════════════════╗
║     HƯỚNG DẪN CÀI ĐẶT HỆ THỐNG PARADISE GYM    ║
╚══════════════════════════════════════════════════╝

YÊU CẦU MÁY TÍNH:
  - Windows 10/11 (64-bit) hoặc Ubuntu 20.04+
  - RAM tối thiểu: 4GB (khuyến nghị 8GB)
  - Dung lượng trống: 5GB
  - Kết nối internet (chỉ cần lần đầu cài đặt)

═══════════════════════════════════════════════════
CÀI ĐẶT TRÊN WINDOWS
═══════════════════════════════════════════════════

Bước 1: Cài Docker Desktop
  - Truy cập: https://www.docker.com/products/docker-desktop
  - Tải và cài đặt Docker Desktop
  - Khởi động lại máy tính sau khi cài

Bước 2: Khởi động Docker Desktop
  - Mở Docker Desktop từ Start Menu
  - Chờ đến khi góc dưới hiện "Docker is running"

Bước 3: Cài đặt hệ thống
  - Click đúp vào file "cai-dat.bat"
  - Chờ 5-10 phút
  - Trình duyệt tự động mở http://localhost:8080

═══════════════════════════════════════════════════
QUẢN LÝ HỆ THỐNG (sau khi cài)
═══════════════════════════════════════════════════

  Khởi động lại:  docker-compose up -d
  Tắt hệ thống:   docker-compose down
  Xem nhật ký:    docker-compose logs -f
  Backup data:    Sao chép thư mục dữ liệu Docker Volume của container ra nơi khác

TÀI KHOẢN MẶC ĐỊNH:
  - Admin:  admin / 123456
  - Lễ tân: letan01 / 123456
  - HLV:    pt01 / 123456
  - HV:     hoivien01 / 123456
