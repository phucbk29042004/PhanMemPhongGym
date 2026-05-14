# 📒 Nhật Ký Tiến Độ Dự Án

## Thông Tin Dự Án
- **Tên dự án**: Paradise GYM — Fullstack Management System
- **Ngày bắt đầu**: 07/05/2026
- **Mô tả**: Hệ thống quản lý phòng GYM hiện đại sử dụng SPA Vanilla JS (Frontend) và Node.js/SQLite (Backend).

---

## 📌 Trạng Thái Hiện Tại
**✅ Tối giản hóa thanh Header trên Web & Chuẩn hóa icon phễu lọc** — Ẩn các nhãn chữ hiển thị ở khu vực tài khoản trên header của Admin và PT portal, giữ nguyên nhãn nút "Quét QR", đồng bộ hóa toàn bộ icon lọc sang dạng chiếc phễu chuyên nghiệp (`filter_alt`).



---

## 📋 Danh Sách Thay Đổi

### 14/05/2026 17:15 — Tối Giản Hóa Thanh Header Web & Chuẩn Hóa Icon Phễu Lọc
- **Loại**: Cải thiện giao diện (Frontend)
- **File chỉnh sửa**:
  - `FE/index.html` — Ẩn các nhãn chữ hiển thị của tài khoản Admin góc phải, giữ nguyên dòng chữ "Quét QR" theo đúng yêu cầu bổ sung của người dùng.
  - `FE/pt-portal.html` — Ẩn các nhãn chữ hiển thị của tài khoản PT góc phải thanh Header, tối ưu không gian hiển thị thuần khối tròn avatar sang trọng.
  - `FE/assets/js/pages/members-list.js` — Thay thế toàn bộ icon `tune` tại các nút Lọc dữ liệu và header của Modal Lọc sang icon chiếc phễu chuyên nghiệp `filter_alt`.
- **Mô tả**: Chuyển đổi thiết kế khu vực người dùng trên thanh Header sang dạng thuần đồ họa (icon-only dashboard) giúp không gian thanh thoát hơn; chuẩn hóa toàn diện nhận diện tính năng lọc dữ liệu với icon chiếc phễu đồng nhất.
- **Kết quả**: Thành công

### 14/05/2026 17:09 — Chuẩn Hóa & Nâng Cấp Giao Diện Bộ Lọc Dữ Liệu Hội Viên
- **Loại**: Cải thiện tính năng & giao diện (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/members-list.js` — (1) Mở rộng `_filterState` hỗ trợ 5 tiêu chí lọc (`status`, `pkg`, `gender`, `hasPt`, `checkinToday`); (2) Viết lại giao diện overlay `_showFilterModal` sang phong cách M3 Premium Dashboard chia section với đầy đủ icon trực quan; (3) Cập nhật thuật toán `_applyMemberFilter` ánh xạ chính xác 4 trạng thái từ Backend (`con_han`, `sap_het_han`, `het_han`, `chua_dang_ky`), trích xuất linh hoạt gói tập đang dùng (`m.ten_goi_tap`) và hỗ trợ lọc chéo đa tiêu chí reactive; (4) Đồng bộ bộ đếm badge và cơ chế reset nút "Xóa lọc".
- **Mô tả**: Giải quyết triệt để lỗi bộ lọc hội viên cũ không hoạt động do gán sai trạng thái tĩnh so với API và dữ liệu gói tập bị undefined. Bổ sung các bộ lọc giá trị cao cho Admin/Lễ tân: Lọc hội viên đang có PT/Tự tập và trạng thái Check-in trong ngày.
- **Kết quả**: Thành công

### 14/05/2026 13:58 — Redesign Toàn Bộ Giao Diện Mobile App (Hội Viên)
- **Loại**: Tái thiết kế giao diện (Frontend — React Native)
- **File chỉnh sửa / tạo mới**:
  - `MobileApp/src/navigation/MemberNavigator.js` — Cấu hình lại Tab Bar 5 tabs (Trang chủ / Vào Ra / Tập luyện / Thông báo / Tài khoản); icon container có nền khi active; tab "Tập luyện" ở giữa nổi bật với background xanh lá khi focus.
  - `MobileApp/src/screens/member/MemberHomeScreen.js` — Viết lại hoàn toàn: banner Paradise Gym với tia nắng, card hợp đồng hiển thị gói tập đang hoạt động từ API, tiện ích nhanh 4 nút bo góc, danh sách gói hội viên từ `GET /api/packages` + `GET /api/packages/pt`, panel Paradise Gym tổng quan cuối trang. Cảnh báo realtime từ `GET /api/members/me/notifications`.
  - `MobileApp/src/screens/member/MemberScheduleScreen.js` — Viết lại: header chuẩn, thống kê tháng (đã tập / chưa tập tự tính từ API), mini-calendar lưới 7 cột bôi màu ngày đã tập, danh sách lịch sử tập luyện với card chi tiết (ngày, giờ, HLV, địa điểm, trạng thái).
  - `MobileApp/src/screens/member/MemberNotificationScreen.js` — Tạo mới: header với nút refresh, banner check-in hôm nay, danh sách thông báo phân nhóm 4 mức (danger/warning/info/success) với icon tương ứng. Gọi `GET /api/members/me/notifications`.
  - `MobileApp/src/screens/member/MemberProfileScreen.js` — Viết lại: card profile premium với avatar, tên, SĐT, badge hạng hội viên, quick stats (gói tập / hết hạn / buổi PT); menu thông tin định danh, gói tập & hợp đồng, cài đặt (switch dark mode), nút đăng xuất. Gọi `GET /api/members/me/profile`.
  - `MobileApp/src/screens/member/MemberCheckinsScreen.js` — Tạo mới: thống kê lượt vào/ra, bộ lọc (Tất cả/Vào/Ra), danh sách card vào/ra với icon màu sắc phân biệt. Gọi `GET /api/checkins/me`.
- **Mô tả**: Tái thiết kế toàn diện theo bố cục hình ảnh mẫu mà người dùng cung cấp. Bố cục và đồ họa theo ảnh mẫu, nội dung nghiệp vụ theo đúng hệ thống Paradise Gym. Tông màu xanh lá `#1D9336` nhất quán. 100% dữ liệu từ API thực tế, không có mock data.
- **Kết quả**: Thành công


- **Loại**: Cải thiện giao diện (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/members-list.js` — (1) Thiết kế lại header modal với banner gradient xanh lá (`#1a5e2a → #22c55e`), avatar 72px có ring trắng + dot trạng thái, quick stats bar 3 ô (Gói tập / Hết hạn / Giới tính) nằm cuối banner; (2) Tab bar mới dùng `border-bottom` active thay vì sliding indicator; (3) Tab "Thông tin" thiết kế lại với 3 nhóm (Cá nhân / Liên hệ / Tập luyện), mỗi trường có icon badge vuông xanh lá, divider mỏng giữa các dòng, sectionTitle có gradient line; (4) Phần tài khoản đăng nhập có header riêng nổi bật hơn.
  - `FE/assets/js/pages/member-add.js` — Thay `<input type="date">` ngày sinh bằng 3 `<select>` Ngày / Tháng / Năm, sync giá trị vào hidden input `reg-ngay-sinh` theo format `YYYY-MM-DD`; event listener `syncNgaySinh` cập nhật mỗi khi 1 trong 3 dropdown thay đổi.
- **Mô tả**: Modal chi tiết hội viên trước đây có header đơn giản và tab info hiển thị grid ô xám đơn điệu. Đã thiết kế lại với banner gradient premium và layout thông tin theo nhóm có icon. Ô ngày sinh dùng input date thô của trình duyệt, đã thay bằng 3 dropdown thống nhất giao diện với toàn bộ form.
- **Kết quả**: Thành công

### 14/05/2026 08:32 — Thông Báo Realtime Portal (Không Lưu DB)
- **Loại**: Tính năng mới (Fullstack — Backend + Frontend)
- **File chỉnh sửa**:
  - `BE/src/controllers/members.controller.js` — Thêm hàm `getMyNotifications()`: tự động nhận diện role qua `req.user.vai_tro`; Hội viên: 6 nghiệp vụ (gói hết hạn, sắp hết hạn, buổi PT hôm nay, gói PT sắp hết buổi, check-in hôm nay, buổi PT bị hủy gần đây); PT: 5 nghiệp vụ (HV đã check-in hôm nay, HV chưa check-in ≤30 phút, lịch mới 24h, buổi bị hủy 7 ngày, HV mới đăng ký 7 ngày); Sắp xếp theo mức độ `danger > warning > info > success`; Trả thêm cờ `da_check_in_hom_nay`.
  - `BE/src/routes/members.routes.js` — Đăng ký route `GET /api/members/me/notifications` (protected bởi `verifyToken` toàn router).
  - `FE/assets/js/member-portal.js` — Thêm fetch `/members/me/notifications` vào `_fetchData()`; Thêm helper `renderNotificationBanners()` render Banner Card với 4 cấp màu M3; Chèn banners ngay đầu Dashboard `render()`.
  - `FE/pt-portal.html` — Thêm Bell Icon + Dropdown HTML vào Header, đặt cạnh nút dark/light.
  - `FE/assets/js/pt-portal.js` — Fetch notifications cùng `_fetchData()`; Thêm `_initNotifications()`: cập nhật badge số lượng, render dropdown, gắn sự kiện toggle/click-outside.
- **Mô tả**: **✅ Bell Icon Thông Báo — Hội Viên & PT** — Cả hai portal đều có Bell Icon + Dropdown trên Header cạnh nút dark/light, kèm badge đỏ số lượng. Hội viên còn có thêm Banner Card ngay đầu Dashboard. Dữ liệu tính toán realtime từ DB qua endpoint `GET /api/me/notifications`, không lưu bảng `thong_bao`.
**✅ Responsive Đặt Lịch PT** — Tối ưu hiển thị danh sách "Lịch đã đặt" trên màn hình nhỏ, thay đổi cách tính chiều cao (`h-full` -> `lg:h-full`) để danh sách tự giãn vừa đúng 5 item mà không bị cắt hoặc lộ khoảng trắng. Nâng cấp CSS Grid cho hai ô "Chọn PT" và "Chọn hội viên" để hiển thị ngang hàng nhau trên màn hình lớn. Nâng cấp Premium Dashboard UI cho khối chọn thời gian và thao tác: Hàng trên gộp 3 trường (Loại, Ngày, Thời lượng) thành 3 cột cân đối (`grid-cols-3`); Hàng dưới tạo dải thời gian ngang liên hoàn `Từ: [Giờ:Phút] → Đến: [Giờ kết thúc]` giúp triệt tiêu hoàn toàn tình trạng ô Select bị kéo giãn quá dài. Nút bấm đặt lịch được tinh gọn lề phải sang trọng kèm đổ bóng nổi bật.
- **Kết quả**: Thành công
- **Loại**: Tính năng mới (Fullstack — Backend + Frontend)
- **File chỉnh sửa**:
  - `BE/src/config/db.js` — Migration v4: Transaction-safe rename→recreate→copy→drop bảng `thong_bao`; thêm loại `cap_nhat_buoi_tap` vào CHECK constraint (tổng 16 loại); flag `db_migration_thongbao_v4` trong `cau_hinh` để chỉ chạy 1 lần.
  - `BE/src/controllers/pt-schedules.controller.js` — Hàm `updateSchedule()`: sau khi `UPDATE lich_tap` thành công, query chi tiết buổi tập → gọi `createNotification('cap_nhat_buoi_tap', ...)` với `danh_cho='ca_hai'` để gửi đến cả hội viên và PT.
  - `FE/assets/js/app.js` — Module Notifications: bổ sung ánh xạ icon+màu cho toàn bộ 16 loại (bao gồm 8 loại thiếu từ v2 và `cap_nhat_buoi_tap` mới với icon `edit_calendar`, màu `text-blue-600`).
- **Mô tả**: Khi Lễ tân/Admin sửa ngày hoặc giờ của một buổi tập PT trạng thái `cho_tap`, hệ thống tự động sinh 1 thông báo realtime hiển thị ngay trên dropdown Bell Icon của Admin/Lễ tân, đồng thời hội viên và PT liên quan sẽ nhận được thông tin kịp thời khi truy cập Portal.
- **Kết quả**: Thành công

### 12/05/2026 08:35 — Bổ Sung 8 Loại Thông Báo Mới (Tổng 15 Loại)
- **Loại**: Tính năng mới (Backend)
- **File chỉnh sửa**:
  - `BE/src/config/db.js` — Migration v2: tái tạo bảng `thong_bao` với CHECK constraint 15 loại; dùng flag `db_migration_thongbao_v2` trong `cau_hinh` để chỉ chạy 1 lần; giữ toàn bộ dữ liệu cũ qua rename→recreate→copy
  - `BE/src/controllers/members.controller.js` — Thêm `createNotification('gia_han_goi_tap')` vào `registerPackage()` và `createNotification('tai_khoan_moi')` vào `createAccount()`
  - `BE/src/controllers/pt-registrations.controller.js` — Import `createNotification`; thêm `createNotification('dang_ky_goi_pt_moi')` vào `createRegistration()`
  - `BE/src/controllers/pt-schedules.controller.js` — Import `createNotification`; thêm `createNotification('huy_buoi_tap')` vào `cancelSchedule()` và `createNotification('hoan_tac_buoi_tap')` vào `revertSchedule()`
  - `BE/src/controllers/auth.controller.js` — Import `createNotification`; thêm `createNotification('tai_khoan_bi_khoa')` ngay sau `lockAccount.run()` kèm IP address
  - `BE/src/jobs/cron-daily.js` — Thêm job 4 `het_han_goi_pt_thang` (quét `dang_ky_pt` loai_goi='theo_thang' hết hạn hôm nay); thêm job 5 `tom_tat_buoi_sang` (1 thông báo tổng hợp duy nhất, số liệu lấy từ jobs 1-3); xóa thông báo cũ chuyển về cuối (job 6)
- **Mô tả**: Nâng hệ thống thông báo từ 7 lên 15 loại. Không thay đổi FE vì bell icon và 5 endpoint đã hoạt động với mọi loại thông báo.
- **Kết quả**: Thành công
### 11/05/2026 — Hệ Thống Thông Báo Bell Icon
- **Loại**: Tính năng mới (Backend + Frontend)
- **File tạo mới**:
  - `BE/src/utils/notifications.js` — Helper `createNotification()` dùng chung cho cron và realtime
  - `BE/src/controllers/notifications.controller.js` — 5 handler: getNotifications, getUnreadCount, getSummary, markAsRead, markAllAsRead
  - `BE/src/routes/notifications.routes.js` — Route `/api/notifications` với verifyToken
  - `BE/src/jobs/cron-daily.js` — Cron 08:00 sáng (sinh thông báo sắp hết hạn, hết hạn, sắp hết buổi PT, xóa cũ 30 ngày) + Cron mỗi 5 phút (kiểm tra buổi PT chưa check-in)
- **File chỉnh sửa**:
  - `BE/src/config/db.js` — Migration tạo bảng `thong_bao` + 2 index tự động khi khởi động
  - `BE/src/app.js` — Import và mount `/api/notifications`
  - `BE/index.js` — Import và start `startDailyCronJobs()`
  - `BE/src/jobs/cron-pt-confirm.js` — Sau xác nhận buổi tập → sinh thông báo `cron_tu_xac_nhan`
  - `BE/src/controllers/qr-checkin.controller.js` — Sau QR check-in thành công → sinh `check_in`
  - `BE/src/controllers/checkins.controller.js` — Sau check-in thủ công (loai='vao') → sinh `check_in`
  - `BE/src/controllers/members.controller.js` — Sau tạo hội viên mới → sinh `ho_so_moi` cho admin
  - `FE/index.html` — Thay nút notifications cũ bằng bell icon có badge + dropdown
  - `FE/assets/js/app.js` — IIFE Notifications: polling 30s, dropdown render, mark read, login summary toast
  - `FE/assets/css/main.css` — Style dropdown + scrollbar
- **Mô tả**: Hệ thống thông báo đầy đủ 7 loại sự kiện. Phân quyền: admin nhận tất cả, lễ tân không nhận `ho_so_moi`. Polling FE 30 giây. Toast tổng hợp khi login.
- **Kết quả**: Thành công

### 11/05/2026 — Modal Quét QR Check-in (thay thế mở scan.html tab mới)
- **Loại**: Cải thiện UX (Frontend)
- **File chỉnh sửa**:
  - `FE/index.html` — Thêm `#modal-qr-scan` (ẩn mặc định) với đầy đủ UI: camera scanner (`#qr-modal-reader`), upload ảnh QR, nhập token thủ công, vùng kết quả; import CDN `html5-qrcode@2.3.8`
  - `FE/assets/js/app.js` — Thay `window.open('scan.html', '_blank')` bằng `window._openQrModal()`; thêm IIFE `QR SCAN MODAL` với toàn bộ logic: `_startScanner`, `_stopScanner`, `_handleScan`, `_showSuccess`, `_showResultError`, bind sự kiện (đóng modal, Escape, click overlay, upload ảnh, nhập thủ công); sau check-in thành công tự refresh trang checkin nếu đang mở
  - `FE/assets/css/main.css` — Thêm `@keyframes spin` và style cho `#qr-modal-reader`
- **Mô tả**: Trước đây click "Quét QR" mở tab `scan.html` riêng. Đã chuyển sang modal overlay ngay trong trang admin, giữ nguyên toàn bộ luồng và kết quả check-in. `scan.html` đã xóa vì không còn dùng.
- **Kết quả**: Thành công

### 11/05/2026 14:24 — Redesign Member Portal theo mẫu FE_Hoivien
- **Loại**: Chỉnh sửa giao diện (Frontend)
- **File/Thành phần liên quan**:
  - `FE/member-portal.html`
  - `FE/assets/js/member-portal.js`
- **Mô tả**: Thiết kế lại shell Member Portal theo mẫu `FE_Hoivien.txt.txt`: top bar, sidebar desktop, bottom nav mobile, layout dashboard dạng bento. Giữ dữ liệu thật từ API hiện có; không thêm các chỉ số demo không có backend như cân nặng/BMI/tỷ lệ mỡ/điểm thưởng. Gộp QR Check-in vào dashboard và bỏ tab QR riêng, vẫn dùng API `/checkin/my-qr`, countdown và nút làm mới mã.
- **Kết quả**: Thành công

### 11/05/2026 13:57 — Chuẩn hóa nhãn enum trên giao diện
- **Loại**: Sửa bug (Frontend)
- **File/Thành phần liên quan**:
  - `FE/assets/js/app.js`
  - `FE/member-portal.html`
  - `FE/pt-portal.html`
  - `FE/assets/js/member-portal.js`
  - `FE/assets/js/pages/members-list.js`
  - `FE/assets/js/pages/pt-training.js`
- **Mô tả**: Rà soát các giao diện hiển thị raw enum dạng gạch chân như `da_tap`, `cho_tap`, `ca_nhan`, `dang_hoat_dong`, `qr_code`, `the_tu`; bổ sung helper `formatEnumLabel` và mở rộng `statusBadge` để chuyển sang nhãn tiếng Việt trước khi render.
- **Kết quả**: Thành công

### 11/05/2026 13:49 — Fix lỗi xóa hội viên đã soft-delete
- **Loại**: Sửa bug (Backend + Frontend)
- **File/Thành phần liên quan**:
  - `BE/src/controllers/members.controller.js`
  - `FE/assets/js/pages/members-list.js`
- **Mô tả**: Sửa `DELETE /api/members/:id` để nếu hồ sơ hội viên đã bị soft-delete trước đó thì trả success thay vì 404; đồng thời chuẩn hóa reload danh sách hội viên sau khi sửa/xóa theo đúng shape API `{ data: [...], pagination }`.
- **Kết quả**: Thành công

### 11/05/2026 — Batch 4: Member Portal & Check-in stats thực tế
- **Loại**: Tính năng mới + Sửa bug (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/checkin.js` — Thêm `_stats` state; `_fetchAndRefresh()` gọi song song `GET /checkins/stats` (hôm nay) + `GET /checkins/stats?date=<hôm qua>` để lấy `dang_trong_phong`, `luot_vao`, so sánh % với hôm qua; Thay stat card cứng "+12%" bằng dữ liệu thật; Card "Đang trong phòng" thay card "Lượt vào cao nhất/giờ"; Thêm `id="checkin-stats-grid"` để cập nhật DOM sau mỗi refresh
  - `FE/assets/js/member-portal.js` — (1) `Math.round` → `Math.ceil` cho `daysLeft`; (2) `my-schedule.init()` fetch `/pt/schedules` khi vào tab, thêm nút Tải lại trong bộ lọc; (3) `profile.render()` bổ sung 4 field: Ngày tham gia (`ngay_tao`), CCCD (`cccd`), Quê quán (`que_quan`), Địa chỉ đầy đủ (ghép `dia_chi_tam_tru + phuong_xa + quan_huyen + tinh_thanh`)
- **Mô tả**: Stat cards check-in trước đây dùng data tính từ local array và hardcode "+12%". Đã fix: gọi API stats thật, hiển thị người đang trong phòng và % so hôm qua. Member Portal: lịch tập đồng bộ khi vào tab, profile đầy đủ thông tin cá nhân.
- **Kết quả**: Thành công

### 11/05/2026 — Batch 3: Lịch PT & Menu Doanh thu
- **Loại**: Tính năng mới + Sửa bug (Frontend + Backend)
- **File tạo mới**:
  - `FE/assets/js/pages/revenue.js` — Trang Doanh thu: 4 stat card (tổng/hôm nay/gói tập/gói PT), biểu đồ cột Chart.js theo ngày (gói tập + gói PT chồng nhau), bảng giao dịch hôm nay, bộ lọc 7/30/90/365 ngày, nút tải lại
- **File chỉnh sửa**:
  - `BE/src/controllers/trainers.controller.js` — Thêm `getTrainerMembers`: trả danh sách HV có hợp đồng `dang_hoat_dong` với PT, kèm `dang_ky_pt_id` và số buổi còn lại
  - `BE/src/routes/trainers.routes.js` — Thêm route `GET /:id/members`
  - `BE/src/routes/pt-schedules.routes.js` — Mở role `PUT /:id/cancel` cho `le_tan` (trước chỉ admin)
  - `FE/assets/js/pages/pt-register.js` — Viết lại: (1) Sau khi chọn PT gọi `GET /trainers/:id/members` chỉ hiện HV có hợp đồng; (2) Thêm select Thời lượng (30ph/1h/1.5h/2h), tự tính giờ kết thúc; (3) Dùng `dang_ky_pt_id` từ HV, bỏ bước fetch thêm `/members/:id`
  - `FE/assets/js/pages/pt-training.js` — Thêm modal Sửa lịch (ngày/giờ/ghi chú, gọi `PUT /pt/schedules/:id`); bind nút Hủy (confirm + `PUT /pt/schedules/:id/cancel`); nút chỉ hiện cho buổi `cho_tap`
  - `FE/index.html` — Thêm menu "Doanh thu" (icon `payments`) vào sidebar; import `revenue.js`
- **Mô tả**: Đặt lịch PT trước đây hiện tất cả HV, giờ kết thúc phải nhập tay. Đã fix: lọc HV theo PT, tự tính giờ kết thúc. Trang Lịch đào tạo có nút Sửa/Hủy đầy đủ. Thêm trang Doanh thu hoàn chỉnh với chart và bảng giao dịch.
- **Kết quả**: Thành công

### 11/05/2026 — Batch 2: Form thêm mới hồ sơ — Validation, upload ảnh, gợi ý chuyên môn
- **Loại**: Sửa bug + Tính năng mới (Frontend + Backend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/member-add.js` — Viết lại hoàn toàn: (1) Validation format inline (SĐT 10 số 03-09, Email có @, CCCD 9/12 số); (2) Validation trùng SĐT/CCCD với API trước khi lưu; (3) Upload ảnh bằng FormData gửi cùng hồ sơ, lưu lên Cloudinary qua BE; (4) Input chuyên môn PT dùng datalist 15 gợi ý; (5) Quê quán dùng datalist 63 tỉnh/thành; (6) Ngày sinh có min/max hợp lý (10–100 tuổi); (7) Gói tập tự tính ngày kết thúc từ so_thang; (8) Thêm field kinh nghiệm (năm) cho PT
  - `BE/src/controllers/members.controller.js` — Thêm hàm `checkDuplicate`: kiểm tra SĐT/CCCD/email đã tồn tại chưa
  - `BE/src/routes/members.routes.js` — Thêm route `GET /api/members/check-duplicate`
- **Mô tả**: Form thêm mới hồ sơ trước đây không có validation, ảnh chỉ preview nhưng không lưu. Đã fix toàn diện: validation real-time, check trùng với DB, upload ảnh Cloudinary ngay lúc tạo hồ sơ.
- **Kết quả**: Thành công

### 11/05/2026 — Batch 1: Fix UI danh sách hội viên & tab chi tiết
- **Loại**: Sửa bug + Cải thiện (Frontend + Backend)
- **File chỉnh sửa**:
  - `FE/assets/js/app.js` — Bổ sung đầy đủ các status vào `statusBadge`: `con_han`, `sap_het_han`, `het_han`, `chua_dang_ky`, `cho_tap`, `da_xac_nhan`, `da_huy`, `hoan_tac`, `dang_hoat_dong`, `vao`, `ra`
  - `FE/assets/js/pages/members-list.js` — Fix giới tính (`'male'` → `'nam'/'nu'`); hiển thị đúng địa chỉ (`dia_chi_tam_tru` + tỉnh/huyện/xã); tab Gói tập dùng `goi_tap_hien_tai[0]` thay vì `m.ngay_bat_dau`; auto-fill `den_ngay` khi chọn gói tập/gói PT; thêm `data-thang` vào option gói PT; sửa giá trị select giới tính trong modal edit (`'Nam'` → `'nam'`); thêm nút edit PT với class `pt-edit-btn`, bind event; thêm `_showPtEditModal()`; thêm `_bindPtCardEvents` binding cho `pt-edit-btn`
  - `BE/src/controllers/members.controller.js` — Bổ sung `chuyen_mon`, `tu_ngay`, `den_ngay` vào JSON `pt_hien_tai` trong `getMemberById`
- **Mô tả**: Sửa các bug hiển thị trong danh sách hội viên: badge trạng thái hiện đúng màu theo DB value, tab Thông tin hiển thị đầy đủ địa chỉ/CCCD/quê quán, tab Gói tập hiện dữ liệu gói đang dùng thật, đăng ký gói tự động tính ngày kết thúc, tab PT của danh sách PT đã có nút Sửa hoạt động
- **Kết quả**: Thành công

### 11/05/2026 — Fix nút Sửa/Xóa hội viên + hiệu ứng nút Làm mới Dashboard
- **Loại**: Sửa bug + Thêm tính năng (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/members-list.js` — Thêm `data-id`/class cho nút Sửa/Xóa, bind event, thêm `_showEditModal()` (modal chỉnh sửa inline), `_confirmDeleteMember()` (confirm dialog trước khi xóa)
  - `FE/assets/js/pages/dashboard.js` — Đổi nút Làm mới thành có id, tách `_fetchAndRender()`, thêm hiệu ứng xoay icon + disable + text "Đang tải..." khi fetch
- **Mô tả**: Nút Sửa/Xóa trên card hội viên trước đây không có `data-id` và không có event listener nên click không làm gì. Đã fix và thêm modal sửa thông tin (họ tên, SĐT, email, ngày sinh, giới tính, địa chỉ, ghi chú) + confirm dialog xóa. Nút Làm mới dashboard thêm hoạt ảnh xoay icon khi đang tải.
- **Kết quả**: Thành công

### 11/05/2026 — Fix Dashboard "Check-in gần nhất" + Biểu đồ doanh thu thật + Xóa mock code
- **Loại**: Sửa bug + Refactor (Backend + Frontend)
- **File chỉnh sửa**:
  - `BE/src/controllers/revenue.controller.js` — Thêm query `recent_checkins` (8 lượt vào hôm nay) vào `/api/revenue/dashboard`
  - `FE/assets/js/pages/dashboard.js` — Sửa parse giờ dùng `gio_hien_thi`, fetch `/revenue?days=365` song song, gộp theo tháng thay mock data
  - `FE/assets/js/pages/members-list.js` — Xóa `_mockPkgHistory`, `_getPackagePrice`, `_getMemberPackageHistory` (dead code)
  - `FE/assets/js/pages/packages.js` — Implement đầy đủ CRUD gói tập (modal Thêm/Sửa/Xóa)
- **Kết quả**: Thành công

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
