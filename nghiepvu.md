# 📋 NGHIỆP VỤ HỆ THỐNG — PARADISE GYM

> **Tài liệu này mô tả chi tiết nghiệp vụ của từng vai trò người dùng trong hệ thống Paradise GYM**
> Được phân tích dựa trên file: *Hướng dẫn sử dụng phần mềm GYM Web*

---

## 👑 1. QUẢN TRỊ VIÊN (ADMIN)

Người có **quyền cao nhất**, truy cập và thao tác được toàn bộ hệ thống.

### 1.1 Quản Lý Hồ Sơ
- Thêm mới hồ sơ cho **tất cả loại**: hội viên, PT, nhân viên
- Xóa hồ sơ bất kỳ (2 cách)
- Phân loại hồ sơ đúng vai trò khi tạo

### 1.2 Quản Lý Gói Tập
- Thêm mới gói tập cho phòng gym
- Chỉnh sửa gói tập (tên, số tháng, số ngày, giá)
- Xóa gói tập *(chỉ xóa được gói chưa có ai đăng ký)*
- Đăng ký gói tập cho hội viên
- Xem lịch sử đăng ký gói tập của hội viên

### 1.3 Quản Lý PT & Lịch Tập
- Đăng ký PT cho hội viên
- Đăng ký buổi tập PT cho hội viên (cả 2 cách)
- Xem **toàn bộ** lịch tập của phòng gym
- Thay đổi PT của hội viên
- Thay đổi ngày tập / giờ tập
- Xác nhận buổi đã tập hay chưa
- Hủy buổi tập

### 1.4 Theo Dõi & Thống Kê
- Xem doanh thu hôm nay (tổng tiền, chi tiết, gói cao nhất)
- So sánh doanh thu với tháng trước
- Xem lượng khách vào/ra phòng tập theo từng thời điểm
- Xem danh sách hội viên **sắp hết hạn** (2 cách)
- Xem danh sách hội viên **đã hết hạn** (2 cách)

### 1.5 Chấm Công & Nhân Sự
- Cấu hình kết nối máy chấm công
- Xem giờ công toàn bộ nhân viên / PT
- Lọc xem theo loại hồ sơ: PT / nhân viên / hội viên
- Chọn khoảng thời gian xem công tùy ý

### 1.6 Tài Khoản
- Đổi mật khẩu tài khoản của mình

---

## 👩‍💼 2. NHÂN VIÊN LỄ TÂN

Người **trực tiếp tiếp nhận hội viên**, xử lý đăng ký và theo dõi hàng ngày.

> ⚠️ Tài liệu gốc không phân quyền tường minh cho lễ tân. Nghiệp vụ dưới đây được suy luận dựa trên đặc thù công việc thực tế tại phòng gym. Cần xác nhận lại với chủ phòng gym khi triển khai thực tế.

### 2.1 Quản Lý Hồ Sơ
- Thêm mới hồ sơ hội viên
- Xem danh sách hội viên và trạng thái (màu sắc)
- Xem chi tiết hồ sơ từng hội viên

### 2.2 Quản Lý Gói Tập
- Đăng ký gói tập cho hội viên
- Xem lịch sử đăng ký gói tập của hội viên
- Xem danh sách hội viên sắp hết hạn → để nhắc gia hạn
- Xem danh sách hội viên đã hết hạn → để liên hệ

### 2.3 Quản Lý PT & Lịch Tập
- Đăng ký PT cho hội viên
- Đăng ký buổi tập PT cho hội viên
- Xem lịch tập (phạm vi tùy phân quyền admin cấp)

### 2.4 Theo Dõi Hàng Ngày
- Xem lượng khách vào/ra phòng tập
- Xem biểu đồ thống kê khách theo thời điểm trong ngày

### 2.5 Tài Khoản
- Đổi mật khẩu tài khoản của mình

### ⛔ Giới Hạn So Với Admin
- **Không** được thêm/sửa/xóa gói tập của phòng gym
- **Không** xem được báo cáo doanh thu
- **Không** cấu hình máy chấm công
- **Không** xem giờ công nhân viên tổng thể
- **Không** xóa hồ sơ *(khả năng cao cần quyền admin)*

---

## 🏃 3. HỘI VIÊN (NGƯỜI DÙNG)

Người **tự theo dõi quá trình tập luyện** của bản thân. Quyền hạn hẹp nhất, chỉ xem thông tin của chính mình.

### 3.1 Hồ Sơ Cá Nhân
- Xem thông tin hồ sơ cá nhân của mình
- Xem gói tập đang đăng ký
- Xem tên PT đang đăng ký

### 3.2 Lịch Tập
- Xem lịch tập với PT của **chính mình**
- Xem các buổi tập đã đăng ký (khung giờ, ngày tập)
- Xem trạng thái buổi tập (đã tập / chưa tập / đã hủy)

### 3.3 Chấm Công / Vào-Ra
- Xem chi tiết **giờ vào – giờ ra** của chính mình
- Theo dõi lịch sử ra vào phòng tập của bản thân

### 3.4 Tài Khoản
- Đổi mật khẩu tài khoản của mình

### ⛔ Giới Hạn
- **Không** thấy lịch tập của hội viên khác
- **Không** tự đăng ký gói tập (phải qua lễ tân / admin)
- **Không** tự đăng ký PT (phải qua lễ tân / admin)
- **Không** xem doanh thu
- **Không** xem danh sách hội viên khác
- **Không** chỉnh sửa bất kỳ thông tin nào của hệ thống

---

## 💪 4. PT (HUẤN LUYỆN VIÊN)

Người **quản lý lịch dạy và học viên** của mình. Quyền hạn giới hạn trong phạm vi công việc cá nhân.

### 4.1 Lịch Tập
- Xem lịch tập **của chính mình** với các học viên
- Xem danh sách học viên đang tập với mình
- Xem khung giờ tập của từng học viên

### 4.2 Buổi Tập
- Xem trạng thái từng buổi tập (đã xác nhận / chưa)
- Xem lịch sử buổi tập với từng học viên

### 4.3 Chấm Công / Vào-Ra
- Xem chi tiết **giờ vào – giờ ra** của chính mình
- Theo dõi lịch sử chấm công của bản thân

### 4.4 Tài Khoản
- Đổi mật khẩu tài khoản của mình

### ⛔ Giới Hạn
- **Không** thấy lịch tập của PT khác
- **Không** tự thêm/xóa học viên vào danh sách của mình
- **Không** tự đăng ký buổi tập (phải qua lễ tân / admin)
- **Không** xem doanh thu
- **Không** xem danh sách hội viên toàn phòng
- **Không** chỉnh sửa thông tin gói tập

---

## 📊 5. BẢNG SO SÁNH PHÂN QUYỀN TỔNG HỢP

| Chức Năng | Admin | Lễ Tân | Hội Viên | PT |
|---|:---:|:---:|:---:|:---:|
| Thêm / xóa hồ sơ | ✅ | ✅ | ❌ | ❌ |
| Xem danh sách toàn bộ hội viên | ✅ | ✅ | ❌ | ❌ |
| Đăng ký gói tập cho hội viên | ✅ | ✅ | ❌ | ❌ |
| Quản lý gói tập (thêm/sửa/xóa) | ✅ | ❌ | ❌ | ❌ |
| Đăng ký PT cho hội viên | ✅ | ✅ | ❌ | ❌ |
| Đăng ký buổi tập PT | ✅ | ✅ | ❌ | ❌ |
| Xem lịch tập toàn phòng gym | ✅ | ❌ | ❌ | ❌ |
| Xem lịch tập của chính mình | ✅ | ❌ | ✅ | ✅ |
| Thay đổi lịch tập / PT / giờ | ✅ | ❌ | ❌ | ❌ |
| Xác nhận / hủy buổi tập | ✅ | ❌ | ❌ | ❌ |
| Xem doanh thu | ✅ | ❌ | ❌ | ❌ |
| Xem khách vào / ra phòng tập | ✅ | ✅ | ❌ | ❌ |
| Xem danh sách sắp / hết hạn | ✅ | ✅ | ❌ | ❌ |
| Cấu hình máy chấm công | ✅ | ❌ | ❌ | ❌ |
| Xem giờ công toàn bộ nhân viên | ✅ | ❌ | ❌ | ❌ |
| Xem giờ công của chính mình | ✅ | ✅ | ✅ | ✅ |
| Đổi mật khẩu tài khoản | ✅ | ✅ | ✅ | ✅ |

---

## 📌 6. GHI CHÚ QUAN TRỌNG

- Phân quyền của **Admin** và **PT / Hội viên** được mô tả rõ trong tài liệu gốc.
- Phân quyền của **Lễ tân** được suy luận từ nghiệp vụ thực tế — cần xác nhận lại với chủ phòng gym trước khi triển khai.
- Hệ thống hỗ trợ **đa chi nhánh** — dữ liệu tập trung từ nhiều chi nhánh về một nơi.
- Hội viên, PT, nhân viên đều có thể sử dụng app **Paradise HR** trên điện thoại để theo dõi thông tin của mình.

---

*Phiên bản: 1.0 — Phân tích từ tài liệu: Hướng dẫn sử dụng phần mềm GYM Web (Paradise GYM)*
