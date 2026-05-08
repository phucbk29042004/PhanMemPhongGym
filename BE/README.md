# Backend — Paradise GYM

> **Trạng thái**: Chưa phát triển. Placeholder cho backend Node.js trong tương lai.

## Kế Hoạch

- **Tech stack**: Node.js + Express (dự kiến)
- **Database**: PostgreSQL hoặc MongoDB
- **Auth**: JWT

## API Endpoints Dự Kiến

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | /api/auth/login | Đăng nhập |
| GET | /api/members | Danh sách hội viên |
| POST | /api/members | Thêm hội viên |
| PUT | /api/members/:id | Cập nhật hội viên |
| DELETE | /api/members/:id | Xóa hội viên |
| GET | /api/packages | Danh sách gói tập |
| GET | /api/checkins | Lịch sử check-in |
| GET | /api/pt | Danh sách PT |
| GET | /api/pt/schedules | Lịch đào tạo PT |
| POST | /api/pt/schedules | Đặt lịch PT |
| GET | /api/revenue | Doanh thu |
| GET | /api/members/expired | Hội viên hết hạn |
| GET | /api/members/birthday | Sinh nhật hôm nay |

## Ghi Chú

Hiện tại FE đang dùng mock data tại `FE/assets/js/data/mock-data.js`.
Khi backend sẵn sàng, chỉ cần thay các hàm mock bằng `fetch()` calls.
