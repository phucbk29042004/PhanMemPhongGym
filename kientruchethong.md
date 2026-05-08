# 🏛️ Kiến Trúc Hệ Thống

> Cập nhật lần cuối: 07/05/2026 — Làm lại giao diện sinh nhật theo 12 tháng

---

## 1. Tổng Quan Dự Án

- **Tên**: Paradise GYM - Admin Dashboard
- **Mục tiêu**: Quản trị phòng gym (hội viên, gói tập, PT, doanh thu, chấm công)
- **Stack chính**: HTML5 + Tailwind CSS (CDN) + Vanilla JS ES6 + Chart.js (CDN)
- **Môi trường**: Browser, không cần server (mở trực tiếp file HTML)

---

## 2. Sơ Đồ Kiến Trúc Tổng Thể

```
Browser
  └── FE/index.html (SPA Entry Point)
        ├── Sidebar (static, accordion menu)
        ├── Header (static, title + user info)
        └── #content-area (dynamic render)
              ↑
        window.GymApp.navigate(page)
              ↑
        assets/js/app.js (Router)
              ↑
        assets/js/pages/*.js (Page Renderers)
              ↑
        assets/js/data/mock-data.js (Mock Data)
```

---

## 3. Các Thành Phần Hệ Thống

### Frontend (FE/)
- **Vị trí**: `FE/`
- **Vai trò**: Toàn bộ giao diện người dùng, dùng mock data
- **Công nghệ**: HTML5, Tailwind CSS CDN, Vanilla JS, Chart.js
- **Giao tiếp với**: Mock data (sau sẽ thay bằng BE API)

### Backend (BE/) — Chưa phát triển
- **Vị trí**: `BE/`
- **Vai trò**: API server cho dữ liệu thực
- **Công nghệ**: Node.js (dự kiến)

---

## 4. Cấu Trúc Thư Mục

```
FE/
├── index.html                    ← Entry point SPA
├── assets/
│   ├── css/main.css              ← Custom styles bổ sung Tailwind
│   └── js/
│       ├── app.js                ← Router + navigation logic
│       ├── data/
│       │   └── mock-data.js      ← Toàn bộ mock data
│       └── pages/
│           ├── dashboard.js      ← Trang tổng quan
│           ├── members-list.js   ← Danh sách hội viên
│           ├── member-add.js     ← Thêm mới hội viên
│           ├── checkin.js        ← Vào - Ra
│           ├── expired.js        ← Danh sách hết hạn
│           ├── pt-training.js    ← Lịch đào tạo PT
│           ├── pt-register.js    ← Đăng ký lịch tập PT
│           ├── packages.js       ← Danh sách gói tập
│           └── birthday.js       ← Sinh nhật hội viên
```

---

## 5. Sidebar Menu

```
📊 Tổng quan
👥 Quản lý hội viên ▼
   ├── Danh sách hội viên
   ├── Thêm mới hội viên
   ├── Vào - Ra
   ├── Danh sách hết hạn
   ├── Lịch đào tạo PT
   ├── Đăng ký lịch tập PT
   ├── Danh sách gói tập
   └── Sinh nhật
```

---

## 6. Danh Sách Chức Năng

### ✅ Đã hoàn thành
- [x] Cấu trúc thư mục + layout SPA
- [x] Sidebar accordion + router chuyển trang
- [x] Trang Dashboard (tổng quan)
- [x] Danh sách hội viên (bảng + tìm kiếm + phân trang)
- [x] Danh sách hội viên nâng cao (tab PT/HLV, lọc/sắp xếp PT, modal chi tiết hội viên 3 tab, thêm gói tập runtime, đăng ký lịch PT runtime)
- [x] Thêm mới hội viên (form 2 tab + upload ảnh)
- [x] Vào - Ra (cards check-in + biểu đồ giờ)
- [x] Danh sách hết hạn
- [x] Lịch đào tạo PT (header + cards)
- [x] Đăng ký lịch tập PT (2 card)
- [x] Danh sách gói tập
- [x] Sinh nhật hội viên
- [x] Sinh nhật hội viên theo 12 tháng (gộp hội viên cùng tháng, hiệu ứng bong bóng/pháo hoa khi click)

### 📋 Kế hoạch
- [ ] Kết nối Backend API thực
- [ ] Tính năng xác thực đăng nhập
- [ ] App mobile Paradise HR
- [ ] Hỗ trợ đa chi nhánh thực tế

---

## 7. Ghi Chú Kỹ Thuật

- **07/05/2026**: Dùng `window.GymApp` làm global namespace, không dùng ES module (tránh CORS khi mở file://)
- **07/05/2026**: Chart.js dùng CDN, render sau khi DOM update bằng `setTimeout`
- **07/05/2026**: Avatar upload dùng FileReader API, preview ảnh ngay sau khi chọn
