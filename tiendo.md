# 📒 Nhật Ký Tiến Độ Dự Án

## Thông Tin Dự Án
- **Tên dự án**: Paradise GYM — Fullstack Management System
- **Ngày bắt đầu**: 07/05/2026
- **Mô tả**: Hệ thống quản lý phòng GYM hiện đại sử dụng SPA Vanilla JS (Frontend) và Node.js/SQLite (Backend).

---

## 📌 Trạng Thái Hiện Tại
**✅ HOÀN THÀNH**: Toàn bộ Backend API đã đầy đủ. Frontend đã tích hợp đầy đủ với modal chi tiết hội viên 3 tab, form đăng ký gói tập, form đặt lịch PT. Hệ thống sẵn sàng kiểm thử end-to-end.

---

## 📋 Danh Sách Thay Đổi

### 08/05/2026 16:37 — Sửa chiều cao card Lịch đã đặt theo card Thông tin đặt lịch
- **Loại**: Sửa bug / Cải thiện UI (Frontend)
- **File/Thành phần liên quan**: `FE/assets/js/pages/pt-register.js`
- **Mô tả**: Đổi grid màn Đăng ký lịch tập PT sang `items-stretch`, đặt card Lịch đã đặt `h-full min-h-0`, cho vùng danh sách `flex-1 min-h-0 overflow-y-auto`, và giảm số lịch mỗi trang xuống 3 để card bên phải luôn cao bằng card Thông tin đặt lịch khi sidebar mở hoặc thu gọn.
- **Kết quả**: Thành công

---

### 08/05/2026 16:31 — Tối ưu card Lịch đã đặt trong Đăng ký lịch tập PT
- **Loại**: Chỉnh sửa / Cải thiện UI (Frontend)
- **File/Thành phần liên quan**: `FE/assets/js/pages/pt-register.js`
- **Mô tả**: Chia layout màn Đăng ký lịch tập PT theo tỉ lệ 7:3 ở desktop, bỏ cơ chế kéo cao card Lịch đã đặt gây khoảng trắng phía dưới, và thêm phân trang cho danh sách lịch đã đặt để dữ liệu nhiều không tràn khỏi card.
- **Kết quả**: Thành công

---

### 08/05/2026 20:30 — Redesign giao diện toàn bộ (Bước 3 + 4): packages, member-add, pt-training, pt-register
- **Loại**: Chỉnh sửa (Frontend — redesign + bug fix)
- **File chỉnh sửa**:
    - `FE/assets/js/pages/packages.js` — Redesign: stat cards với icon-bg, card gói tập giữ gradient xanh nhưng rounded-2xl + hover glow, bảng so sánh dùng gym-table + section-header
    - `FE/assets/js/pages/member-add.js` — Redesign: rounded-2xl, icon-bg cho section headers, inputs/selects rounded-xl, btn-primary, tab switcher rounded-2xl
    - `FE/assets/js/pages/pt-training.js` — Redesign + **Fix bug**: `init()` đổi thành `async`, thêm fetch `/pt/schedules` khi `ptSchedules` rỗng, nút Tải lại cũng fetch lại, stat cards với icon-bg, PT cards với gym-card hover glow, section-header cho panel PT
    - `FE/assets/js/pages/pt-register.js` — Redesign + **Fix bug**: null-safe spread `Array.isArray()` check thay vì `[...undefined]`, đổi `b.status` → `b.trang_thai` trong statusBadge, rounded-2xl, gym-card cho booking items, section-header, max-height + overflow-y-auto cho booking list, empty state đẹp hơn
- **Mô tả**: Tiếp nối redesign toàn bộ giao diện theo Material 3 Glassmorphism. Sửa 2 bug quan trọng: (1) pt-training không có dữ liệu khi vào thẳng trang, (2) pt-register crash do TypeError khi ptSchedules/ptBookings là undefined + badge không hiển thị đúng trạng thái
- **Kết quả**: Thành công

---

### 08/05/2026 16:30 — Hoàn thiện Backend API còn thiếu (Phase 3)
- **Loại**: Tạo mới & Chỉnh sửa (Backend)
- **File tạo mới**:
    - `BE/src/controllers/pt-registrations.controller.js` — CRUD đăng ký gói PT (`dang_ky_pt`)
    - `BE/src/routes/pt-registrations.routes.js` — Routes `/api/pt/registrations`
    - `BE/src/controllers/staff.controller.js` — CRUD nhân viên lễ tân/nội bộ
    - `BE/src/routes/staff.routes.js` — Routes `/api/staff`
- **File chỉnh sửa**:
    - `BE/src/controllers/members.controller.js` — Thêm `getBirthday` (lọc theo today/week/month) và `getMyProfile` (hội viên/PT tự xem hồ sơ)
    - `BE/src/routes/members.routes.js` — Thêm `GET /birthday`, `GET /me/profile`
    - `BE/src/app.js` — Mount thêm `/api/pt/registrations` và `/api/staff`
- **Chi tiết**:
    - `POST /api/pt/registrations`: đăng ký gói PT với kiểm tra hội viên/PT tồn tại
    - `PUT /api/pt/registrations/:id/cancel`: hủy đăng ký + tự động hủy tất cả buổi tập `cho_tap`
    - `GET /api/members/birthday?period=today|week|month`: sinh nhật hội viên
    - `GET /api/members/me/profile`: tự xem hồ sơ, gắn gói tập & lịch PT cho hội viên, gắn lịch dạy sắp tới cho PT
- **Kết quả**: ✅ Backend đủ 100% endpoints theo nghiệp vụ (bỏ qua chấm công theo yêu cầu).

### 08/05/2026 17:30 — Hoàn thiện luồng nghiệp vụ Tab 3 (Lịch tập với PT)
- **Loại**: Tính năng mới (Frontend)
- **File chỉnh sửa**: `FE/assets/js/pages/members-list.js`
- **Chi tiết**:
    - Tab 3 được chia thành 2 section: "Gói PT đã đăng ký" + "Lịch tập đã đặt"
    - Thêm nút **"Đăng ký gói PT"** (tím) → mở sub-modal với form: chọn PT, số buổi, giá, từ ngày, đến ngày, ghi chú → gọi `POST /api/pt/registrations`
    - Nút **"Đặt lịch mới"** chỉ hiện khi có gói PT còn buổi/còn hạn. Nếu không → hiện cảnh báo vàng.
    - `refreshAndSetTab` re-fetch cả `m` (để `pt_hien_tai` cập nhật sau khi đăng ký gói PT mới)
    - Luồng chuẩn: Tạo hồ sơ → Đăng ký gói tập (Tab 2) → Đăng ký gói PT (Tab 3 Section 1) → Đặt lịch (Tab 3 Section 2)
- **Kết quả**: ✅ Luồng nghiệp vụ đầy đủ 4 bước theo yêu cầu.

### 08/05/2026 17:00 — Sửa lỗi luồng đăng ký gói tập và lịch PT
- **Loại**: Sửa bug (Frontend)
- **File chỉnh sửa**: `FE/assets/js/pages/members-list.js`
- **Bug 1 — Gói tập không hiện sau khi lưu**: Tab 2 dùng mock data thay vì API thực. Fix: `_showMemberModal` fetch song song 3 API (`/members/:id`, `/members/:id/history`, `/pt/schedules?hoi_vien_id=:id`), `setTab()` dùng biến closure, sau khi lưu gói gọi `refreshAndSetTab('package')` để reload dữ liệu.
- **Bug 2 — Lỗi "chưa có hợp đồng PT"**: Form đặt lịch hiện toàn bộ danh sách PT nhưng backend yêu cầu `dang_ky_pt_id`. Fix: select PT chỉ hiện từ `m.pt_hien_tai` (hợp đồng đang active), nếu trống hiện thông báo đỏ "Chưa có gói PT".
- **Bug 3 — phuong_thuc_tt sai giá trị**: Hardcode `'Chuyển khoản'`/`'Tiền mặt'` không khớp constraint DB. Fix: thêm `<select#pkg-payment-method>` với 6 giá trị đúng DB.
- **Thêm**: `_packageStatusBadge` xử lý DB values (`dang_hoat_dong`, `het_han`, `da_huy`...). Bảng lịch sử dùng đúng field API (`tu_ngay`, `den_ngay`, `gia_thuc_te`).
- **Kết quả**: ✅ Cả 3 bug đã được sửa.

### 08/05/2026 15:30 — Nâng cấp FE members-list.js (Modal 3 tab + Form đăng ký)
- **Loại**: Tính năng mới (Frontend)
- **File chỉnh sửa**: `FE/assets/js/pages/members-list.js`
- **Chi tiết**:
    - Thêm nút "Xem tất cả" cho cả 2 tab (Hội viên + PT)
    - Tab PT: thêm toolbar lọc đầy đủ (filter modal chuyên môn + trạng thái, nút "Xóa lọc")
    - Modal chi tiết hội viên: nâng cấp lên 3 tab — Thông tin chung / Lịch sử đăng ký gói / Lịch tập PT
    - Sub-modal "Thêm gói": form đầy đủ với auto-calc cần thanh toán và khách nợ
    - Sub-modal "Đăng ký lịch mới": chọn PT, chọn ngày, time-picker 96 slot (00:00–23:45, bước 15 phút)
    - Dark mode: dùng class `modal-card` trên tất cả overlay containers
- **Kết quả**: ✅ Hoàn thành toàn bộ tính năng FE yêu cầu.

### 08/05/2026 14:10 — Đồng bộ hóa Dữ liệu Fullstack & Khắc phục lỗi hiển thị Modal
- **Loại**: Tích hợp & Persistence (Fullstack)
- **Chi tiết các thành phần đã xong**:
    - **Persistence (Hệ thống lưu trữ)**: Chuyển đổi logic "Đăng ký gói" và "Đặt lịch PT" từ lưu tạm sang gọi API POST thực tế. Dữ liệu hiện đã được lưu vĩnh viễn vào SQLite.
    - **Data Mapping**: Đồng bộ hóa toàn bộ property naming (ho_ten, ten_goi, chuyen_mon) giúp xóa bỏ các lỗi `undefined` trong Modal.
    - **UI Layout Fix**: Sửa lỗi đè Dropdown trong trang Lịch đào tạo PT và lỗi hiển thị ID thay vì tên HLV.
    - **Backend Upgrade**: Bổ sung `dang_ky_pt_id` vào API chi tiết hội viên để phục vụ việc đặt lịch.
- **Kết quả**: ✅ Hệ thống hoạt động ổn định, dữ liệu không bị mất khi refresh trang.

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
