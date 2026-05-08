# 🏋️ Backend — Paradise GYM API

> **Trạng thái**: ✅ Đã hoàn thành — Node.js + Express + SQLite + Cloudinary

## Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: SQLite (`better-sqlite3`)
- **Auth**: JWT + bcrypt
- **Upload ảnh**: Multer + Cloudinary
- **Logging**: Morgan + Audit Log

## Cài Đặt & Chạy

```bash
# 1. Cài dependencies
npm install

# 2. Cấu hình môi trường
cp .env.example .env
# Điền CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, JWT_SECRET

# 3. Khởi tạo database
npm run init-db

# 4. Chạy server (dev)
npm run dev

# Server chạy tại: http://localhost:3000
```

## Tài Khoản Mặc Định (sau khi init-db)

| Tên đăng nhập | Mật khẩu | Vai trò |
|---|---|---|
| `admin` | `123456` | Quản trị viên |
| `letan01` | `123456` | Lễ tân |
| `pt01` | `123456` | PT - Lê Văn Tuấn |
| `hoivien01` | `123456` | Hội viên |
    
## API Endpoints Chính

| Method | Endpoint | Chức năng | Quyền |
|--------|----------|-----------|-------|
| POST | `/api/auth/login` | Đăng nhập | Public |
| GET | `/api/health` | Health check | Public |
| GET | `/api/members` | Danh sách hội viên | Admin, Lễ tân |
| POST | `/api/members` | Thêm hội viên (kèm ảnh) | Admin, Lễ tân |
| PUT | `/api/members/:id/avatar` | Upload ảnh Cloudinary | Admin, Lễ tân |
| POST | `/api/members/:id/package` | Đăng ký gói tập | Admin, Lễ tân |
| GET | `/api/packages` | Danh sách gói tập | All |
| GET | `/api/trainers` | Danh sách PT | Admin, Lễ tân |
| GET | `/api/checkins` | Lịch sử vào/ra | Admin, Lễ tân |
| GET | `/api/checkins/stats` | Thống kê theo giờ | Admin, Lễ tân |
| GET | `/api/pt/schedules` | Lịch tập PT | All (phân quyền) |
| PUT | `/api/pt/schedules/:id/confirm` | Xác nhận buổi tập | Admin, Lễ tân |
| GET | `/api/revenue` | Doanh thu 30 ngày | Admin |
| GET | `/api/revenue/dashboard` | Dashboard tổng quan | Admin |

> Xem đầy đủ 35 endpoints tại `kientruchethong.md`

## Cấu Trúc Thư Mục

```
BE/
├── src/
│   ├── config/db.js          ← Kết nối SQLite
│   ├── controllers/          ← Xử lý logic
│   ├── middlewares/          ← Auth, RBAC, Upload
│   ├── routes/               ← Định nghĩa endpoints
│   ├── utils/                ← Cloudinary, Response, Audit
│   └── app.js                ← Cấu hình Express
├── database/paradise_gym.db  ← File database SQLite
├── init-db.js                ← Script khởi tạo DB
├── index.js                  ← Entry point
├── .env                      ← Biến môi trường (không commit)
└── .env.example              ← Template biến môi trường
```

## Upload Ảnh (Cloudinary Flow)

```
FE gửi form-data (field: avatar)
    ↓
Multer nhận buffer vào RAM
    ↓
BE upload lên Cloudinary (resize 400x400, auto-optimize)
    ↓
Cloudinary trả về URL
    ↓
BE lưu URL vào cột avatar_url trong SQLite
```
