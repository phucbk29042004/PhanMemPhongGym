# 📒 Nhật Ký Tiến Độ Dự Án

## Thông Tin Dự Án
- **Tên dự án**: Paradise GYM — Fullstack Management System
- **Ngày bắt đầu**: 07/05/2026
- **Mô tả**: Hệ thống quản lý phòng GYM hiện đại sử dụng SPA Vanilla JS (Frontend) và Node.js/SQLite (Backend).

---

## 📌 Trạng Thái Hiện Tại
**✅ HOÀN THÀNH**: Tính năng Check-in bằng QR Code đã được implement đầy đủ (BE + FE). Hội viên có thể lấy mã QR trong Member Portal, lễ tân quét tại `scan.html`, cron job tự động xác nhận buổi tập lúc 22:00, PT/admin có thể hoàn tác buổi tập do cron xác nhận.

---

## 📋 Danh Sách Thay Đổi

### 09/05/2026 — Bổ sung upload ảnh QR và hướng dẫn sử dụng trong scan.html
- **Loại**: Chỉnh sửa (Frontend)
- **File chỉnh sửa**: `FE/scan.html`
- **Mô tả**: Thêm nút "Tải ảnh QR lên" dùng `Html5Qrcode.scanFile()` để decode QR từ file ảnh (screenshot), thêm banner hướng dẫn cách quét đúng
- **Kết quả**: Thành công

### 09/05/2026 — Thêm nút "Quét QR" vào header Admin Portal
- **Loại**: Chỉnh sửa (Frontend)
- **File chỉnh sửa**:
    - `FE/index.html` — Thêm nút "Quét QR" vào header (trước theme-toggle)
    - `FE/assets/js/app.js` — Gắn sự kiện click mở `scan.html` trong tab mới
- **Mô tả**: Lễ tân/admin có thể mở trang quét QR bằng 1 click từ header, không cần nhớ URL
- **Kết quả**: Thành công

### 09/05/2026 — Tính năng Check-in bằng QR Code (Fullstack)
- **Loại**: Tính năng mới (Fullstack — BE + FE)
- **File tạo mới**:
    - `BE/src/controllers/qr-checkin.controller.js` — `getMyQr` (JWT 5 phút bằng QR_JWT_SECRET) + `scanQr` (xác thực token → kiểm tra gói → ghi luot_vao_ra)
    - `BE/src/routes/qr-checkin.routes.js` — `GET /api/checkin/my-qr`, `POST /api/checkin/scan`
    - `BE/src/jobs/cron-pt-confirm.js` — Cron job 22:00 tự động xác nhận buổi tập có check-in (node-cron)
    - `FE/scan.html` — Trang standalone quét QR cho lễ tân (html5-qrcode + nhập thủ công)
- **File chỉnh sửa**:
    - `BE/src/config/db.js` — Migration: ALTER TABLE lich_tap ADD COLUMN da_checkin, CREATE TABLE cau_hinh
    - `BE/src/app.js` — Mount `/api/checkin` routes, thêm PATCH vào CORS methods
    - `BE/src/controllers/pt-schedules.controller.js` — Thêm `revertSchedule` (hoàn tác buổi do cron xác nhận)
    - `BE/src/routes/pt-schedules.routes.js` — Thêm `PATCH /:id/hoan-tac`
    - `BE/index.js` — Import + khởi động cron job khi server start
    - `BE/package.json` — Thêm node-cron, restore đầy đủ dependencies
    - `FE/member-portal.html` — Thêm tab "QR Check-in", import qrcode.js CDN
    - `FE/assets/js/member-portal.js` — Thêm page `my-qr` (render QR, countdown 5 phút, auto-refresh)
    - `FE/assets/js/pages/pt-training.js` — Thêm nút "Hoàn tác" trên card buổi `auto_cron`, event delegation + API call
    - `FE/assets/js/api.js` — Thêm method `patch()`
- **Chi tiết kỹ thuật**:
    - QR token dùng `QR_JWT_SECRET` riêng (khác `JWT_SECRET`), TTL 5 phút
    - Cron job dùng `confirmed_by_id = NULL + ghi_chu = 'auto_cron'` để phân biệt với xác nhận thủ công
    - Hoàn tác chỉ được phép trong vòng 1 ngày và chỉ với buổi `auto_cron`
    - Migration an toàn: ALTER TABLE trong try-catch (bỏ qua nếu cột đã tồn tại)
    - scan.html hoạt động standalone, tự kiểm tra auth và vai_tro
- **Kết quả**: Thành công

### 09/05/2026 — Tạo tài khoản đăng nhập cho hồ sơ từ màn hình Admin
- **Loại**: Tính năng mới (Fullstack)
- **File chỉnh sửa**:
    - `BE/src/controllers/members.controller.js` — Thêm function `createAccount` (bcrypt hash, transaction, audit log)
    - `BE/src/routes/members.routes.js` — Thêm route `POST /api/members/:id/create-account` (chỉ admin/le_tan)
    - `BE/src/controllers/trainers.controller.js` — Thêm `h.tai_khoan_id` vào query `getTrainers`
    - `FE/assets/js/pages/member-add.js` — Thêm checkbox "Tạo tài khoản ngay" với auto-fill SĐT vào username
    - `FE/assets/js/pages/members-list.js` — Thêm form tạo tài khoản trong modal chi tiết hội viên (tab info) và modal PT
- **Chi tiết**:
    - Backend: kiểm tra hồ sơ tồn tại, kiểm tra đã có tài khoản chưa, kiểm tra tên đăng nhập trùng, map `loai_ho_so → vai_tro`, bcrypt hash cost=12, transaction (INSERT tai_khoan + UPDATE ho_so.tai_khoan_id)
    - Form thêm mới: checkbox toggle, tự fill username = SĐT, gọi API sau khi tạo hồ sơ thành công
    - Modal hội viên: badge "Đã có / Chưa có tài khoản", form tạo có username (pre-fill SĐT) + password, sau thành công refresh tab
    - Modal PT: tương tự modal hội viên, hiển thị trong `_showPtModal`
- **Kết quả**: Thành công



### 09/05/2026 — Tách Portal PT và Portal Hội viên theo role
- **Loại**: Tính năng mới (Frontend)
- **File tạo mới**:
    - `FE/pt-portal.html` — Trang portal dành riêng cho Huấn luyện viên (PT)
    - `FE/member-portal.html` — Trang portal dành riêng cho Hội viên
    - `FE/assets/js/pt-portal.js` — SPA logic cho PT Portal: Dashboard, Lịch tập của tôi, Học viên của tôi, Hồ sơ cá nhân
    - `FE/assets/js/member-portal.js` — SPA logic cho Member Portal: Dashboard (gói tập + cảnh báo + PT + lịch sắp tới), Lịch tập, Lịch sử vào/ra, Hồ sơ cá nhân
- **File chỉnh sửa**:
    - `FE/assets/js/auth.js` — Đổi redirect sau login thành redirect theo `vai_tro`: admin/le_tan → `index.html`, pt → `pt-portal.html`, hoi_vien → `member-portal.html`
- **Chi tiết**:
    - Mỗi portal có guard kiểm tra role — nếu sai role sẽ redirect về đúng portal
    - PT Portal: sidebar đầy đủ, dark mode, filter lịch tập theo trạng thái/ngày/tên HV
    - Member Portal: giao diện mobile-friendly với bottom tab bar, hiển thị cảnh báo khi gói tập còn ≤ 7 ngày, không hiển thị giá tiền
    - Backend endpoint đã đủ: `/pt/schedules`, `/checkins/me`, `/members/me/profile` (có `goi_tap` + `dang_ky_pt`)
- **Kết quả**: Thành công

### 08/05/2026 17:16 — Thực hiện redesign tab Hội viên dạng card responsive
- **Loại**: Chỉnh sửa (Frontend — redesign giao diện)
- **File/Thành phần liên quan**: `FE/assets/js/pages/members-list.js`
- **Mô tả**: Chuyển vùng danh sách Hội viên từ bảng ngang sang grid card responsive giống phong cách tab PT, giữ đầy đủ thông tin hiện tại gồm avatar, tên, số điện thoại, mã HV, trạng thái, gói tập, chi nhánh, ngày hết hạn và các nút thao tác. Giữ nguyên hook search/filter/pagination/modal và bổ sung xử lý `truncate`, `min-w-0` để nội dung dài không tràn layout.
- **Kết quả**: Thành công

---

### 08/05/2026 21:15 — Đổi tab Hội viên từ bảng sang card grid
- **Loại**: Chỉnh sửa (Frontend — redesign giao diện)
- **File chỉnh sửa**: `FE/assets/js/pages/members-list.js`
- **Mô tả**: Viết lại `_renderMemberTable()` từ dạng bảng sang card grid 4 cột (giống kiểu tab PT cũ). Mỗi card gồm: avatar lg + dot status online/offline, tên (đổi xanh khi hover) + SĐT, 2 info block (Mã HV / Trạng thái), 2 info block (Gói tập / Hết hạn), nút thao tác (visibility/edit/delete). Đổi container `members-table-container` từ div wrapper sang `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. Logic filter/search/pagination/init không thay đổi.
- **Kết quả**: Thành công

---

### 08/05/2026 21:00 — Redesign tab PT trong members-list từ card grid sang bảng
- **Loại**: Chỉnh sửa (Frontend — redesign giao diện)
- **File chỉnh sửa**: `FE/assets/js/pages/members-list.js`
- **Mô tả**: Viết lại hàm `_renderPtCards()` từ dạng card grid 4 cột sang dạng bảng (`table`) giống tab Hội viên. Cột mới: Huấn luyện viên (avatar + dot status + tên + SĐT), Mã PT, Chuyên môn, Học viên (icon-bg), Đánh giá (star pill + kinh nghiệm), Thao tác (visibility/edit/delete ẩn → hiện khi hover). Đổi container `pt-cards-container` từ `grid` sang `div` thường. Toàn bộ logic filter/sort/pagination/init **không thay đổi**.
- **Kết quả**: Thành công

---

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
