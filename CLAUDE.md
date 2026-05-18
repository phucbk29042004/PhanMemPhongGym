# CLAUDE.md — Paradise GYM Management System

## Dự án là gì

Hệ thống quản lý phòng GYM fullstack gồm 3 client:
- **Web Admin** (FE/) — SPA Vanilla JS cho Admin & Lễ tân
- **Mobile App** (MobileApp/) — React Native / Expo cho Hội viên & PT
- **Backend** (BE/) — REST API Node.js + SQLite dùng chung

---

## Cấu trúc thư mục

```
UI GYM/
├── BE/                    Backend Node.js (ESM)
│   ├── index.js           Entry point — start server + cron jobs
│   ├── init-db.js         Tạo DB từ đầu (chạy 1 lần)
│   ├── database/          File .db SQLite thực tế
│   ├── src/
│   │   ├── app.js         Express app — mount tất cả routes
│   │   ├── config/
│   │   │   └── db.js      Singleton DB + auto-migration
│   │   ├── controllers/   Xử lý logic từng module
│   │   ├── routes/        Khai báo route, gắn middleware
│   │   ├── middlewares/
│   │   │   ├── auth.js    verifyToken / optionalAuth (JWT)
│   │   │   ├── role.js    requireRole / requirePermission
│   │   │   ├── upload.js  Multer memory storage
│   │   │   └── error-handler.js
│   │   ├── jobs/
│   │   │   ├── cron-pt-confirm.js  22:00 — tự xác nhận buổi PT
│   │   │   └── cron-daily.js       08:00 — thông báo; mỗi 5 phút — PT warn
│   │   └── utils/
│   │       ├── response.js         success() / error() chuẩn hoá
│   │       ├── notifications.js    createNotification() helper
│   │       ├── audit.js            ghi_audit_log()
│   │       └── cloudinary.js       upload / delete ảnh
│
├── FE/                    Web Admin SPA (Vanilla JS)
│   ├── index.html         App shell Admin/Lễ tân (duy nhất)
│   ├── login.html         Trang đăng nhập
│   ├── pt-portal.html     Portal PT
│   ├── member-portal.html Portal Hội viên
│   └── assets/
│       ├── js/
│       │   ├── api.js          Fetch wrapper (window.GymApp.api)
│       │   ├── auth.js         Auth init, login, logout, updateUI
│       │   ├── app.js          Router SPA, sidebar, QR modal, bell
│       │   ├── pt-portal.js    Logic portal PT
│       │   ├── member-portal.js Logic portal Hội viên
│       │   └── pages/          Module từng trang (members-list.js, ...)
│       ├── css/main.css        Custom CSS + dark mode vars
│       └── data/               provinces/districts/wards JSON
│
├── MobileApp/             React Native / Expo
│   ├── App.js             Entry — NavigationContainer
│   ├── src/
│   │   ├── navigation/    RootNavigator, MemberNavigator, PTNavigator
│   │   ├── screens/       Màn hình theo role
│   │   ├── services/api.js Axios client (IP cứng, cần đổi khi test)
│   │   ├── store/         Zustand (useAuthStore, useNotificationStore)
│   │   ├── components/    Component tái sử dụng
│   │   └── utils/
│
├── paradise_gym_v2.sql    Schema gốc SQLite (tham khảo)
├── rule.md                Quy tắc làm việc bắt buộc — ĐỌC TRƯỚC
├── tiendo.md              Nhật ký tiến độ — cập nhật sau mỗi thay đổi
├── kientruchethong.md     Bản đồ hệ thống — cập nhật khi thêm tính năng
└── nghiepvu.md            Tài liệu nghiệp vụ phòng gym
```

---

## Các file quan trọng nhất

| File | Vai trò |
|------|---------|
| `BE/index.js` | Entry point — khởi động server + 2 cron jobs |
| `BE/src/app.js` | Mount tất cả 11 route groups |
| `BE/src/config/db.js` | DB singleton + **auto-migration** khi boot |
| `BE/src/utils/response.js` | `success(res, data, msg, status)` / `error(res, msg, status)` |
| `BE/src/utils/notifications.js` | `createNotification(loai, tieu_de, noi_dung, doi_tuong_id, doi_tuong, danh_cho)` |
| `BE/src/middlewares/auth.js` | `verifyToken` — gắn `req.user` |
| `BE/src/middlewares/role.js` | `requireRole('admin','le_tan')` |
| `FE/assets/js/api.js` | `window.GymApp.api.get/post/put/patch/delete/upload` |
| `FE/assets/js/app.js` | SPA router (`GymApp.navigate`), toast, QR modal, bell polling |
| `FE/assets/js/auth.js` | `GymApp.auth.init/login/logout/updateUI` |
| `paradise_gym_v2.sql` | Toàn bộ schema — đọc để biết tên cột chính xác |

---

## Conventions

### Đặt tên
- **DB fields & API params**: `snake_case` tiếng Việt không dấu
  - VD: `ho_ten`, `ngay_sinh`, `tai_khoan_id`, `da_doc`
- **File BE**: `kebab-case.js` — VD: `pt-schedules.controller.js`
- **File FE pages**: `kebab-case.js` — VD: `members-list.js`
- **Mã hồ sơ**: `{PREFIX}{3 chữ số}` — HV001, PT001, NV001, LT001

### API Response (luôn dùng response.js)
```js
// Thành công
{ success: true, message: "...", data: {...} }

// Lỗi
{ success: false, message: "..." }
```

### Auth flow
- Token JWT 7 ngày, lưu `localStorage` key `'gym-token'` (FE web)
- Header: `Authorization: Bearer <token>`
- `req.user` có: `{ id, ten_dang_nhap, vai_tro, vai_tro_id, quyen }`
- Khoá tài khoản sau 5 lần đăng nhập sai

### DB conventions
- Timestamps: `datetime('now','localtime')` — **không dùng UTC**
- Soft delete: `is_deleted = 0|1` + `ngay_xoa` + `nguoi_xoa_id`
- Boolean: `INTEGER 0|1` với CHECK constraint
- Auto-migration: thêm `ALTER TABLE` hoặc `CREATE TABLE IF NOT EXISTS`
  vào `BE/src/config/db.js` — chạy tự động khi server boot

---

## Enum / Status values thường gặp

### vai_tro (role)
`'admin'` | `'le_tan'` | `'pt'` | `'hoi_vien'`

### tai_khoan.trang_thai
`'hoat_dong'` | `'khoa'` | `'cho_xac_nhan'`

### ho_so.loai_ho_so
`'hoi_vien'` | `'pt'` | `'nhan_vien'` | `'le_tan'`

### dang_ky_goi_tap.trang_thai
`'dang_hoat_dong'` | `'het_han'` | `'huy'` | `'tam_dung'`

### dang_ky_goi_tap.phuong_thuc_tt
`'tien_mat'` | `'chuyen_khoan'` | `'the'` | `'momo'` | `'zalopay'` | `'khac'`

### lich_tap.trang_thai
`'cho_tap'` | `'da_tap'` | `'da_huy'`

### lich_tap.loai_buoi
`'ca_nhan'` | `'nhom'`

### luot_vao_ra.loai / phuong_thuc
- loai: `'vao'` | `'ra'`
- phuong_thuc: `'qr_code'` | `'thu_cong'`

### thong_bao.loai
`'sap_het_han_goi_tap'` | `'het_han_goi_tap'` | `'check_in'`
`'chua_check_in_truoc_buoi_pt'` | `'cron_tu_xac_nhan'`
`'sap_het_buoi_pt'` | `'ho_so_moi'`

### thong_bao.danh_cho
`'admin'` | `'le_tan'` | `'ca_hai'`

---

## API Routes overview

| Prefix | Module |
|--------|--------|
| `/api/auth` | Đăng nhập, /me, đổi mật khẩu |
| `/api/members` | CRUD hồ sơ hội viên + PT + NV |
| `/api/packages` | CRUD gói tập gym |
| `/api/trainers` | CRUD PT, lịch dạy |
| `/api/checkins` | Vào/ra thủ công, thống kê |
| `/api/checkin` | QR: `/my-qr` (HV lấy token), `/scan` (quét) |
| `/api/pt/schedules` | Đặt/xác nhận/hủy buổi tập |
| `/api/pt/registrations` | Đăng ký gói PT |
| `/api/staff` | Quản lý nhân viên |
| `/api/revenue` | Thống kê doanh thu |
| `/api/notifications` | Bell icon: danh sách, badge, summary, mark read |

---

## Cron Jobs

| Job | Lịch | File |
|-----|------|------|
| Xác nhận buổi PT | Theo `cau_hinh.gio_dong_cua` (mặc định 22:00) | `cron-pt-confirm.js` |
| Thông báo hàng ngày | 08:00 sáng | `cron-daily.js` |
| Cảnh báo PT chưa check-in | Mỗi 5 phút | `cron-daily.js` |

---

## Môi trường & Ports

- **BE**: `http://localhost:3000` — `BE/.env` (copy từ `.env.example`)
- **FE web**: mở trực tiếp file HTML hoặc Live Server
- **Mobile**: `MobileApp/src/services/api.js` — đổi IP `192.168.x.x:3000`
  khi test trên thiết bị thật
- Biến bắt buộc: `JWT_SECRET`, `DB_PATH`, Cloudinary credentials

---

## Không cần đọc

- `BE/node_modules/`, `MobileApp/node_modules/`
- `BE/database/paradise_gym.db-shm`, `.db-wal` (WAL temp files)
- `BE/src/config/provinces.json`, `districts.json`, `wards.json`
  (dữ liệu địa danh — 3MB+)
- `FE/assets/data/provinces.json`, `districts.json`, `wards.json`
- `MobileApp/.expo/`, `expo-*.log`
- `scratch/` (file thử nghiệm tạm)
- `package-lock.json`
