# 📒 Nhật Ký Tiến Độ Dự Án

## Thông Tin Dự Án
- **Tên dự án**: Paradise GYM — Fullstack Management System
- **Ngày bắt đầu**: 07/05/2026
- **Mô tả**: Hệ thống quản lý phòng GYM hiện đại sử dụng SPA Vanilla JS (Frontend) và Node.js/SQLite (Backend).

---

## 📌 Trạng Thái Hiện Tại
**✅ HOÀN THÀNH**: Đã xây dựng xong bộ khung giao diện Premium SPA (FE) và toàn bộ hệ thống API Backend (BE). Hiện đang trong giai đoạn kết nối FE với BE.

---

## 📋 Danh Sách Thay Đổi

### 08/05/2026 09:25 — Kết nối Frontend với API (Phase 2: Auth & Core Dashboard)
- **Loại**: Tích hợp Fullstack (Integration)
- **Chi tiết các thành phần đã xong**:
    - **Module API Utility**: Tạo `api.js` wrapper cho fetch, tự động đính kèm JWT và xử lý lỗi 401.
    - **Module Authentication**: Tạo `auth.js` quản lý login/logout. Thêm trang **login.html** Premium với hiệu ứng Glassmorphism.
    - **Dashboard Integration**: Kết nối trang Dashboard với dữ liệu thực từ backend (Tổng hội viên, Check-in hôm nay, Doanh thu 30 ngày, Phân bố gói tập).
    - **Members List Integration**: Kết nối trang Danh sách hội viên và Huấn luyện viên, ánh xạ dữ liệu từ DB sang UI.
    - **Security**: Ép buộc đăng nhập tại `app.js` (nếu chưa có token sẽ redirect về login).
- **Kết quả**: ✅ Frontend đã bắt đầu hoạt động với dữ liệu thật, không còn dùng mock data cho các module chính.

### 08/05/2026 09:08 — Hoàn thiện hệ thống Backend REST API (Phase 1)
- **Loại**: Triển khai Backend chuyên sâu
- **Chi tiết các module đã xong**:
    - **Module Auth**: Hệ thống đăng nhập JWT (7 ngày), khóa tài khoản sau 5 lần sai, API `getMe` và đổi mật khẩu.
    - **Module Members**: CRUD hội viên, tự động tính ngày hết hạn khi đăng ký gói, lọc theo trạng thái (Hết hạn, Sắp hết hạn).
    - **Module Packages**: Quản lý gói tập Gym và gói PT với logic Soft Delete.
    - **Module Trainers**: Quản lý hồ sơ PT và xem lịch dạy cá nhân.
    - **Module Checkins**: Ghi nhận lượt vào/ra, thống kê mật độ khách theo khung giờ để vẽ biểu đồ.
    - **Module PT Schedules**: Đặt lịch tập PT, kiểm tra trùng lịch, xác nhận/hủy buổi tập.
    - **Module Revenue**: Tổng hợp doanh thu 30 ngày gần nhất và Dashboard tổng quan.
- **Hạ tầng & Bảo mật**:
    - Thiết lập **SQLite (better-sqlite3)** với WAL mode & PRAGMA optimization.
    - Tích hợp **Cloudinary SDK**: Upload ảnh từ memory buffer, không lưu file tạm.
    - Middleware **RBAC**: Phân quyền dựa trên JSON từ Database.
    - Middleware **Audit Log**: Tự động lưu vết các thay đổi dữ liệu nhạy cảm.
- **Kết quả**: ✅ Backend đã sẵn sàng phục vụ Frontend.

### 07/05/2026 14:10 — Khôi phục UI bị thiếu (Icons, Search Bar, Sidebar Toggle)
- **Loại**: Cải thiện Giao diện (UI) & Chức năng (Frontend)
- **File/Thành phần liên quan**: `public/index.html`, `public/css/styles.css`, `public/js/main.js`
- **Mô tả**: 
    - Khôi phục icon menu con trong Sidebar.
    - Tích hợp thanh tìm kiếm hiện đại lên Header (Top Bar).
    - Thêm nút Toggle Sidebar (Hamburger) và logic thu gọn/mở rộng mượt mà.
- **Kết quả**: ✅ Hoàn thành - UI đầy đủ và tiện dụng hơn.

### 07/05/2026 14:05 — Khôi phục Thiết kế Material 3 (Bo góc tròn) và Fix lỗi UI
- **Loại**: Cải thiện & Sửa lỗi (Reversion)
- **File/Thành phần liên quan**: `public/index.html`, `public/css/styles.css`, `public/js/router.js`
- **Mô tả**: 
    - Quay lại phong cách Material 3 Glassmorphism bo góc tròn.
    - Fix lỗi nút Toggle Sidebar bị "hựng" hoặc mất icon.
    - Đảm bảo Form Thêm mới hội viên đầy đủ >25 trường dữ liệu.

### 07/05/2026 13:45 — Nâng cấp Giao diện Enterprise Edition (Material 3 High-Fidelity)
- **Loại**: Tái thiết kế toàn diện (Full Redesign)
- **Mô tả**: Nâng cấp Form và Table sang chuẩn Enterprise, chia section rõ ràng, tối ưu trải nghiệm người dùng chuyên nghiệp.

### 07/05/2026 13:43 — Tích hợp Dark/Light Mode và Tái thiết kế Table/Form
- **Loại**: Tính năng mới & Nâng cấp UI
- **Mô tả**: Thêm nút chuyển đổi chế độ Sáng/Tối, lưu trạng thái vào localStorage.

### 07/05/2026 13:28 — Bổ sung Danh sách HV và Thêm mới HV (2 Tabs)
- **Loại**: Tính năng mới (Frontend)
- **Mô tả**: Xây dựng giao diện Danh sách hội viên và Form thêm mới với 2 Tab: "Hồ sơ hội viên" & "Đăng ký gói tập".

### 07/05/2026 13:22 — Đại tu cấu trúc SPA và Thêm 6 màn hình chức năng
- **Loại**: Cấu trúc lại & Mở rộng
- **Mô tả**: Tách file `data.js`, `styles.css`. Thêm các view: Dashboard, Vào-ra, Hết hạn, Lịch PT, Gói tập, Sinh nhật.

### 07/05/2026 13:17 — Chuyển đổi sang Design System Material 3 (M3)
- **Loại**: Nâng cấp Design System
- **Mô tả**: Chuyển từ Font Awesome sang Material Symbols Outlined, áp dụng bảng màu M3.

### 07/05/2026 13:14 — Khởi tạo cấu trúc SPA và Giao diện Premium
- **Loại**: Khởi tạo
- **Mô tả**: Xây dựng khung Sidebar (Flexbox) + Content Area. Implement Router.js cho SPA.
