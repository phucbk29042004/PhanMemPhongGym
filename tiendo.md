# 📒 Nhật Ký Tiến Độ Dự Án

## Thông Tin Dự Án
- **Tên dự án**: Paradise GYM — Fullstack Management System
- **Ngày bắt đầu**: 07/05/2026
- **Mô tả**: Hệ thống quản lý phòng GYM hiện đại sử dụng SPA Vanilla JS (Frontend) và Node.js/SQLite (Backend).

---

## 📌 Trạng thái hiện tại
**✅ Đồng bộ giao diện avatar preview thành hình tròn hoàn hảo** — Bo tròn các ảnh avatar preview (Admin Profile, HLV/PT, Hội viên, Nhân viên) khi xem và khi chọn ảnh mới để đảm bảo tính thẩm mỹ, đồng bộ.

---

### [11/06/2026 13:30] — Đồng bộ giao diện avatar preview thành hình tròn hoàn hảo
- **Loại**: Chỉnh sửa giao diện UI/UX (Frontend Web)
- **File**: `FE/index.html`, `FE/assets/js/app.js`, `FE/assets/js/pages/members-list.js`, `FE/assets/js/pages/staff.js`
- **Mô tả**:
  - **Nguyên nhân lỗi**: Cấu hình Tailwind CSS của dự án trong `index.html` định nghĩa `"full": "0.75rem"`, dẫn đến việc các phần tử dùng class `rounded-full` chỉ được bo góc vuông nhẹ (12px) thay vì là hình tròn. Điều này làm cho khung chứa ngoài màu trắng của các avatar preview (như Admin Profile, Header Avatar) bị hiển thị thành hình vuông bo góc.
  - **Khắc phục**:
    - **`index.html`**: Thay thế class `rounded-full` bằng inline style `style="border-radius: 50% !important;"` cho container preview avatar Admin Profile (`#admin-profile-avatar-preview`) và container avatar trên Header (`#header-avatar-container`).
    - **`app.js`**: Bổ sung style `border-radius: 50%` và `object-fit: cover` cho thẻ `img` hiển thị ảnh đại diện cũ và ảnh mới chọn qua `FileReader`.
    - **`members-list.js`**: Cập nhật ảnh đại diện tĩnh và sự kiện chọn ảnh mới của HLV/PT (`pte-avatar-preview`) và Hội viên (`me-avatar-preview`) để thẻ `img` luôn hiển thị hình tròn bao phủ đầy đủ.
    - **`staff.js`**: Gán trực tiếp style `border-radius: 50%` cho thẻ preview `#staff-avatar-preview` lúc khởi tạo và cập nhật động qua JS khi người dùng thay đổi ảnh mới.
- **Kết quả**: Thành công.

### [11/06/2026 10:56] — Khắc phục lỗi phân quyền nhân viên (Web & Mobile)
- **Loại**: Chỉnh sửa / Phân quyền UX
- **File**: `FE/assets/js/pages/staff.js`, `MobileApp/src/screens/admin/AdminStaffScreen.js`
- **Mô tả**:
  - Chặn không cho tài khoản role nhân viên (`nhan_vien`) thực hiện thao tác xóa nhân viên.
  - **Web Frontend (`staff.js`)**: Ẩn nút "Xóa" nhân viên trong bảng danh sách và card list nếu vai trò không phải `admin`/`chu_phong_gym`. Chặn logic sự kiện click xóa ở frontend, thông báo lỗi nếu không đủ quyền.
  - **Mobile App (`AdminStaffScreen.js`)**: Ẩn nút Thêm nhân viên ở header và ẩn toàn bộ vùng nút hành động (Sửa, Khóa/Mở khóa) trên thẻ nhân viên đối với tài khoản nhân viên.
- **Kết quả**: Thành công.

### [11/06/2026 10:38] — Khắc phục lỗi hiển thị sinh nhật hôm nay (Web Frontend)
- **Loại**: Sửa lỗi UI/UX (Frontend)
- **File**: `FE/assets/js/pages/birthday.js`
- **Mô tả**:
  - **Nguyên nhân**: Hàm `_getTodayBirthdays` lọc danh sách hội viên sinh nhật hôm nay trực tiếp từ mảng thô mà không thực hiện phân tách và gán hai thuộc tính `birthDay` và `birthMonth` cho đối tượng hội viên giống như hàm `_getBirthdayGroups`. Điều này khiến `renderAvatar` truy cập vào các giá trị không tồn tại và in ra `undefined/undefined` trên thanh hiển thị hôm nay.
  - **Khắc phục**: Thêm bước `.map()` trích xuất `birthDay` và `birthMonth` từ chuỗi ngày sinh trong hàm `_getTodayBirthdays`.
- **Kết quả**: Thành công.

### [11/06/2026 10:25] — Khắc phục lỗi Doanh thu chi nhánh bằng 0 (PayOS & Duyệt thủ công)
- **Loại**: Sửa lỗi logic & Đồng bộ dữ liệu (Backend, Web & Mobile)
- **File**: `BE/src/controllers/members.controller.js`, `BE/src/config/db.js`
- **Mô tả**:
  - **Nguyên nhân**: Khi hội viên thanh toán qua PayOS hoặc được lễ tân duyệt yêu cầu gia hạn tại quầy, hệ thống cập nhật trạng thái gói tập thành công nhưng lại để trống (bằng 0 hoặc null) cột thực thu `so_tien_da_thu`. Trong khi đó, các bộ lọc chi nhánh thống kê doanh thu dựa vào cột này để tính toán, dẫn đến doanh thu chi nhánh bị hiển thị bằng 0 dù giao dịch vẫn hiện đầy đủ.
  - **Khắc phục**: 
    - Cập nhật hàm `checkPayosStatus` và `approvePackageRequest` trong `members.controller.js` để tự động gán `so_tien_da_thu = gia_thuc_te` khi thanh toán thành công.
    - Bổ sung script chạy một lần khi khởi động hệ thống trong `db.js` để tự động chuẩn hóa và khôi phục các dữ liệu cũ bị lỗi `so_tien_da_thu = 0`.
    - Đồng bộ hiển thị chính xác lên toàn bộ các trang thống kê ở Web Dashboard và Mobile App.
- **Kết quả**: Thành công.

### [11/06/2026 09:58] — Cập nhật hiển thị tên chi nhánh thực tế khi check-in chéo & Đồng bộ QR Check-in
- **Loại**: Cải tiến UI/UX & Đồng bộ Backend & Sửa lỗi SQL (Web, Mobile & Backend)
- **File**: `FE/assets/js/pages/checkin.js`, `MobileApp/src/screens/admin/AdminDashboardScreen.js`, `BE/src/controllers/qr-checkin.controller.js`, `BE/src/controllers/checkins.controller.js`
- **Mô tả**:
  - **`checkin.js` & `AdminDashboardScreen.js`**: Thay thế dòng chữ tĩnh màu đỏ `"Chi nhánh khác đã check in"` bằng tên chi nhánh thực hiện check-in thực tế (`chi_nhanh_thuc_hien`) được tô màu đỏ nổi bật.
  - **`qr-checkin.controller.js` & `checkins.controller.js`**: Đồng bộ hoàn toàn logic kiểm tra phân quyền tập chéo chi nhánh (cho phép hội viên có gói Gym tập chéo thoải mái, còn hội viên chỉ có gói PT chỉ được tập chéo nếu có lịch hẹn hôm nay tại chi nhánh quét QR) và ghi nhận đúng `chi_nhanh_thuc_hien` khi quét mã QR check-in.
  - **Sửa lỗi SQL**: Đổi tên cột so khớp chi nhánh trong bảng `lich_tap` từ `chi_nhanh` thành `chi_nhanh_tap` để sửa lỗi `no such column: chi_nhanh`.
- **Kết quả**: Thành công.

### [11/06/2026 09:54] — Hiển thị cảnh báo check-in chéo chi nhánh
- **Loại**: Cải tiến UI & Sửa lỗi logic hiển thị (Web & Mobile)
- **File**: `FE/assets/js/pages/checkin.js`, `MobileApp/src/screens/admin/AdminDashboardScreen.js`
- **Mô tả**:
  - So khớp `chi_nhanh_thuc_hien` (nơi thực hiện quét) và `chi_nhanh_goc` (nơi đăng ký ban đầu) của hội viên.
  - Nếu hai giá trị này khác nhau (hội viên tập chéo chi nhánh), hệ thống hiển thị dòng chữ màu đỏ **"Chi nhánh khác đã check in"** thay vì hiển thị tên chi nhánh gốc. Quy tắc này được đồng bộ trên cả giao diện Web Check-in và Modal Check-in Dashboard trên Mobile.
- **Kết quả**: Thành công.

### [11/06/2026 09:37] — Triển khai check-in chéo chi nhánh & Đồng bộ hiển thị Chi nhánh gốc
- **Loại**: Chức năng mới & Đồng bộ giao diện (Fullstack Web & Mobile)
- **File**: `BE/src/controllers/checkins.controller.js`, `FE/assets/js/pages/checkin.js`, `MobileApp/src/screens/admin/AdminDashboardScreen.js`
- **Mô tả**:
  - **`checkins.controller.js`**:
    - Select thêm trường `chi_nhanh_goc` của hội viên trong API `getCheckins`.
    - Tái cấu trúc logic kiểm tra gói khi check-in (`createCheckin`): Nếu hội viên có gói Gym hoạt động, cho phép check-in mọi chi nhánh. Nếu chỉ có gói PT hoạt động, so khớp chi nhánh check-in với chi nhánh của PT; nếu khác chi nhánh, chỉ cho phép check-in khi có lịch tập PT đã được lên lịch hôm nay tại chi nhánh hiện tại.
  - **`checkin.js` (Web)**: Loại bỏ hiển thị mã hồ sơ, thay thế bằng hiển thị Chi nhánh gốc (`c.chi_nhanh_goc`) và Loại hồ sơ (HV/HLV/NV) tại khu vực thẻ check-in và bảng chi tiết.
  - **`AdminDashboardScreen.js` (Mobile)**: Đồng bộ thiết kế danh sách check-in trong modal dashboard, bổ sung Badge loại hồ sơ (HV/HLV/NV) bên cạnh tên hội viên và hiển thị Chi nhánh gốc kèm phương thức check-in ở dòng dưới.
- **Kết quả**: Thành công.

### [11/06/2026 08:58] — Đồng bộ kiểm tra SĐT di động Việt Nam sang Mobile App
- **Loại**: Cải tiến nghiệp vụ & Đồng bộ (Mobile App)
- **File**: `MobileApp/src/screens/admin/AdminAddEditMemberScreen.js`, `MobileApp/src/screens/admin/AdminAddEditPTScreen.js`, `MobileApp/src/components/EditProfileModal.js`
- **Mô tả**:
  - Đồng bộ quy tắc kiểm tra số điện thoại di động sang Mobile App, chỉ cho phép các số điện thoại bắt đầu bằng `03, 05, 07, 08, 09` và có đúng 10 chữ số.
  - Áp dụng vào form thêm/sửa Hội viên, form thêm/sửa HLV (PT), và popup cập nhật thông tin cá nhân của người dùng trên ứng dụng Mobile.
- **Kết quả**: Thành công.

### [11/06/2026 08:57] — Infinite Scroll bảng Giao dịch & Validate SĐT di động Việt Nam
- **Loại**: Cải tiến UI & Sửa lỗi nghiệp vụ (Frontend)
- **File**: `FE/assets/js/pages/revenue.js`, `FE/assets/js/pages/member-add.js`
- **Mô tả**:
  - **`revenue.js`**: Chuyển đổi bảng giao dịch hôm nay sang dạng cuộn vô hạn (infinite scroll) local. Thiết lập chiều cao tối đa cho container bảng `rev-today-table` là `400px` và lắng nghe sự kiện `scroll` để hiển thị lũy tiến (thêm 20 dòng mỗi lần lướt đến cuối).
  - **`member-add.js`**: Cập nhật biểu thức chính quy (Regex) kiểm tra số điện thoại di động sang `/^(03|05|07|08|09)\d{8}$/` để chỉ chấp nhận các đầu số nhà mạng di động Việt Nam hiện hành và buộc độ dài đúng 10 chữ số.
- **Kết quả**: Thành công.

### [11/06/2026 08:54] — Sửa lỗi vị trí Chat Box và thêm phân trang danh sách Giao dịch hôm nay
- **Loại**: Sửa bug & Chức năng mới (Web Frontend)
- **File**: `FE/assets/js/components/ai-assistant.js`, `FE/assets/js/pages/revenue.js`
- **Mô tả**:
  - **`ai-assistant.js`**: Thêm biến `savedLeft` và `savedTop` trong closure. Khi mở chat (`openChat`), lưu lại tọa độ kéo thả của icon chat và xóa inline styles của container để khung chat hiển thị chính xác ở vị trí cố định góc dưới bên phải mặc định. Khi đóng chat (`closeChat`), khôi phục lại vị trí của icon dựa vào tọa độ đã lưu.
  - **`revenue.js`**: Khởi tạo biến lưu trữ trang hiện tại `this._transactionPage = 1` tại hàm `init` và tự động reset về `1` mỗi khi gọi `_fetchAndRender` để thay đổi bộ lọc. Đảm bảo các nút điều hướng chuyển trang (Trang trước/Trang sau) hoạt động chuẩn xác và hiển thị mượt mà.
- **Kết quả**: Thành công.

### [11/06/2026 08:35] — Đồng bộ hiển thị gói PT đăng ký nối tiếp giống gói Gym
- **Loại**: Chỉnh sửa giao diện & Nghiệp vụ (Web Frontend)
- **File**: `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - Tách các hợp đồng PT (`pt_hien_tai`) chờ kích hoạt (`cho_kich_hoat` hoặc ngày bắt đầu trong tương lai) thành danh sách `pendingPtContracts`.
  - Thiết kế hiển thị danh sách này trong một khung viền đứt nét màu vàng (`border: 2px dashed #d97706; background:#fffbeb;`), tương tự giao diện của các gói tập Gym khi đăng ký nối tiếp.
  - Đồng bộ các nút thao tác nhanh (In hóa đơn, Sửa, Đổi gói, Hủy) tương ứng với hợp đồng PT đang chờ kích hoạt.
  - *Sửa lỗi (Bugfix)*: Khai báo thiếu biến `self` dẫn đến lỗi `self._parseLocalDate is not a function` khi render danh sách hợp đồng PT.
  - *Cải tiến vị trí hiển thị*: Điều chỉnh thứ tự hiển thị của gói PT nối tiếp nằm phía dưới gói PT đang sử dụng và phía trên lịch sử gói tập (giống hệt bố cục bên gói tập Gym).
- **Kết quả**: Thành công.

### [10/06/2026 16:55] — Khắc phục màn hình lỗi đỏ (RedBox) và chuẩn hóa thông báo Alert trên Mobile App
- **Loại**: Sửa bug (Mobile UI/UX)
- **File**: `MobileApp/src/screens/admin/AdminRegisterPTScheduleScreen.js`, `MobileApp/src/screens/admin/AdminRegisterPTScreen.js`, `MobileApp/src/screens/admin/AdminRegisterPackageScreen.js`, `MobileApp/src/screens/admin/AdminAddEditPTScreen.js`, `MobileApp/src/screens/admin/AdminAddEditPackageScreen.js`, `MobileApp/src/screens/admin/AdminPackageRequestsScreen.js`, `MobileApp/src/screens/admin/AdminExpiredMembersScreen.js`
- **Mô tả**:
  - Phát hiện lệnh `console.error` trong các block catch lỗi gọi API gây kích hoạt màn hình báo lỗi đỏ (RedBox/LogBox) thô của React Native/Expo, che khuất giao diện và gây hiểu lầm là lỗi ứng dụng cho người test.
  - Chuyển toàn bộ `console.error` lỗi API thành `console.log` để ghi nhận dưới nền âm thầm.
  - Chuẩn hóa các hộp thoại `Alert.alert('Lỗi', ...)` để lấy thông báo chuẩn xác từ backend qua `err?.response?.data?.message || err?.message || 'Có lỗi xảy ra.'` đảm bảo thông báo hiện lên đẹp đẽ, chuyên nghiệp.
- **Kết quả**: Thành công.

### [10/06/2026 16:40] — Cải thiện ngữ cảnh phản hồi của AI Chatbot, chặn lồng ghép số liệu phòng gym khi tư vấn chung
- **Loại**: Sửa bug / Cải tiến AI Chatbot
- **File**: `BE/src/controllers/assistant.controller.js`
- **Mô tả**:
  - Cập nhật quy tắc `accuracyRules` định nghĩa cho Trợ lý AI (Parry).
  - Bổ sung ràng buộc nghiêm ngặt: Chỉ sử dụng dữ liệu thống kê hoạt động phòng tập (lượt check-in, số hội viên, doanh thu...) hoặc hồ sơ cá nhân khi người dùng hỏi trực tiếp các câu hỏi liên quan đến báo cáo, thống kê, hoặc thông tin cá nhân.
  - Tuyệt đối không tự ý chèn các số liệu này vào câu trả lời đối với các câu hỏi chia sẻ kiến thức chung (sức khỏe, mệt mỏi, tập luyện, dinh dưỡng, lối sống), giúp câu trả lời tập trung vào đúng trọng tâm và không bị lan man.
- **Kết quả**: Thành công.

### [10/06/2026 16:10] — Bổ sung và cập nhật chú thích hướng dẫn sử dụng (guideHtml) trên Web Frontend
- **Loại**: Cải tiến tài liệu & Hướng dẫn sử dụng
- **File**: `FE/assets/js/pages/staff.js`, `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  1. **staff.js**: Thêm thuộc tính `guideHtml` mô tả các chức năng quản lý nhân sự, phân quyền tài khoản (khóa/mở khóa), cập nhật avatar và bộ lọc tìm kiếm.
  2. **members-list.js**: Cập nhật `guideHtml` để bổ sung hướng dẫn cho tính năng Nhập dữ liệu từ Excel kết hợp tải file ảnh ZIP, và Xuất danh sách Excel.
- **Kết quả**: Thành công.

### [10/06/2026 15:55] — Sửa đổi giao diện và luồng nghiệp vụ Web FE (scrollbar nhân viên, chuyển hướng tạo nhân viên, luồng thêm PT)
- **Loại**: Sửa bug + Cải tiến luồng
- **File**: `FE/assets/js/pages/staff.js`, `FE/assets/js/pages/member-add.js`, `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  1. **staff.js**: Bổ sung gradient cho scrollbar-track và corner transparent trong stylesheet để loại bỏ đường viền trắng bên phải cột Thao tác, đồng bộ với thiết kế danh sách hội viên.
  2. **member-add.js**: Sửa giá trị điều hướng từ `staff-list` (không tồn tại) thành `staff` khi thêm nhân viên thành công, đảm bảo hệ thống tự chuyển hướng về danh sách nhân viên.
  3. **members-list.js**: Đổi luồng nút "Thêm HLV" từ mở modal riêng sang chuyển sang trang thêm hội viên mới `member-add` và chọn sẵn vai trò HLV (`pt`). Đồng thời xóa bỏ hàm `_showAddPtModal` cũ.
- **Kết quả**: Thành công.

### [10/06/2026 15:20] — Sửa lỗi ẩn bộ lọc chi nhánh cho nhân viên trên Mobile App
- **Loại**: Sửa bug (Fullstack)
- **File**: `BE/src/controllers/auth.controller.js`
- **Mô tả**:
  - Bổ sung trường `chi_nhanh` trong truy vấn `findAccount` và payload phản hồi của API đăng nhập `/api/auth/login`.
  - Khắc phục triệt để lỗi khi nhân viên đăng nhập lần đầu tiên trên Mobile App, do thiếu `chi_nhanh` trong session user dẫn đến bộ lọc chi nhánh vẫn bị hiển thị trên các màn hình Dashboard, Members, Staff.
- **Kết quả**: Thành công.

### [10/06/2026] — Sửa 4 nhóm lỗi Mobile (filter chi nhánh, StaffCard, pagination, upload ảnh)
- **Loại**: Sửa bug + tính năng
- **File**: `AdminDashboardScreen.js`, `AdminStaffScreen.js`, `AdminMembersScreen.js`, `AdminAddEditMemberScreen.js`, `AdminAddEditPTScreen.js`, `components/SwipePager.js` (mới)
- **Mô tả**:
  1. **Dashboard — nhân viên**: Thêm `isStaffWithBranch`, bọc `branchTrigger` với `{!isStaffWithBranch && ...}` — ẩn bộ lọc chi nhánh với nhân viên chi nhánh cố định.
  2. **StaffCard**: Đổi `View` → `TouchableOpacity`, thêm nút Sửa (Edit2), truyền `onEdit` → `AdminAddEditMember` và `onPress` → `AdminMemberDetail`. Card bây giờ nhấn vào xem chi tiết được.
  3. **Phân trang vuốt**: Tạo component `SwipePager` — hiển thị 10 item/trang, vuốt ngang để chuyển trang, có dot indicator + nút mũi tên. Áp dụng cho `AdminMembersScreen` (HV + PT) và `AdminStaffScreen`. Bỏ nút Trước/Sau dạng text cũ. Staff đổi từ infinite scroll sang fetch-all (limit=200) + SwipePager.
  4. **Upload ảnh HV + PT**: Thêm `expo-image-picker` vào `AdminAddEditMemberScreen` và `AdminAddEditPTScreen`. UI avatar tròn với icon Camera, load ảnh hiện tại khi edit, upload sau khi save qua `PUT /api/members/:id/avatar` và `PUT /api/trainers/:id/avatar`.
- **Kết quả**: Thành công.

### [10/06/2026] — Tái cấu trúc navigation Mobile Admin + Nhân viên
- **Loại**: Tính năng mới (navigation restructure)
- **File**: `MobileApp/src/navigation/AdminNavigator.js`, `MobileApp/src/screens/admin/AdminMembersScreen.js`
- **Mô tả**:
  1. **AdminNavigator.js**: Xóa tab `AdminPT` khỏi bottom bar, thêm tab `AdminStaffTab` (`AdminStaffScreen`) thay thế. Đưa `AdminPTScreen` vào stack navigator (vẫn truy cập được từ Dashboard và điều hướng khác). Đổi icon tab từ `GraduationCap` → `UserCog`. Cả `admin` và `nhan_vien` đều dùng chung `AdminNavigator`.
  2. **AdminMembersScreen.js**: Thêm 2 sub-tab ngang "Hội viên" / "HLV / PT" ngay dưới header. Sub-tab HLV/PT nhúng toàn bộ logic của `AdminPTScreen` (danh sách PT + lịch tập), gồm `PTCard`, `ScheduleBadge`, phân trang, refresh, tìm kiếm, xóa PT (chỉ admin). Hỗ trợ `route.params.mainTab` để điều hướng trực tiếp vào sub-tab cụ thể.
- **Kết quả**: Thành công.

### [10/06/2026] — Sửa 8 lỗi đa nền tảng (Web + Mobile + BE)
- **Loại**: Sửa bug
- **File**: `BE/src/controllers/pt-schedules.controller.js`, `BE/src/controllers/members.controller.js`, `FE/assets/js/pages/member-add.js`, `FE/assets/js/pages/members-list.js`, `MobileApp/src/screens/admin/AdminMembersScreen.js`, `MobileApp/src/screens/admin/AdminPTScreen.js`, `MobileApp/src/screens/admin/AdminStaffScreen.js`, `MobileApp/src/screens/admin/AdminAddEditPTScreen.js`, `MobileApp/src/screens/admin/AdminRegisterPackageScreen.js`
- **Mô tả**:
  1. **BE — pt-schedules**: Thêm check `ngay_tap >= dkpt.tu_ngay` — không cho đặt lịch trước ngày hiệu lực của gói PT.
  2. **BE — switchPackage**: Thêm check `tu_ngay >= today` — không cho đổi gói về ngày quá khứ (Web + Mobile đều hưởng lợi).
  3. **Web — member-add.js navigate**: Xóa `navigate('members-list')` tổng quát ở cuối hàm save, giữ nguyên logic nhánh riêng biệt cho từng loại hồ sơ (PT → members-list, nhân viên → staff-list).
  4. **Web — member-add.js dropdown**: Disable `select#reg-chi-nhanh` và set giá trị cố định nếu `user.chi_nhanh` tồn tại (nhân viên chi nhánh không chọn được chi nhánh khác).
  5. **Web — members-list.js gói nối tiếp**: Thêm 4 nút In hóa đơn/Sửa/Đổi gói/Hủy gói vào block render `pendingPkgs` (gói chờ kích hoạt).
  6. **Mobile — AdminMembersScreen/AdminPTScreen/AdminStaffScreen**: Ẩn toàn bộ bộ lọc chi nhánh (ScrollView) khi user là nhân viên có chi nhánh cố định (`isStaffWithBranch`).
  7. **Mobile — AdminAddEditPTScreen**: Thêm prop `disabled` vào `SelectField`, truyền `disabled={isStaffWithBranch}` vào field chi nhánh — nhân viên không thể chọn chi nhánh khác khi tạo HLV.
  8. **Mobile — AdminRegisterPackageScreen**: Thêm validate `ymdStart < todayYMD` trước khi gọi API — hiện `Alert.alert` thay vì lỗi raw JSON.
- **Kết quả**: Thành công.



### [10/06/2026 09:20] — Giải quyết xung đột git pull và cấu hình bỏ qua file tạm SQLite
- **Loại**: Cấu hình & Sửa lỗi
- **File**: `BE/.gitignore`
- **Mô tả**:
  - Thực hiện khôi phục trạng thái ban đầu của các file tạm SQLite (`BE/database/paradise_gym.db-shm` và `BE/database/paradise_gym.db-wal`) để giải quyết xung đột khi `git pull`.
  - Cập nhật file `BE/.gitignore` chuyển `database/paradise_gym.db` thành `database/paradise_gym.db*` nhằm bỏ qua tất cả các file tạm SQLite khác để tránh lỗi xung đột trong tương lai.
  - Chạy `git pull` thành công đồng bộ dự án với phiên bản mới nhất từ remote repository.
- **Kết quả**: Thành công.


### [04/06/2026 13:54] — Tối ưu hóa layout và màu sắc các nút thao tác Lịch PT
- **Loại**: Cải tiến UI (Frontend Web)
- **File**: `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - **Sửa lỗi rớt dòng**: Khóa `flex-wrap: nowrap`, giảm `gap` xuống `4px` và `padding` xuống `3px 6px` (font-size `10.5px`), giúp cả 4 nút thao tác nằm thẳng hàng đẹp đẽ trên 1 hàng ngang trong cột Thao tác của bảng hợp đồng PT.
  - **Phủ tông xanh dịu nhẹ**: Đồng bộ các nút "In hóa đơn", "Sửa", "Đổi gói" sử dụng cùng tông màu xanh lá thương hiệu nhạt đặc trưng của dự án (nền `#e6f4ea`, border `#b7e1cd`, color `#137333`) để giao diện dịu mát, không bị lòe loẹt nhiều màu sắc. Nút "Hủy gói" chuyển sang màu đỏ nhạt dịu nhẹ `#fdf2f2` và màu chữ `#b91c1c` để vừa giữ cảnh báo vừa dịu mắt.
- **Kết quả**: Thành công.

### [04/06/2026 13:52] — Đồng bộ nút hành động và phủ màu xanh thương hiệu bảng Lịch PT
- **Loại**: Cải tiến UI (Frontend Web)
- **File**: `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - **Đồng bộ nút**: Thay thế các nút dạng icon tròn thô sơ bằng dạng nút có chữ đầy đủ ("In hóa đơn", "Sửa", "Đổi gói", "Hủy gói") và có màu nền đặc trưng tương ứng như bên tab Gói tập.
  - **Màu xanh thương hiệu**: Thay đổi đường viền container bảng thành màu xanh lục thương hiệu `#1D9336`, đổi nền header bảng thành màu xanh lục chữ trắng và thêm hiệu ứng hover dòng sang màu xanh lá nhạt dịu mát để bảng nổi bật, không bị nhạt nhòa.
- **Kết quả**: Thành công.

### [04/06/2026 14:00] — Đồng Bộ Giao Diện & Màu Sắc Các Gói Tập & PT
- **Loại**: Cải tiến UI
- **File**: `FE/assets/js/pages/members-list.js`
- **Mô tả**: Thay thế bảng danh sách PT trong Modal hội viên thành thiết kế dạng thẻ (card) tương tự như tab Gói tập. Đồng bộ toàn bộ màu sắc nền (gradient xanh lục) cho thông tin gói đang sử dụng (của cả gói tập và gói PT) theo đúng màu nền của header modal. Cập nhật thiết kế các nút thao tác PT với màu xanh lá nhạt dịu nhẹ.
- **Kết quả**: Hoàn tất, giao diện nay đã đồng nhất, hiển thị đẹp và hiện đại hơn.

### [04/06/2026 13:40] — Thêm Tính Năng In Hóa Đơn Trực Tiếp Trên Web, Redesign Tab Lịch PT & Xóa Thư Mục C# Cũ
- **Loại**: Chức năng mới & Cải tiến UI
- **File**: `FE/assets/js/components/invoice-template.js`, `FE/index.html`, `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - **`invoice-template.js`**: Tạo file helper in hóa đơn `window.GymApp.printInvoice` bọc trong iframe ẩn, tự động render HTML hóa đơn khổ A4 font Times New Roman, căn lề chuẩn in ấn, hiển thị thông tin chi nhánh, thông tin hội viên, gói tập đăng ký và người lập biểu.
  - **`index.html`**: Nhúng file script template hóa đơn mới.
  - **`members-list.js`**:
    - Tích hợp thêm các nút **"In hóa đơn"** tại thẻ thông tin Gói tập thường (tab Gói tập) và Gói PT (tab Đặt lịch PT). Khi click sẽ tự động lấy thông tin chi nhánh từ `branches.json` theo đúng chi nhánh đang quản lý và thực hiện in.
    - Thiết kế lại tab "Đặt lịch PT" trong modal chi tiết hội viên: Chuyển đổi các card thông tin gói PT thô cứng ban đầu thành bảng danh sách (`<table>`) nhỏ gọn, thu nhỏ kích thước chữ và các badge trạng thái để tối ưu không gian hiển thị, tăng độ thẩm mỹ.
  - **Xóa dọn dẹp**: Xóa hoàn toàn thư mục `PDFDocument` (code C# cũ) để tránh gây nhầm lẫn mã nguồn.
- **Kết quả**: Thành công.

### [04/06/2026 13:17] — Căn chỉnh Layout Badge Chi nhánh nằm ngang hàng trong Lịch Đào Tạo PT
- **Loại**: Chỉnh sửa giao diện
- **File**: `FE/assets/js/pages/pt-training.js`
- **Mô tả**: Đưa badge chi nhánh lên cùng hàng với badge loại buổi (`loai_buoi` hoặc `type`) trong thẻ lịch tập, bọc chúng vào một flexbox container phụ trợ, giúp thẻ không bị kéo dài chiều dọc.
- **Kết quả**: Thành công.

### [04/06/2026 13:08] — Lọc PT theo chi nhánh khi đăng ký gói PT & Badge chi nhánh lịch tập (Fullstack)
- **Loại**: Sửa bug & Chức năng mới (Web + Mobile)
- **File**: `FE/assets/js/pages/pt-training.js`, `FE/assets/js/pages/members-list.js`, `MobileApp/src/screens/admin/AdminRegisterPTScreen.js`
- **Mô tả**:
  - **`pt-training.js`**: Bổ sung badge hiển thị tên chi nhánh (icon location_on + tên ngắn) trên mỗi thẻ lịch tập khi Admin đang xem “Tất cả chi nhánh”. Khi lọc chi nhánh cụ thể, badge ẩn đi để không thừa thông tin.
  - **`members-list.js`**: Sửa 2 modal đăng ký gói PT (`_showAddPtRegistrationModal` và `_showEditPtRegistrationModal`): lọc danh sách HLV hiển thị chỉ theo chi nhánh đang chọn (`window.GymApp.selectedBranch`). Nếu đang xem tất cả chi nhánh thì vẫn hiển thị đầy đủ.
  - **`AdminRegisterPTScreen.js` (Mobile)**: Import `useAuthStore`, lấy `selectedBranch`, lọc danh sách HLV sau khi fetch từ API — chỉ hiển HLV thuộc chi nhánh đang chọn.
- **Kết quả**: Thành công.

### [04/06/2026 09:40] — Đồng bộ thông tin Chi nhánh HLV trên Mobile Admin
- **Loại**: Chức năng mới (Mobile)
- **File**: `MobileApp/src/screens/admin/AdminPTScreen.js`
- **Mô tả**: Bổ sung hiển thị thông tin Chi nhánh của HLV ngay trên thẻ PTCard hiển thị ở danh sách HLV nhằm đồng bộ giao diện với bản Web.
- **Kết quả**: Thành công.

### [04/06/2026 09:29] — Sửa lỗi bố cục hiển thị chi tiết HLV (PT)
- **Loại**: Sửa bug UI (Frontend)
- **File**: `FE/assets/js/pages/members-list.js`
- **Mô tả**: Bổ sung trường "Mã HLV" vào phần Thông tin cá nhân của popup chi tiết HLV. Việc này tăng tổng số ô thông tin lên 8 (số chẵn), giúp chia đều thành 4 hàng và lấp đầy khoảng trống thừa màu xám-xanh ở hàng thứ 4.
- **Kết quả**: Thành công.

### [04/06/2026 09:12] — Sửa lọc chi nhánh HLV và hiển thị thêm trường chi nhánh HLV
- **Loại**: Sửa bug & Chức năng mới (Frontend)
- **File**: `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - Khắc phục lỗi HLV không được lọc theo chi nhánh sau các thao tác (tải lại dữ liệu từ API, thêm mới HLV, reset bộ lọc). Thay gán trực tiếp danh sách HLV đầy đủ bằng việc gọi hàm `_applyPtFilter()`.
  - Hiển thị thêm trường "Chi nhánh" cho HLV trong cột bảng trên Desktop, badge thông tin trong card mobile, và hiển thị thông tin Chi nhánh trong tab chi tiết HLV.
- **Kết quả**: Thành công.

### [04/06/2026 09:08] — Lọc danh sách HLV theo chi nhánh trên trang members-list.js
- **Loại**: Sửa bug (Frontend)
- **File**: `FE/assets/js/pages/members-list.js`
- **Mô tả**: Bổ sung điều kiện so khớp chi nhánh `chi_nhanh` của PT với chi nhánh đang lọc `window.GymApp.selectedBranch` trong hàm `render`, `init` và hàm tìm kiếm/lọc `_applyPtFilter`. Trước đó, trang quản lý HLV hiển thị đầy đủ toàn bộ danh sách HLV từ DB mà không áp dụng bộ lọc chi nhánh toàn cục.
- **Kết quả**: Thành công.

### [04/06/2026 09:03] — Sửa lỗi CHECK constraint khi cập nhật trạng thái hoạt động của PT
- **Loại**: Sửa bug (Backend)
- **File**: `BE/src/controllers/trainers.controller.js`
- **Mô tả**: Sửa giá trị trạng thái tài khoản của HLV từ `'kich_hoat'` (gây lỗi CHECK constraint do SQLite chỉ chấp nhận `'hoat_dong'`, `'khoa'`, `'cho_xac_nhan'`) thành `'hoat_dong'`. Lỗi này là nguyên nhân khiến yêu cầu sửa thông tin PT (bao gồm cập nhật chi nhánh) bị trả về mã lỗi 500 và không cập nhật được.
- **Kết quả**: Thành công.

### [04/06/2026 08:58] — Đồng bộ thông tin Chi nhánh của PT (Web, Mobile & DB Migration)
- **Loại**: Sửa bug / Đồng nhất nghiệp vụ (Fullstack Web & Mobile & DB)
- **File**: `BE/src/controllers/trainers.controller.js`, `BE/src/config/db.js`, `FE/assets/js/pages/members-list.js`, `MobileApp/src/screens/admin/AdminAddEditPTScreen.js`
- **Mô tả**:
  - **Lỗi**: Khi lọc chi nhánh, danh sách PT bị rỗng vì toàn bộ PT mẫu lẫn PT tạo mới đều bị trống trường `chi_nhanh` (do Backend và Frontend đều chưa hỗ trợ nhập/chọn và lưu trường này).
  - **Khắc phục**:
    - **Backend**: Cập nhật `trainers.controller.js` để nhận và lưu/cập nhật trường `chi_nhanh` cho HLV (PT).
    - **Database Migration**: Thêm script tự động đồng bộ chi nhánh cho các PT cũ dựa trên chi nhánh của học viên đã đăng ký hợp đồng đào tạo PT với họ trước đó, giúp đồng bộ dữ liệu chuẩn xác. Nếu không có học viên nào, mặc định về "Chi nhánh Gò Vấp".
    - **Web Frontend**: Thêm ô chọn chi nhánh vào form Thêm mới và Chỉnh sửa HLV trong `members-list.js`.
    - **Mobile Frontend**: Thêm ô chọn chi nhánh và xác thực bắt buộc vào màn hình `AdminAddEditPTScreen.js`.
- **Kết quả**: Thành công.

### [04/06/2026 08:41] — Thiết kế lại biểu đồ Phương thức thanh toán cho Today/Yesterday
- **Loại**: Cải tiến UI / Thiết kế (Frontend)
- **File**: `FE/assets/js/pages/revenue.js`
- **Mô tả**:
  - Chuyển đổi biểu đồ cột chồng (`bar`) thành biểu đồ hình tròn khuyên (`doughnut`) đối với các bộ lọc **Hôm nay** và **Hôm qua** (ngày đơn).
  - Biểu đồ Doughnut hiển thị chi tiết tỷ lệ phân bổ phần trăm giữa "Tiền mặt" và "Chuyển khoản", có tooltip rõ ràng giúp giao diện gọn gàng, chuyên nghiệp và không bị to thô.
  - Vẫn giữ nguyên biểu đồ cột chồng (`bar`) cho bộ lọc nhiều ngày (7 ngày, 30 ngày).
- **Kết quả**: Thành công.

### [04/06/2026 08:40] — Sửa lỗi biểu đồ phương thức thanh toán (lần 2)
- **Loại**: Sửa bug (Frontend)
- **File**: `FE/assets/js/pages/revenue.js`
- **Mô tả**:
  - **Bug 1 — Sai daysInt cho today/yesterday**: Khi `this._days = 'today'`, `parseInt('today') = NaN` → fallback về `7`. Biểu đồ tạo key cho 7 ngày nhưng `_transactionsData` chỉ chứa giao dịch hôm nay → không có key nào khớp → hiện "Chưa có giao dịch". Fix: tính `daysInt = 1` và `endOffset` đúng cho today/yesterday.
  - **Bug 2 — calcInflow bỏ gói hết hạn**: Hàm `calcInflow` trả về `0` cho `trang_thai = 'het_han'`. Gói đăng ký 7 ngày trước → đến nay đã hết hạn → bị loại khỏi tổng → biểu đồ 7/30 ngày hiện trống dù có dữ liệu. Fix: chỉ bỏ `huy` và `tam_dung`, giữ lại `het_han` vì tiền đã được thu.
- **Kết quả**: Thành công.

### [04/06/2026 08:30] — Đồng nhất phương thức thanh toán và sửa lỗi biểu đồ Doanh thu
- **Loại**: Sửa bug / Đồng nhất nghiệp vụ (Fullstack Web & Mobile & DB)
- **File**: `BE/src/config/db.js`, `FE/assets/js/pages/revenue.js`, `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - **Chuẩn hóa Database & Dữ liệu cũ**: Cập nhật `BE/src/config/db.js` tự động chuyển đổi tất cả các giao dịch cũ có phương thức thanh toán khác (`the`, `momo`, `zalopay`, `khac`) về `'chuyen_khoan'` khi server khởi động.
  - **Sửa lỗi & Đồng bộ Biểu đồ Doanh thu**: 
    - Cập nhật `revenue.js` đồng bộ định dạng nhãn biểu đồ hiển thị ngày dạng `dd/mm/yyyy` thay vì `dd/mm` để hiển thị rõ ràng và khớp với múi giờ của người dùng.
    - Gom tất cả các phương thức thanh toán không phải `'tien_mat'` (bao gồm các phương thức cũ) vào cột biểu đồ `'Chuyển khoản'` để tránh lỗi rỗng dữ liệu khi lọc.
    - Đồng bộ định dạng ngày giao dịch hiển thị trong bảng chi tiết là `dd/mm/yyyy` thay vì chỉ có `dd/mm` như trước.
  - **Đồng nhất Giao diện chọn phương thức**: Cập nhật các đối tượng khai báo phương thức thanh toán `PM` trong `members-list.js` (modal Sửa gói và Đổi gói) chỉ hiển thị hai tùy chọn `'Tiền mặt'` và `'Chuyển khoản'`, đồng bộ hoàn toàn với logic backend và mobile app.
- **Kết quả**: Thành công.

### [03/06/2026 14:38] — Khắc phục 3 lỗi logic nghiệp vụ về check-in thủ công và đặt lịch/dời lịch tập PT trong quá khứ
- **Loại**: Sửa bug / Cải tiến nghiệp vụ (Fullstack Web & Mobile)
- **File**: `BE/src/controllers/checkins.controller.js`, `BE/src/controllers/pt-schedules.controller.js`, `MobileApp/src/screens/admin/AdminRegisterPTScheduleScreen.js`, `FE/assets/js/pages/pt-training.js`
- **Mô tả**:
  - **Check-in thủ công khi hết hạn gói (Backend)**: Bổ sung bước kiểm tra thời hạn gói tập / gói PT của hội viên trong API `createCheckin` (check-in thủ công từ lễ tân). Trả về lỗi `403` chặn check-in nếu hội viên không có gói hoạt động hoặc gói đã hết hạn (đồng bộ với logic quét QR).
  - **Chặn đặt lịch PT trong quá khứ (Backend & Mobile App)**:
    - **Backend**: Thêm logic validate ngày hiện tại trong API tạo lịch tập `createSchedule`. Trả về lỗi `400` nếu ngày tập nhỏ hơn ngày hôm nay theo múi giờ địa phương.
    - **Mobile FE**: Gán thuộc tính `minDate={new Date()}` cho component `DatePickerField` ở màn hình đặt lịch PT trên Mobile (`AdminRegisterPTScheduleScreen.js`) để vô hiệu hóa việc chọn ngày trong quá khứ từ UI.
  - **Chặn dời lịch PT trong quá khứ (Backend & Web Frontend)**:
    - **Backend**: Thêm logic validate ngày hiện tại trong API dời lịch tập `updateSchedule`.
    - **Web FE**: Cập nhật trang quản lý lịch tập PT (`pt-training.js`) — tự động gán thuộc tính `min` là ngày hôm nay cho input date sửa lịch tập, và bổ sung validate thông báo lỗi ở frontend nếu người dùng cố dời lịch về quá khứ.
- **Kết quả**: Thành công.

### [03/06/2026 14:20] — Sửa lỗi luồng đổi gói Gym và cải thiện UI chọn chi nhánh (Mobile)
- **Loại**: Sửa bug & Cải tiến UI (Mobile)
- **File**: `MobileApp/src/screens/admin/AdminRegisterPackageScreen.js`, `MobileApp/src/screens/admin/AdminDashboardScreen.js`
- **Mô tả**:
  - **[Sửa bug] Luồng đổi gói Gym bị nhầm thành đăng ký nối tiếp**:
    - Nguyên nhân: `startDate` được khởi tạo luôn = ngày nối tiếp sau gói cũ bất kể chế độ là "Đổi gói" hay "Đăng ký nối tiếp".
    - Sửa bằng cách tách ra hàm `calcStartDate(switchMode)`: khi `switchMode=true` (đổi gói) → ngày bắt đầu = hôm nay; khi `switchMode=false` (đăng ký nối tiếp) → ngày bắt đầu = ngày liền sau khi gói cũ hết hạn.
    - Khi bấm đổi giữa 2 chế độ, `startDate` cũng được cập nhật lại theo `calcStartDate`.
    - Đổi tên nút `"Đăng ký song song"` → `"Đăng ký nối tiếp"` cho đúng với hành vi thực tế.
  - **[Cải tiến UI] Bộ lọc chi nhánh trên Dashboard**:
    - Thay thế `ScrollView` chip pills nằm ngang bằng 1 nút gọn `[Icon + Tên chi nhánh đang chọn + Mũi tên]`.
    - Khi bấm vào nút → mở Modal danh sách chi nhánh dạng radio chọn (cuộn dọc), không cần kéo ngang nhiều lần.
- **Kết quả**: Thành công.

### [03/06/2026 13:35] — Ngăn chặn AI tự ý sửa số liệu và nghiêm cấm hiển thị SQL thô cho người dùng
- **Loại**: Sửa bug / Cải tiến (Backend)
- **File**: `BE/src/controllers/assistant.controller.js`
- **Mô tả**:
  - Tạo chỉ thị hệ thống chung `accuracyRules` quy định nghiêm ngặt về tính chính xác của số liệu.
  - Tích hợp `accuracyRules` vào cuối chỉ thị hệ thống (`systemInstruction`) của tất cả các phân hệ (Hội viên, PT, Admin/Lễ tân).
  - Yêu cầu AI tuyệt đối không tự ý thay đổi dữ liệu theo khẳng định chủ quan từ phía người dùng, coi Database là nguồn sự thật duy nhất, và bắt buộc phải thực hiện lại câu lệnh SQL qua `run_readonly_sql_query` để đối chiếu mỗi khi người dùng phản bác số liệu.
  - Nghiêm cấm AI xuất ra mã SQL thô, cấu trúc bảng hay giải thích câu truy vấn cho người dùng, yêu cầu bắt buộc phải chuyển hóa dữ liệu lấy được thành câu văn/đoạn văn tiếng Việt tự nhiên.
- **Kết quả**: Thành công.

### [03/06/2026 13:25] — Sửa lỗi query doanh thu & thống kê chi nhánh trong AI chatbot
- **Loại**: Sửa bug (Backend)
- **File**: `BE/src/controllers/assistant.controller.js`
- **Mô tả**:
  - Phát hiện 3 lỗi trong các query lọc theo chi nhánh cho Admin/Lễ tân:
    1. **Doanh thu gói tập thường**: Đã dùng sai `dang_ky_goi_tap.chi_nhanh_dang_ky` (NULL) và `gia_thuc_te`. Sửa thành JOIN `ho_so h ON h.id = dk.ho_so_id` + `h.chi_nhanh` + `dk.so_tien_da_thu` — đồng bộ với `revenue.controller.js`.
    2. **Gói tập đang hoạt động & Chờ duyệt**: Đã dùng sai `chi_nhanh_dang_ky`. Sửa thành JOIN `ho_so` + `h.chi_nhanh`.
    3. **`branchSQLNote` (hướng dẫn AI sinh SQL)**: Cập nhật hướng dẫn đúng — yêu cầu AI phải JOIN `ho_so` khi query `dang_ky_goi_tap`, dùng `so_tien_da_thu` cho doanh thu.
- **Kết quả**: Thành công.

### [03/06/2026 13:15] — Đồng bộ bộ lọc chi nhánh cho Chat AI (Web & Mobile)

- **Loại**: Cải tiến nghiệp vụ & Fullstack (Web + Mobile + Backend)
- **File**: `FE/assets/js/components/ai-assistant.js`, `MobileApp/src/components/AIAssistantBubble.js`, `MobileApp/src/screens/member/AIAssistantScreen.js`, `BE/src/controllers/assistant.controller.js`
- **Mô tả**:
  - **Web**: Thêm `chi_nhanh: window.GymApp?.selectedBranch` vào body request `/assistant/chat`.
  - **Mobile**: Import `selectedBranch` từ `useAuthStore` và gửi kèm request chat trong cả `AIAssistantBubble.js` và `AIAssistantScreen.js`.
  - **Backend**: Nhận `chi_nhanh`, tạo `branchFilter`. Tất cả query thống kê hôm nay (hội viên, gói tập, check-in, doanh thu, lịch PT, chờ duyệt) đều lọc theo chi nhánh. Thêm `branchSQLNote` vào `systemInstruction` để AI biết cách tự thêm WHERE khi gọi tool `run_readonly_sql_query`. Cập nhật `DB_SCHEMA_DESCRIPTION` mô tả các cột chi nhánh.
- **Kết quả**: Thành công.

### [03/06/2026 11:29] — Tự động điền chi nhánh mặc định khi đăng ký hội viên mới trên Web & Mobile

- **Loại**: Cải tiến nghiệp vụ & UI/UX (Fullstack Web & Mobile)
- **File**: `FE/assets/js/pages/member-add.js`, `MobileApp/src/screens/admin/AdminAddEditMemberScreen.js`
- **Mô tả**:
  - **Web**: Cập nhật hàm `init()` trong `member-add.js` để tự động gán giá trị mặc định của trường chọn chi nhánh (`#reg-chi-nhanh`) là chi nhánh đang chọn hiện tại (`window.GymApp.selectedBranch`). Vẫn cho phép người dùng thay đổi sang chi nhánh khác.
  - **Mobile**: Import store `useAuthStore` vào màn hình `AdminAddEditMemberScreen.js` và gán giá trị mặc định cho state `chiNhanh` là `selectedBranch` hiện tại từ Store khi tạo mới hồ sơ.
- **Kết quả**: Thành công.

### [03/06/2026 11:23] — Thiết kế lại bộ chọn chi nhánh ở Header Web từ Dropdown sang Modal
- **Loại**: Cải tiến giao diện UI/UX (Frontend Web)
- **File**: `FE/index.html`, `FE/assets/js/app.js`
- **Mô tả**:
  - **index.html**: Thay thế thẻ `<select>` dropdown cũ bằng nút bấm `#header-branch-trigger` đẹp mắt chứa logo cửa hàng và nhãn tên chi nhánh đang chọn. Bổ sung HTML cấu trúc Modal chọn chi nhánh `#modal-select-branch-header`.
  - **app.js**: Viết lại logic khởi tạo bộ lọc `_initBranchFilter` để hỗ trợ hiển thị Modal chọn chi nhánh với giao diện tích chọn checkmark trực quan. Tự động kiểm tra quyền hạn, nếu tài khoản nhân viên có chi nhánh cố định sẽ ẩn mũi tên dropdown và khóa chức năng đổi chi nhánh.
- **Kết quả**: Thành công.

### [03/06/2026 10:48] — Đồng bộ hiệu ứng hover đổi màu chuẩn xác cho toàn bộ dòng bao gồm cả các cột cố định (Sticky)
- **Loại**: Cải tiến UI/UX (Frontend Web)
- **File**: `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - Thêm hiệu ứng transition chuyển màu nền mượt mà cho `.sticky-col-left` và `.sticky-col-right` (`transition: background-color 0.15s ease-in-out`).
  - Sử dụng các mã màu đơn sắc (solid color) được pha trộn chuẩn xác để hover các cột cố định khớp hoàn toàn với màu hover của các cột trong suốt ở giữa:
    - Light Mode (Chẵn): `#f4faf5` (Trắng + 5% xanh thương hiệu)
    - Light Mode (Lẻ): `#eff5f0` (Xám `#fafafa` + 5% xanh thương hiệu)
    - Dark Mode (Chẵn): `#1e2a20`
    - Dark Mode (Lẻ): `#162320`
- **Kết quả**: Thành công.

### [03/06/2026 10:44] — Di chuyển gradient từ container sang scrollbar track để sửa dứt điểm lỗi lổm trắng ở cột sticky
- **Loại**: Cải tiến UI/UX & Sửa bug (Frontend Web)
- **File**: `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - Gỡ bỏ thuộc tính `background: linear-gradient` ở container `#members-scroll-container` và `#pt-scroll-container`.
  - Thay vào đó, áp dụng trực tiếp dải màu gradient cho `::-webkit-scrollbar-track` của 2 bảng: tô màu xanh lục (`#1D9336` / `#065f46`) ở phạm vi 40px đầu (khớp chiều cao thực tế của header) và trong suốt ở phần phía dưới.
  - Giải quyết triệt để lỗi khuyết màu trắng (lổm trắng) ở cột sticky trái/phải khi cuộn, do nền gradient của container không bị tràn xuống đè lên nền các dòng dữ liệu cố định nữa.
- **Kết quả**: Thành công.

### [03/06/2026 10:38] — Tùy biến scrollbar & tăng chiều cao gradient nền để sửa dứt điểm lỗi lổm trắng góc bảng
- **Loại**: Cải tiến UI/UX & Sửa bug (Frontend Web)
- **File**: `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - Tùy biến CSS scrollbar cho `#members-scroll-container` bằng cách làm cho track và corner của scrollbar trong suốt (`background: transparent !important`).
  - Tăng chiều cao của gradient màu xanh nền của container bảng từ `38px` lên `48px` để che phủ hoàn toàn chiều cao thực tế của header table (khoảng `40-42px`), ngăn chặn hoàn toàn việc lộ khoảng màu trắng ở góc dưới bên phải cột Thao tác.
- **Kết quả**: Thành công.

### [03/06/2026 10:33] — Tích hợp Infinite Scroll cho Nhật ký & Cố định cột Danh sách hội viên
- **Loại**: Cải tiến UI/UX & Sửa lỗi hiển thị (Frontend Web)
- **File**: `FE/assets/js/pages/audit-logs.js`, `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - Chuyển đổi cơ chế phân trang nút bấm truyền thống trên trang Nhật ký kiểm tra (`audit-logs.js`) sang cuộn vô hạn (infinite scroll) trên cả table (desktop) và card list (mobile).
  - Cố định cột Họ và tên (sticky left) và cột Thao tác (sticky right) khi cuộn ngang trên trang Danh sách hội viên (`members-list.js`). Đồng bộ màu nền dòng chẵn/lẻ (cho cả Light/Dark Mode) của các cột cố định này để giải quyết triệt để lỗi "lổm" màu do thanh scrollbar đè lên.
- **Kết quả**: Thành công.

### [03/06/2026 10:28] — Sửa lỗi SQL khi so sánh doanh thu các tháng theo chi nhánh
- **Loại**: Sửa bug (Backend)
- **File**: `BE/src/controllers/revenue.controller.js`
- **Mô tả**: Sửa lỗi `no such column: h.chi_nhanh` xảy ra khi gọi API so sánh doanh thu các tháng `/revenue/compare-months` có lọc theo chi nhánh bằng cách thêm `JOIN ho_so h ON h.id = dk.ho_so_id` trong truy vấn SQL gói tập bán chạy `packageStats`.
- **Kết quả**: Thành công.

### [03/06/2026 10:00] — Đồng bộ hoàn toàn bộ lọc chi nhánh thống kê gói Gym từ Backend
- **Loại**: Sửa bug & Tối ưu hóa API (Fullstack)
- **File**: `BE/src/controllers/revenue.controller.js`
- **Mô tả**:
  - Khắc phục triệt để lỗi không hiển thị dữ liệu "Gói tập bán chạy" và doanh thu gói Gym khi chuyển sang lọc theo một chi nhánh cụ thể trên trang Báo cáo doanh thu (chỉ hiện khi chọn Tất cả chi nhánh).
  - Thay thế toàn bộ logic lọc `dk.chi_nhanh_dang_ky` cũ trong các hàm `getRevenueToday`, `getRevenueYesterday`, `getDashboard` và `getCompareMonths` của `revenue.controller.js` bằng cách `JOIN ho_so h ON h.id = dk.ho_so_id` và lọc theo chi nhánh của hội viên `h.chi_nhanh = ?`.
  - Đồng bộ hóa dữ liệu lọc chính xác giữa hệ thống Web và Mobile App.
- **Kết quả**: Thành công.

### [03/06/2026 09:30] — Tự động đăng ký gói Gym & PT và gán chi nhánh mẫu cho hội viên chưa có gói
- **Loại**: Cập nhật cơ sở dữ liệu & Nghiệp vụ backend
- **File**: `BE/src/config/db.js`, `BE/src/routes/members.routes.js`
- **Mô tả**:
  - Gán chi nhánh ngẫu nhiên dựa trên danh sách chi nhánh chuẩn trong file `branches.json` cho các hội viên chưa được gán chi nhánh.
  - Tự động đăng ký gói Gym và gói PT mẫu đang hoạt động cho toàn bộ hội viên hiện tại chưa có gói để phục vụ kiểm thử bộ lọc chi nhánh.
  - Dọn dẹp sạch sẽ các câu lệnh và endpoint đăng ký tạm thời sau khi cập nhật thành công để bảo mật hệ thống.
- **Kết quả**: Thành công.

### [03/06/2026 09:03] — Đồng bộ bộ lọc chi nhánh chung & Bổ sung cột chi nhánh
- **Loại**: Cải tiến tính năng & Sửa bug (Frontend Web)
- **File**: `FE/assets/js/pages/checkin.js`, `FE/assets/js/pages/members-list.js`, `FE/assets/js/pages/pt-training.js`, `FE/assets/js/pages/expired.js`
- **Mô tả**:
  - **Sửa checkin.js**: Khắc phục lỗi gọi sai hàm phân trang `window.GymApp.pagination` thành `window.GymApp.renderPagination`, giúp trang hoạt động bình thường, các nút bấm click được bình thường.
  - **Lọc hội viên & PT**: Tích hợp bộ lọc chi nhánh chung `window.GymApp.selectedBranch` vào trang Danh sách hội viên (`members-list.js`) và trang Lịch đào tạo PT (`pt-training.js`) để tự động lọc dữ liệu cục bộ và thống kê khi đổi chi nhánh ở Header.
  - **Trang hết hạn**: Tích hợp lọc theo chi nhánh chung. Bổ sung cột hiển thị **Chi nhánh** cho cả hai bảng "Hội viên hết hạn" và "Sắp hết hạn" để dễ quản lý cơ sở nguồn của khách hàng.
- **Kết quả**: Thành công.

### [03/06/2026 08:56] — Sửa lỗi cú pháp checkin.js
- **Loại**: Sửa bug (Frontend Web)
- **File**: `FE/assets/js/pages/checkin.js`
- **Mô tả**: Sửa lỗi `Uncaught SyntaxError: Unexpected token 'class'` do mã nguồn bị ghi đè trùng lặp và truncated. Khôi phục hoàn toàn cấu trúc SPA Vanilla JS sạch cho trang check-in.
- **Kết quả**: Thành công.

### [02/06/2026 14:53] — Khắc phục lỗi kẹt màn hình loading vô hạn khi khởi động Web
- **Loại**: Sửa bug (Frontend Web)
- **File**: `FE/index.html`, `FE/assets/js/app.js`
- **Mô tả**:
  - **Khắc phục xung đột CSS**: Loại bỏ hoàn toàn lớp `hidden` của Tailwind CSS khỏi `#modal-select-branch-startup` trong `index.html` và thay thế bằng `style="display: none;"`. Điều này ngăn chặn việc lớp `hidden` (với thuộc tính `!important` từ Tailwind CDN) chặn đứng hiển thị của modal.
  - **Tối ưu hóa mã JavaScript**: Chỉnh sửa hàm `_showStartupBranchModal()` trong `app.js` để chỉ điều khiển hiển thị modal trực tiếp bằng `style.display = 'flex'` và ẩn bằng `style.display = 'none'`, gỡ bỏ các thao tác thừa với `classList.remove('hidden')` / `classList.add('hidden')`.
  - **Khắc phục lỗi kẹt luồng (Await block)**: Đảm bảo Modal chọn chi nhánh hiển thị bình thường khi người dùng là quản trị viên/lễ tân đăng nhập lần đầu, cho phép nhấp chọn chi nhánh để tiếp tục chạy các tiến trình API và chuyển hướng về trang Dashboard.
- **Kết quả**: Thành công.

### [02/06/2026 14:41] — Sửa lỗi Database và Tích hợp Modal Chọn Chi Nhánh khi Đăng nhập
- **Loại**: Sửa bug & Thêm tính năng mới (Fullstack)
- **File**: `BE/src/config/db.js`, `FE/index.html`, `FE/assets/js/app.js`, `FE/assets/js/pages/dashboard.js`, `FE/assets/js/pages/revenue.js`
- **Mô tả**:
  - **Sửa lỗi Database**: Sửa lỗi xung đột merge conflict cú pháp SQLite trong `db.js`. Tích hợp kiểm tra tự động rebuild view `v_trang_thai_hoi_vien` nếu thiếu cột `chi_nhanh` lúc khởi chạy backend.
  - **Giao diện Modal Chọn Chi Nhánh**: Thiết kế HTML/CSS Modal chọn chi nhánh dạng Glassmorphism hiển thị chặn màn hình khi Admin đăng nhập vào trang chủ mà chưa chọn chi nhánh quản lý.
  - **Logic Đồng bộ phiên**: Tải các chi nhánh động từ `branches.json`. Lưu chi nhánh được chọn vào `sessionStorage` để đồng bộ lọc thông tin cho Dashboard và Doanh thu. Tự động áp dụng chi nhánh cố định cho tài khoản nhân viên cơ sở.
- **Kết quả**: Thành công.

### [02/06/2026 14:32] — Quản lý Đa Chi Nhánh đồng bộ Web & Mobile và sửa lỗi API Backend
- **Loại**: Cải tiến tính năng & Sửa bug (Fullstack)
- **File**: `BE/src/controllers/revenue.controller.js`, `FE/assets/js/pages/dashboard.js`, `FE/assets/js/pages/revenue.js`, `MobileApp/src/screens/admin/AdminDashboardScreen.js`, `MobileApp/src/screens/admin/AdminRevenueScreen.js`
- **Mô tả**:
  - **Sửa lỗi Backend**: Khắc phục lỗi `maxDay is not defined` ở API `getRevenue` của backend bằng cách tính và định nghĩa đúng số ngày lớn nhất của tháng hiện tại và tháng trước trước khi dựng mảng so sánh `monthComparison`.
  - **Lọc chi nhánh Web**: Bổ sung dropdown lọc chi nhánh nạp từ `branches.json` ở giao diện chính Dashboard (`dashboard.js`) và Báo cáo Doanh thu (`revenue.js`), gửi tham số `chi_nhanh` tương ứng lên API Backend.
  - **Lọc chi nhánh Mobile**: Tải danh sách chi nhánh và bổ sung thanh cuộn ngang chọn chi nhánh ở đầu màn hình Admin Dashboard (`AdminDashboardScreen.js`) và Admin Revenue (`AdminRevenueScreen.js`), lọc dữ liệu thống kê doanh thu và check-in thời gian thực theo cơ sở.
- **Kết quả**: Thành công.

### [02/06/2026 13:50] — Thiết kế lại Logo Paradise GYM và Tối ưu hóa bộ chọn giờ đặt lịch PT
- **Loại**: Cải tiến giao diện UI/UX & logic ứng dụng (Fullstack)
- **File**: `FE/index.html`, `FE/pt-portal.html`, `FE/member-portal.html`, `FE/login.html`, `FE/assets/js/pages/pt-register.js`
- **Mô tả**:
  - **Thiết kế lại Logo**: Cập nhật chữ `P` viết hoa trực tiếp vào SVG text logo của Paradise GYM ở cả 4 file HTML (`index.html` ở cả sidebar và loading screen, `pt-portal.html`, `member-portal.html`, `login.html` ở cả 2 bản trắng và xanh) để đồng điệu với các ký tự còn lại và giúp chữ đứng xích lại gần hơn, giữ nguyên logo lục giác làm biểu tượng thuần túy.
  - **Tối ưu bộ chọn giờ**: Cập nhật file `pt-register.js` để tự động ẩn khung chọn giờ (time picker container) ngay khi người dùng chọn xong giờ bắt đầu. Thêm nút xóa (x) bên cạnh giờ hiển thị; khi người dùng nhấp vào nút này hoặc sau khi đặt lịch tập thành công, giờ được reset và khung chọn giờ sẽ xuất hiện trở lại.
- **Kết quả**: Thành công.

### [02/06/2026 11:46] — Sửa lỗi trùng tên đăng nhập khi Import Excel lại sau khi xóa hội viên
- **Loại**: Sửa bug (Backend)
- **File**: `BE/src/controllers/members.controller.js`
- **Mô tả**: Thay đổi hành vi xóa hội viên trong hàm `deleteMember`. Khi xóa hồ sơ hội viên (`is_deleted = 1`), hệ thống sẽ thực hiện xóa tài khoản liên kết trong bảng `tai_khoan` (thay vì chỉ khóa `trang_thai = 'khoa'`). Việc này giúp giải phóng hoàn toàn Số điện thoại / Tên đăng nhập của tài khoản đó, cho phép import lại file Excel chứa các số điện thoại này mà không bị lỗi trùng lặp `ten_dang_nhap`.
- **Kết quả**: Thành công.

### [02/06/2026 11:39] — Khắc phục lỗi CHECK constraint gioi_tinh khi Import Excel
- **Loại**: Sửa bug (Backend)
- **File**: `BE/src/controllers/members.controller.js`
- **Mô tả**: Sửa lỗi `CHECK constraint failed: gioi_tinh IN ('nam','nu','khac')` khi import file Excel. Chuẩn hóa giới tính đầu vào thành chữ thường `'nam'`, `'nu'`, `'khac'` theo đúng ràng buộc CHECK constraint của SQLite (trước đó đang lưu `'Nam'`, `'Nữ'`). Mặc định gán `'nam'` nếu trường dữ liệu trống.
- **Kết quả**: Thành công.

### [02/06/2026 11:15] — Khắc phục lỗi khoảng trắng bảng và tích hợp tính năng Import Excel động cho Hội viên
- **Loại**: Cải tiến giao diện & Tính năng mới (Fullstack)
- **File**: `FE/assets/js/pages/members-list.js`, `BE/src/middlewares/upload.js`, `BE/src/controllers/members.controller.js`, `BE/src/routes/members.routes.js`
- **Mô tả**:
  - **Sửa lỗi khoảng trắng bảng**: Gỡ bỏ thuộc tính bo góc mặc định (`border-radius: 0 !important;`) cho tất cả các ô `th` ở thead. Áp dụng kỹ thuật CSS background linear-gradient cho các container chứa table cuộn (`#members-scroll-container` và `#pt-scroll-container`), tô màu xanh thương hiệu tiệp màu ở phần header (độ cao 38px) giúp che đi khoảng trắng dọc do scrollbar xuất hiện ở phía bên phải cột Thao tác.
  - **Import Excel động**:
    - **Backend**: Xây dựng middleware `uploadExcel` để chấp nhận upload file `.xlsx`, `.xls`, `.csv`. Viết API `POST /api/members/import` sử dụng thư viện `xlsx` để phân tích dữ liệu động, tích hợp SQLite Transaction giúp thực thi hàng trăm bản ghi cực nhanh (<0.3s) và an toàn (tự động rollback nếu có dòng lỗi). Sinh mật khẩu hash mặc định (`123456`) ngoài vòng lặp để tránh nghẽn CPU và tự động tạo tài khoản đăng nhập cho hội viên.
    - **Frontend**: Thêm nút "Nhập Excel" vào tab Hội viên. Thiết kế Modal kéo thả upload file trực quan. Tích hợp nạp động thư viện `xlsx` từ CDN khi tải trang để cho phép tự động sinh và tải xuống file template Excel mẫu có dữ liệu ví dụ. Hiển thị báo cáo kết quả chi tiết kèm bảng thống kê các dòng bị lỗi để admin dễ dàng điều chỉnh.
- **Kết quả**: Thành công.

### [02/06/2026 10:52] — Sửa lỗi cú pháp pt-register.js và chuyển đổi Infinite Scroll kết nối trực tiếp API Database
- **Loại**: Sửa bug & Cải tiến tính năng (Fullstack)
- **File**: `FE/assets/js/pages/pt-register.js`, `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - **pt-register.js**: Định nghĩa chính xác hàm `validateTimeOptions` (khắc phục hoàn toàn lỗi `Uncaught SyntaxError: Unexpected token ';'`) và khai báo biến `totalBookings` trong hàm `render` để tránh lỗi `ReferenceError`.
  - **members-list.js**: Nâng cấp lưới cuộn vô hạn (Infinite Scroll) của Hội viên kết nối trực tiếp với Database API của Backend (`/members?page=X&limit=20`) thay vì phân trang tĩnh trên client. Tích hợp bộ lọc online, tìm kiếm online kèm debounce (300ms) để tối ưu số lượng request lên SQLite.
- **Kết quả**: Thành công.

### [02/06/2026 10:10] — Tích hợp hiển thị Đánh giá & Nhận xét của hội viên dành cho PT
- **Loại**: Tính năng mới (Fullstack)
- **File**: `BE/src/controllers/trainers.controller.js`, `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - **Backend**: Cập nhật API `getTrainerById` thực hiện truy vấn thêm danh sách đánh giá từ bảng `danh_gia_pt` (kèm theo các tiêu chí, tags, số sao, nội dung ghi chú và thông tin hội viên như avatar, họ tên).
  - **Frontend**: Bổ sung tab **"Đánh giá"** (Reviews) vào Modal chi tiết PT. Thiết kế UI hiển thị danh sách nhận xét đẹp mắt, trực quan bao gồm: số sao rating dạng sao vàng, ngày tạo, avatar và họ tên hội viên, nội dung text note phản hồi và các thẻ tags tiêu chí.
- **Kết quả**: Thành công.

### [02/06/2026 09:46] — Loại bỏ yêu cầu PayOS chưa thanh toán (PENDING) khỏi danh sách duyệt thủ công
- **Loại**: Sửa bug (Backend)
- **File**: `BE/src/controllers/members.controller.js`, `BE/src/controllers/revenue.controller.js`
- **Mô tả**:
  - Tại `getPackageRequests` (lấy danh sách yêu cầu gia hạn): Cập nhật điều kiện WHERE thay thế `(dk.payos_status IS NULL OR dk.payos_status = 'PENDING')` bằng `dk.payos_status IS NULL` để lọc bỏ các yêu cầu thanh toán qua PayOS đang ở trạng thái PENDING.
  - Tại `getDashboard` (thống kê Dashboard): Đồng bộ hóa điều kiện đếm `stats.yeu_cau_cho_duyet` tương tự để tránh thống kê các giao dịch chuyển khoản chưa hoàn tất.
  - Khắc phục lỗ hổng logic cho phép lễ tân/admin duyệt khống các gói tập chưa được thanh toán thành công qua PayOS.
- **Kết quả**: Thành công.

### [02/06/2026 09:36] — Đồng bộ logic đếm trạng thái hội viên giữa Dashboard và Danh sách hội viên
- **Loại**: Sửa bug (Fullstack)
- **File**: `BE/src/config/db.js`
- **Mô tả**:
  - Cập nhật hàm `recreateMemberStatusView()` thay đổi logic cột `trang_thai_mau` để kiểm tra các gói tập đã hết hạn (`trang_thai = 'het_han'`) hoặc gói PT đã hoàn thành (`hoan_thanh`, `het_han`) trước khi gắn nhãn hội viên là `chua_dang_ky`.
  - Tự động gọi `recreateMemberStatusView()` khi khởi động Backend để đảm bảo View SQLite luôn được đồng bộ và cập nhật logic mới nhất.
  - Khắc phục triệt để lỗi thống kê lệch số lượng hội viên Chưa đăng ký hiển thị trên biểu đồ tròn Dashboard (giảm từ 3 xuống 2, khớp hoàn toàn với kết quả lọc ở trang danh sách).
- **Kết quả**: Thành công.

### [01/06/2026 17:09] — Sửa đổi định dạng payload Gemini (snake_case) & Thay đổi model Groq fallback
- **Loại**: Sửa bug (Backend)
- **File**: `BE/src/controllers/assistant.controller.js`
- **Mô tả**:
  - Đổi các trường payload Gemini REST API v1 về định dạng `snake_case` (`system_instruction`, `generation_config`, `tools`, `function_declarations`) theo đúng đặc tả API chính thức thay vì camelCase.
  - Thay đổi Groq fallback model cũ (`mixtral-8x7b-32768`) đã bị ngừng hoạt động thành `llama-3.1-8b-instant` để tránh lỗi 400 từ Groq.
- **Kết quả**: Thành công.

### [01/06/2026 17:08] — Cập nhật phiên bản API Gemini sang v1
- **Loại**: Sửa bug (Backend)
- **File**: `BE/src/controllers/assistant.controller.js`
- **Mô tả**: Sửa lỗi 404 NOT_FOUND của Gemini bằng cách đổi endpoint từ `/v1beta/` sang `/v1/` để gọi model `gemini-1.5-flash` chính thức.
- **Kết quả**: Thành công.

### [01/06/2026 17:07] — Sửa lỗi 502 Bad Gateway và chuẩn hóa payload API Gemini
- **Loại**: Sửa bug (Backend)
- **File**: `BE/src/controllers/assistant.controller.js`
- **Mô tả**:
  - Khắc phục lỗi 502 Bad Gateway do payload gửi tới Gemini bị từ chối (400 Bad Request) làm tất cả các model đều bị sập.
  - Chuẩn hóa các trường snake_case thành camelCase cho API Gemini: `systemInstruction`, `generationConfig`, `functionDeclarations`.
  - Viết hàm `toGeminiSchema()` tự động convert kiểu dữ liệu của OpenAPI parameters thành chữ hoa (`OBJECT`, `STRING`) theo đúng đặc tả của Gemini.
  - Thay đổi `role` từ `'user'` thành `'function'` khi gửi kết quả thực thi tool (SQL SELECT) về cho Gemini.
  - Cải tiến log lỗi ghi rõ exception stack trace giúp dev dễ debug lỗi API Key từ Groq hoặc Gemini.
- **Kết quả**: Thành công — chatbot tự động fallback trơn tru sang Gemini khi Groq gặp sự cố.

### [01/06/2026 16:56] — Tích hợp Gemini API làm fallback cho AI Chatbot
- **Loại**: Tính năng mới (Backend)
- **File**: `BE/.env`, `BE/src/controllers/assistant.controller.js`
- **Mô tả**:
  - Thêm `GEMINI_API_KEY` vào file `.env`
  - Thêm hàm `callGeminiWithTools()` gọi Gemini 1.5 Flash API với function calling (format khác hoàn toàn với Groq/OpenAI — dùng `generateContent`, `functionCall`/`functionResponse`)
  - Triển khai **3 tầng fallback** cho AI:
    1. **Groq với tool calling** (llama-3.3-70b-versatile, llama-3.1-8b-instant, llama3-8b-8192)
    2. **Groq không tool** (mixtral-8x7b-32768) — khi tool models thất bại
    3. **Gemini 1.5 Flash** — khi tất cả Groq thất bại/hết quota
  - Gemini fallback cũng hỗ trợ đầy đủ function calling (SQL tool) giống Groq
  - Thông báo lỗi cuối được cải thiện thành "Dịch vụ AI tạm thời không khả dụng" thay vì chỉ đề cập Groq
- **Kết quả**: Thành công — AI sẽ tự động luân phiên giữa Groq và Gemini


- **Loại**: Tính năng mới (Backend)
- **File**: `BE/src/controllers/assistant.controller.js`
- **Mô tả**:
  - Viết lại hoàn toàn `assistant.controller.js` để tích hợp **Groq Function Calling**.
  - Định nghĩa tool `run_readonly_sql_query` cho phép AI tự động viết và thực thi câu lệnh `SELECT` để trả lời câu hỏi về dữ liệu lịch sử (doanh thu, check-in, lịch tập, hội viên...).
  - Cung cấp toàn bộ **DB Schema** trong mô tả tool để AI hiểu cấu trúc bảng.
  - Triển khai **bảo mật nhiều lớp**:
    - Chỉ cho phép câu lệnh bắt đầu bằng `SELECT`
    - Chặn từ khóa nguy hiểm (INSERT, UPDATE, DELETE, DROP, ALTER...)
    - Hội viên và PT chỉ truy vấn được dữ liệu cá nhân của mình (lọc theo `id`)
    - Bảng `tai_khoan` (chứa password hash) chỉ Admin/Lễ tân mới truy vấn được
    - Tự động thêm `LIMIT 200` nếu query chưa có LIMIT
  - Triển khai **conversation loop 3 bước**: gửi message → AI gọi tool → thực thi SQL → AI tổng hợp trả lời
  - Giữ nguyên cơ chế fallback models (danh sách models ưu tiên tool calling, sau đó fallback không tool)
- **Kết quả**: Thành công — AI có thể trả lời câu hỏi về mọi dữ liệu lịch sử trong DB

### [01/06/2026 15:19] — Tráo đổi vị trí các card Dashboard tối ưu không gian hiển thị
- **Loại**: Cải tiến giao diện UI/UX (Frontend Web)
- **File**: `FE/assets/js/pages/dashboard.js`
- **Mô tả**:
  1. **Đổi chỗ các card hàng 2 và 3**:
     - Đưa "Hội viên chăm chỉ nhất" và "Check-in gần nhất" lên Hàng 2 (cùng hàng Peak Hours) với chiều cao vừa phải (`min-height: 250px`).
     - Chuyển "Doanh thu gói tập" và "Doanh thu gói PT" xuống Hàng 3 (cùng hàng Hoạt động gần đây) vì các widget doanh thu chứa nhiều dữ liệu gói cần nhiều không gian hiển thị dọc hơn.
  2. **Tăng kích thước hiển thị Doanh thu & Thay đổi bố cục**:
     - Tăng chiều cao của Hàng 3 lên `min-height: 350px`.
     - Thay đổi bố cục của 2 card doanh thu từ hàng ngang (biểu đồ trái, chú thích phải) thành **hàng dọc** (biểu đồ rộng 100% nằm ở trên, danh sách chú thích các gói có scrollbar nằm ở dưới). Chiều cao tối đa cuộn của phần chú thích được đặt là `130px`.
- **Kết quả**: Thành công 100% — Giao diện 2 card doanh thu cực kỳ trực quan, tận dụng tốt chiều rộng của card để vẽ biểu đồ và có nhiều chỗ để hiển thị tên các gói tập.

### [01/06/2026 14:52] — Nâng cấp Dashboard với KPI PT, doanh thu gói PT và biểu đồ giờ check-in cao điểm (Peak Hours)
- **Loại**: Cải tiến tính năng & UI/UX (Fullstack)
- **File**: `BE/src/controllers/revenue.controller.js`, `FE/assets/js/pages/dashboard.js`
- **Mô tả**:
  1. **Bổ sung KPI Card PT**: Thêm card "Buổi PT đã dạy" thể hiện số buổi PT dạy thực tế trên tổng số lịch hẹn hôm nay. Thiết kế responsive grid 5 cột thích ứng linh hoạt trên Mobile (1 cột), Tablet (3 cột), và Desktop (5 cột).
  2. **Bổ sung Biểu đồ Doanh thu gói PT**: Thêm API thống kê và cấu hình vẽ biểu đồ cột doanh thu theo từng loại gói PT (`chart-packages-pt-bar`), sử dụng tông màu tím hài hòa để phân biệt với gói tập thường.
  3. **Bổ sung Biểu đồ Peak Hours**: Thêm API tổng hợp dữ liệu check-in theo giờ trong 30 ngày qua và vẽ biểu đồ tần suất check-in theo giờ (`chart-peak-hours`) từ 6h - 22h để theo dõi giờ cao điểm phòng tập.
  4. **Sửa lỗi cú pháp phát sinh**: Khắc phục lỗi thiếu đóng câu lệnh `.all(currentMonthStart)` ở query `stats.top_hoi_vien` trong `revenue.controller.js` do tác vụ gộp trước đó làm mất.
- **Kết quả**: Thành công 100% — Giao diện Dashboard cực kỳ cao cấp, đầy đủ thông tin hữu ích và server hoạt động trơn tru.

### [01/06/2026 14:10] — Việt hóa tháng và đổi hiển thị doanh thu theo triệu đồng trên biểu đồ Dashboard
- **Loại**: Cải tiến giao diện & UI/UX (Frontend Web)
- **File**: `FE/assets/js/pages/dashboard.js`
- **Mô tả**:
  1. Việt hóa chú thích trục X của biểu đồ Doanh thu theo tháng từ tiếng Anh sang tiếng Việt (`'Thg 1'`, `'Thg 2'`, ..., `'Thg 12'`).
  2. Sửa định dạng số tiền trên trục Y từ dạng `'k'` (hàng nghìn) sang `'tr'` (triệu đồng) khớp với giá trị hiển thị thực tế (ví dụ: `5 tr`, `10 tr`, ...).
  3. Sửa định dạng tooltip khi hover vào các điểm dữ liệu hiển thị rõ ràng bằng tiếng Việt và đơn vị triệu đồng (ví dụ: `"Doanh thu: 15 triệu"`).
- **Kết quả**: Thành công — Biểu đồ Dashboard tổng quan chuyên nghiệp, rõ ràng và đúng chuẩn ngôn ngữ tiếng Việt.

### [01/06/2026 11:46] — Sửa lỗi 500 khi đánh giá lịch tập PT (no such table: lich_tap_old_broken)
- **Loại**: Sửa bug (Backend - Database Migration)
- **File**: `BE/src/config/db.js`
- **Mô tả**: 
  1. **Nguyên nhân**: Migration v20 đã rename bảng `lich_tap → lich_tap_old_broken` để tái cấu trúc. SQLite tự động cập nhật FK trong bảng `danh_gia_pt` để trỏ vào `lich_tap_old_broken`. Sau khi bảng backup bị DROP, `danh_gia_pt` còn FK trỏ vào bảng không tồn tại → lỗi 500 khi INSERT/SELECT đánh giá PT.
  2. **Giải pháp**: Thêm Migration v21 với 2 cơ chế phát hiện lỗi (kiểm tra schema text + PRAGMA foreign_key_list). Khi phát hiện FK hỏng, tái tạo hoàn toàn bảng `danh_gia_pt` với FK đúng, giữ nguyên dữ liệu hiện có.
  3. **Dọn dẹp**: Xóa toàn bộ code debug tạm thời đã thêm vào `BE/index.js`.
- **Kết quả**: Thành công — Server tự động chạy Migration v21 khi khởi động, sửa lỗi không cần can thiệp thủ công.

### [01/06/2026 11:25] — Đồng bộ bộ chọn thời lượng và tự động tính giờ kết thúc lịch tập PT trên di động
- **Loại**: Cải tiến tính năng & Đồng bộ di động (Mobile)
- **File**: `MobileApp/src/screens/admin/AdminRegisterPTScheduleScreen.js`
- **Mô tả**:
  1. Thay thế bộ chọn giờ kết thúc thủ công (`TimePickerModal` cũ) bằng bộ chọn thời lượng buổi tập `DurationPickerModal` có 4 khung giờ: 30 phút, 1 giờ, 1 giờ 30 phút, và 2 giờ.
  2. Trường "Giờ kết thúc" được chuyển thành dạng readonly và tự động cập nhật chính xác dựa trên giờ bắt đầu và thời lượng đã chọn.
  3. Dọn dẹp sạch sẽ các hàm, biến và state cũ không còn sử dụng (`showEndPicker`, `isEndTimeSlotDisabled`, `validEndTimes`, `END_TIMES`).
- **Kết quả**: Thành công — Màn hình đặt lịch tập PT hoạt động nhất quán, mượt mà và đồng bộ hoàn hảo với logic trên Web Frontend.

### [01/06/2026 11:18] — Sửa lỗi block cử chỉ cuộn (scrolling) của FlatList giờ tập trên Mobile
- **Loại**: Sửa bug (Mobile)
- **File**: `MobileApp/src/screens/admin/AdminRegisterPTScheduleScreen.js`, `MobileApp/src/screens/pt/PTScheduleScreen.js`
- **Mô tả**: Tách biệt phông nền TouchableOpacity overlay ra khỏi Modal Content chính bằng cách dùng absolute position ở phía sau. Nhờ vậy, FlatList chứa danh sách giờ tập bên trong Modal không bị chặn cử chỉ chạm và có thể cuộn xuống bình thường để chọn các giờ muộn hơn.
- **Kết quả**: Thành công — Khắc phục triệt để lỗi không kéo được danh sách giờ.

### [01/06/2026 11:15] — Redesign giao diện đặt lịch PT và lọc giờ trùng, giờ quá khứ trên Mobile
- **Loại**: Cải tiến tính năng & UI/UX (Mobile)
- **File**: `MobileApp/src/screens/admin/AdminRegisterPTScheduleScreen.js`, `MobileApp/src/screens/pt/PTScheduleScreen.js`
- **Mô tả**:
  1. **Admin đặt lịch PT**: Thay thế trường nhập ngày tập bằng bàn phím thành bộ chọn ngày `DatePickerField`. Tích hợp fetch API danh sách lịch dạy của PT trong ngày được chọn để so sánh trùng lịch. Vô hiệu hóa (xám, gạch ngang) các giờ trong quá khứ của ngày hôm nay và các khung giờ trùng với lịch dạy của PT.
  2. **PT tự đặt lịch**: Thay thế 2 input nhập giờ bắt đầu/kết thúc dạng gõ tay bằng component chọn giờ dạng Modal `TimeSelector` & `TimePickerModal` đồng bộ với Admin. Tự động kiểm tra trùng giờ dựa theo danh sách schedules đã có trong ngày để tô xám và chặn không cho chọn giờ đã bận.
- **Kết quả**: Thành công 100% — Tránh hoàn toàn việc Admin/PT tự gõ ngày sai định dạng và ngăn chặn 100% tình trạng đặt trùng lịch PT trên ứng dụng Mobile.

### [01/06/2026 11:00] — Hoàn thiện tính năng Đổi gói PT (khấu trừ tiền cũ & tính chênh lệch thu chi) trên Mobile
- **Loại**: Cải tiến tính năng & Đồng bộ Mobile
- **File**: `MobileApp/src/screens/admin/AdminRegisterPTScreen.js`
- **Mô tả**:
  1. **Tự động tính tiền hoàn**: Tính toán số tiền khấu trừ/hoàn trả của gói PT cũ dựa trên tỷ lệ số buổi chưa học thực tế (`Math.round(giaThucTeCu * buoiCon / tongBuoi)`) và điền tự động vào ô "Khấu trừ gói cũ (đ)" cho phép chỉnh sửa.
  2. **Tính toán chênh lệch đóng thêm / hoàn trả**: Hiển thị thẻ chênh lệch động màu xanh lá với nhãn "Tiền đóng thêm (đ)" khi nâng cấp, hoặc màu đỏ với nhãn "Tiền hoàn trả khách (đ)" khi hạ cấp tương tự luồng đổi gói Gym.
  3. **Truyền số tiền hoàn chính xác**: Đồng bộ logic gửi API hủy gói PT cũ, truyền đúng số tiền khấu trừ thực tế (`so_tien_hoan`) thay vì giá trị cứng của toàn bộ gói cũ.
- **Kết quả**: Thành công 100% — Luồng đổi gói PT hoạt động hoàn toàn tương thích và đồng bộ với luồng đổi gói Gym.

### [01/06/2026 10:52] — Đồng bộ luồng "Đổi gói PT" và "Gia hạn nối tiếp" trên Mobile App Admin
- **Loại**: Cải tiến giao diện UI/UX & Đồng bộ Mobile
- **File**: `MobileApp/src/screens/admin/AdminRegisterPTScreen.js`
- **Mô tả**: Mở khóa giao diện cho phép Quản trị viên lựa chọn giữa hai hình thức đăng ký khi hội viên đang có gói PT hoạt động (đồng bộ hoàn hảo với luồng đổi gói Gym):
  1. **Nối tiếp sau gói hiện tại**: Ngày bắt đầu tự động tính bằng `den_ngay` của gói cũ + 1 ngày (trạng thái `cho_kich_hoat`).
  2. **Đổi gói PT**: Hủy gói PT cũ ngay lập tức để kích hoạt gói mới ngay hôm nay, tự động tính trừ số tiền hoàn trả của số buổi chưa tập của gói cũ vào giá thực tế gói mới.
- **Kết quả**: Giao diện hiển thị trực quan và cho phép bấm chọn linh hoạt thay vì bị khóa cứng nối tiếp như trước.

### [01/06/2026 10:28] — Sửa lỗi kích hoạt đồng thời 2 gói tập và trùng lặp yêu cầu gia hạn
- **Loại**: Sửa bug (Backend)
- **File**: `BE/src/controllers/members.controller.js`
- **Mô tả**:
  1. **Kích hoạt nối tiếp gói tập**: Cập nhật hàm `registerPackage` (khi Admin đăng ký gói trực tiếp) tự động kiểm tra xem hội viên có gói tập nào đang hoạt động (`dang_hoat_dong`) hay không. Nếu có, dịch chuyển ngày bắt đầu `tu_ngay` của gói tập mới thành ngày tiếp theo sau ngày kết thúc gói cũ (nối tiếp) và đặt trạng thái là `cho_kich_hoat` thay vì kích hoạt ngay lập tức.
  2. **Hủy yêu cầu trùng lặp**:
     - Khi Admin đăng ký trực tiếp (`registerPackage`), tự động hủy toàn bộ các yêu cầu gia hạn đang ở trạng thái `cho_duyet` của hội viên đó.
     - Khi Admin duyệt yêu cầu gia hạn (`approvePackageRequest`), tự động hủy các yêu cầu gia hạn khác đang ở trạng thái `cho_duyet` của cùng hội viên này để tránh duyệt trùng gây tăng khống doanh thu và gói tập hoạt động song song.
- **Kết quả**: Thành công — Đồng bộ luồng logic chuẩn xác giữa Web và Mobile.

### [01/06/2026 10:20] — Phân trang danh sách giao dịch và gói tập trên ứng dụng Mobile
- **Loại**: Cải tiến tính năng (Mobile)
- **File**: `MobileApp/src/screens/admin/AdminRevenueScreen.js`
- **Mô tả**: Thiết lập phân trang trực tiếp cho các phần hiển thị dữ liệu lớn trên màn hình Doanh thu Mobile:
  1. **Danh sách giao dịch**: Phân trang tối đa 10 giao dịch trên mỗi trang. Thêm thanh điều khiển gồm trang hiện tại, tổng số trang, tổng số giao dịch và các nút "Trước"/"Sau".
  2. **Gói tập bán chạy**: Phân trang tối đa 5 gói tập trên mỗi trang ở cả chế độ so sánh doanh thu và thống kê thông thường. Thêm các nút điều khiển chuyển trang trước/sau gọn gàng.
- **Kết quả**: Thành công.

### [01/06/2026 10:15] — Redesign bộ chọn lịch tháng so sánh doanh thu trên Web và Mobile
- **Loại**: Cải tiến giao diện UI/UX & Đồng bộ Mobile
- **File**: `FE/assets/js/pages/revenue.js`, `MobileApp/src/screens/admin/AdminRevenueScreen.js`
- **Mô tả**:
  1. **Web**: Loại bỏ các select box chọn tháng/năm cũ. Thay thế bằng 2 input readonly và tích hợp trực tiếp thư viện `AirDatepicker` với cấu hình chỉ cho phép chọn tháng và năm (`view: 'months', minView: 'months', dateFormat: 'MM/yyyy'`), mang lại trải nghiệm chuyên nghiệp, mượt mà và đồng bộ với hệ thống lịch chung.
  2. **Mobile**: Thay thế các ô `TextInput` tự gõ tháng bằng `TouchableOpacity` kích hoạt Modal. Thiết kế và tích hợp Custom `MonthYearPickerModal` cho phép người dùng chọn Tháng (1-12) và Năm (2022-2026) bằng các nút bấm trực quan, loại bỏ hoàn toàn việc gõ tay và đảm bảo dữ liệu gửi lên API đúng chuẩn `YYYY-MM`.
- **Kết quả**: Thành công.

### [01/06/2026 10:05] — Việt hóa bộ lọc so sánh doanh thu và đồng bộ sang Mobile App Admin
- **Loại**: Cải tiến tính năng & Đồng bộ Mobile
- **File**: `BE/src/controllers/revenue.controller.js`, `FE/assets/js/pages/revenue.js`, `MobileApp/src/screens/admin/AdminRevenueScreen.js`
- **Mô tả**:
  1. **Backend**: Cập nhật API `compare-months` để tự động query thêm `packageStats` (gói tập bán chạy) và `transactions` (giao dịch chi tiết) của cả 2 tháng so sánh.
  2. **Frontend**: Thiết kế lại bộ chọn tháng so sánh bằng ngôn ngữ Tiếng Việt, đổi input month sang giao diện gọn đẹp hơn. Đưa dữ liệu gói tập bán chạy và giao dịch gộp hiển thị bình thường khi ở chế độ so sánh (thay vì bị ẩn/rỗng).
  3. **Mobile**: Đồng bộ tuỳ chọn "So sánh" vào `AdminRevenueScreen` trên ứng dụng mobile với đầy đủ biểu đồ 2 đường (react-native-svg), các Stat Cards và danh sách giao dịch, gói tập gộp của 2 tháng so sánh.
- **Kết quả**: Thành công.

### [01/06/2026 09:58] — Thêm tính năng so sánh doanh thu giữa 2 tháng tự chọn
- **Loại**: Thêm tính năng
- **File**: `BE/src/routes/revenue.routes.js`, `BE/src/controllers/revenue.controller.js`, `FE/assets/js/pages/revenue.js`
- **Mô tả**: Bổ sung API và giao diện so sánh 2 tháng bất kỳ:
  1. **Backend**: Viết API `/api/revenue/compare-months` nhận `month1` và `month2` dạng `YYYY-MM`. Query doanh thu chi tiết theo ngày và tổng doanh thu của mỗi tháng.
  2. **Frontend**: Thêm lựa chọn "So sánh tháng" vào bộ lọc. Khi click sẽ hiện ra 2 ô chọn tháng và nút "So sánh". Nhấp vào sẽ fetch API và vẽ biểu đồ 2 đường (Tháng A xanh lá, Tháng B tím) cùng card tổng hợp so sánh trực quan.
- **Kết quả**: Thành công.

### [01/06/2026 09:39] — Fix hội viên vẫn hiện trong "Đã hết hạn" sau khi gia hạn thành công
- **Loại**: Sửa bug (Backend + Mobile)
- **File**: `BE/src/controllers/members.controller.js`, `MobileApp/src/screens/admin/AdminExpiredMembersScreen.js`
- **Mô tả**: Tìm ra 2 nguyên nhân:
  1. **Backend** — `getExpiredMembers` và `getExpiringMembers` không gọi `autoUpdateExpiredStatuses()` trước khi query. Gói cũ hết hạn vẫn còn `trang_thai = 'dang_hoat_dong'` trong DB → query NOT EXISTS bị sai. Đã thêm `autoUpdateExpiredStatuses()` vào đầu cả 2 hàm.
  2. **Mobile** — `AdminExpiredMembersScreen` dùng `useEffect` thường → không tự refresh khi navigate back từ màn hình gia hạn. Đã đổi sang `useFocusEffect` để danh sách tự làm mới mỗi khi màn hình được focus.
- **Kết quả**: Thành công — Hội viên biến mất khỏi danh sách hết hạn ngay sau khi gia hạn thành công.

### [01/06/2026 09:28] — Redesign biểu đồ phương thức thanh toán thành Stacked Bar Chart theo ngày
- **Loại**: Cải tiến tính năng
- **File**: `FE/assets/js/pages/revenue.js`
- **Mô tả**: Thay đổi biểu đồ `payment_method` (7/30 ngày) — hiển thị đủ N ngày trên trục X, mỗi cột là stacked bar gồm tiền mặt (cam, dưới) + chuyển khoản (xanh, trên). Tooltip hiện từng phương thức + tổng ngày. Với 30 ngày: tự ẩn bớt label trục X (mỗi 5 ngày).
- **Kết quả**: Thành công — Biểu đồ trực quan, đầy đủ thông tin theo ngày.

### [01/06/2026 09:07] — Fix DatePickerField không hiển thị ngày sau khi tự động tính
- **Loại**: Sửa bug
- **File**: `MobileApp/src/components/DatePickerField.js`
- **Mô tả**: Thêm `useEffect` theo dõi prop `value`. Khi giá trị từ màn hình cha thay đổi (ví dụ: ngày kết thúc được tính tự động từ gói tập được chọn), component sẽ đồng bộ lại `selectedDate`, `currentMonth`, và `currentYear` để hiển thị đúng ngày lên UI. Lỗi này ảnh hưởng tới mọi màn hình dùng `DatePickerField` với ngày được set từ bên ngoài: `AdminRegisterPackageScreen`, `AdminRegisterPTScreen`.
- **Kết quả**: Thành công — Ngày kết thúc hiển thị chính xác sau khi tự động tính.

### [01/06/2026 09:19] — Fix biểu đồ phương thức thanh toán chỉ 1 cột bị mất
- **Loại**: Sửa bug
- **File**: `FE/assets/js/pages/revenue.js`
- **Mô tả**: Đổi kiểu biểu đồ `payment_method` từ `line` sang `bar`. Chart line cần tối thiểu 2 điểm để vẽ đường liên kết — khi chỉ có 1 phương thức (ví dụ chỉ có tiền mặt), biểu đồ chỉ hiện 1 dấu chấm legend mà không có chart. Bar chart hiển thị 1 hoặc 2 cột đều bình thường. Đồng thời thêm legend tùy chỉnh phân biệt màu Tiền mặt (cam) và Chuyển khoản (xanh).
- **Kết quả**: Thành công — Biểu đồ phương thức thanh toán hiển thị đúng với 1 hoặc 2 phương thức.

### [01/06/2026 09:19] — Fix luồng gia hạn gói Gym và PT khi hội viên hết hạn
- **Loại**: Sửa bug
- **File**: `MobileApp/src/screens/admin/AdminMemberDetailScreen.js`
- **Mô tả**: Thêm biến `activePkgForSwitch` và `activePTForSwitch` chỉ lấy gói còn thực sự hiệu lực (trạng thái `dang_hoat_dong` hoặc `cho_kich_hoat`). Khi gói đã `het_han`, biến này là `null` và màn hình đăng ký nhận tham số `activePkg: null` — đúng luồng "Đăng ký mới" thay vì nhầm sang "Đổi gói / Song song". Áp dụng cho cả gói Gym và gói PT.
- **Kết quả**: Thành công — Hội viên hết hạn sẽ được gia hạn đúng luồng "Đăng ký mới", không bị hiện "Đổi gói".


### 29/05/2026 10:15 — Sửa lỗi ReferenceError, Khóa tiền hoàn hủy gói & Đồng bộ Trạng thái giao dịch di động
- **Loại**: Sửa bug, Thêm tính năng mới, Nghiệp vụ, Database Migration (Fullstack)
- **File/Thành phần liên quan**:
  - `BE/src/config/db.js` (Migration v19 & Trigger update)
  - `BE/src/controllers/revenue.controller.js` (Query giao dịch PT)
  - `BE/src/controllers/pt-registrations.controller.js` (API hủy PT)
  - `BE/src/controllers/members.controller.js` (API hủy Gym)
  - `MobileApp/src/screens/admin/AdminMemberDetailScreen.js` (Giao diện hủy gói)
  - `MobileApp/src/screens/admin/AdminDashboardScreen.js` (Badge trạng thái & dòng tiền)
  - `MobileApp/src/screens/admin/AdminRevenueScreen.js` (Badge trạng thái & dòng tiền)
- **Mô tả**:
  - **ReferenceError**: Đã sửa triệt để lỗi thiếu import bằng cách đảm bảo import React và hook useEffect đồng bộ ở các trang.
  - **Ràng buộc tiền hoàn**: Thực hiện Migration v19 bổ sung cột `so_tien_hoan` và `ly_do_huy` vào bảng `dang_ky_pt`. Cập nhật trigger doanh thu PT để trừ tiền đúng theo số tiền hoàn thực tế. Cập nhật backend API hủy gói Gym và gói PT để bắt buộc tiền hoàn khớp 100% với giá thực tế của gói tập đang hoạt động. Cập nhật giao diện di động khóa trường nhập tiền hoàn trả (editable={false}) và tự động điền giá trị gói khi hủy.
  - **Trạng thái giao dịch di động**: Đồng bộ logic phân loại giao dịch (Đăng ký mới, Đổi gói, Hủy gói, Tạm dừng, Hết hạn) kèm chênh lệch dòng tiền (+/-) và hiển thị Badge màu tương ứng lên cả modal Dashboard và trang Doanh thu hôm nay/hôm qua di động giống hệt bản Web.
- **Kết quả**: Thành công 100%.

### 28/05/2026 09:00 — Redesign toàn diện Member Portal & PT Portal theo quy chuẩn Supabaze
- **Loại**: Redesign giao diện, Cải tiến UI/UX (Frontend)
- **File/Thành phần liên quan**:
  - `FE/member-portal.html`
  - `FE/pt-portal.html`
- **Mô tả**:
  - **Bảng màu & Nền**: Thay đổi màu chủ đạo cũ thành màu xanh ngọc lục bảo Emerald `#3ecf8e` và màu nhấn deep `#24b47e`. Đặt chữ mặc định sang màu Ink `#171717`.
  - **Nút bấm & Inputs**: Cập nhật bo góc nút bấm về 6px (`rounded.sm`), thay đổi màu chữ nút bấm primary green thành màu Ink `#171717` đúng tinh thần thiết kế Supabaze.
  - **Cards & Bảng**: Cấu trúc bo góc card tăng lên 12px (`rounded.lg`), bóng đổ Level 1 mặc định và nâng lên Level 2 khi hover.
  - **Sidebar Active Nav**: Đổi dạng pill-shape bo tròn cũ thành dạng thiết kế phẳng tối giản, có đường gạch trái màu xanh ngọc và nền nhẹ `#fafafa`.
  - **SVG Logos**: Tinh giản màu sắc logo chỉ giữ màu tối `#171717` và chấm chữ i, tạ tập là điểm nhấn xanh ngọc lục bảo `#3ecf8e`.
  - **Helpers JS**: Đồng bộ màu Toast và các Status badge theo hệ màu thiết kế mới.
- **Kết quả**: Thành công 100%.

### 28/05/2026 08:42 — Tối ưu trải nghiệm Login di động, kẻ dọc bảng hội viên & đồng bộ card Dashboard
- **Loại**: Cải tiến giao diện UI/UX, Sửa lỗi hiệu năng di động (Fullstack)
- **File/Thành phần liên quan**:
  - `MobileApp/src/screens/auth/LoginScreen.js`
  - `FE/assets/js/pages/members-list.js`
  - `FE/assets/js/pages/dashboard.js`
- **Mô tả**:
  - **Tối ưu đăng nhập di động**: Loại bỏ state `focusedInput` và style `inputRowFocused` nhằm tắt bỏ viền xanh khi nhấp vào input. Việc này cũng ngăn chặn việc re-render liên tục gây giật khựng (lag) khi di chuyển con trỏ giữa Tên đăng nhập và Mật khẩu.
  - **Kẻ dọc bảng hội viên**: Thêm đường kẻ dọc mờ tinh tế phân chia giữa các cột của bảng hội viên bằng class `border-r border-outline-variant/30` cho các ô `<td>` và `border-right: 1px solid rgba(255,255,255,0.15)` cho các ô `<th>` (ngoại trừ cột thao tác cuối).
  - **Đồng bộ card Dashboard**: Đặt thuộc tính `flex-1` và `min-height: 280px` cho cả hai card "Check-in gần nhất" và "Hoạt động gần đây" giúp chúng chia đều chiều cao của thanh bên, tạo sự cân xứng tuyệt đối trên giao diện tổng quan.
- **Kết quả**: Thành công 100%.

### 27/05/2026 09:45 — Cải tổ Triggers doanh thu, Rebuild dữ liệu Doanh thu & Đồng bộ bộ lọc 7/30 ngày
- **Loại**: Thêm tính năng mới, Sửa bug, Nghiệp vụ, Database Trigger (Fullstack)
- **File/Thành phần liên quan**:
  - [db.js](file:///d:/UI%20GYM/BE/src/config/db.js) (Backend DB)
  - [revenue.controller.js](file:///d:/UI%20GYM/BE/src/controllers/revenue.controller.js) (Backend API)
  - [revenue.js](file:///d:/UI%20GYM/FE/assets/js/pages/revenue.js) (Web Frontend JS)
- **Mô tả**:
  - **Cải tổ Triggers doanh thu (Database)**: Tạo Migration v15 trong `db.js` để drop 6 trigger doanh thu cũ và định nghĩa lại với ngày ghi nhận thống nhất `COALESCE(date(ngay_thanh_toan), date(ngay_tao))`, loại bỏ hoàn toàn việc lệch doanh thu do sự bất nhất giữa ngày duyệt (ngày hôm nay) và ngày tạo (ngày hôm trước).
  - **Rebuild Doanh thu**: Chạy SQL tổng hợp lại bảng `doanh_thu` từ hai bảng giao dịch gốc `dang_ky_goi_tap` và `dang_ky_pt` khi khởi động backend, giúp khôi phục dữ liệu doanh thu quá khứ chính xác 100%.
  - **API Giao dịch kỳ lọc**: Bổ sung trả về danh sách giao dịch chi tiết `transactions` trong khoảng thời gian lọc trong hàm `getRevenue`.
  - **Đồng bộ bộ lọc 7/30 ngày (Frontend Web & Mobile)**:
    - Sửa đổi `revenue.js` để khi người dùng chọn "7 ngày" hoặc "30 ngày", các card thống kê Doanh thu, Gói Gym, Gói PT sẽ lấy số liệu của cả kỳ lọc (từ đối tượng `summary` thay vì lấy ngày hôm nay).
    - Cập nhật bảng giao dịch hiển thị đúng các giao dịch của cả kỳ lọc, đồng bộ cách hiển thị doanh thu kỳ lọc chuyên nghiệp với Mobile App.
- **Kết quả**: Thành công 100%.

### 27/05/2026 09:30 — Fix Lỗi Thống Kê PT & Doanh Thu Hôm Nay Không Cập Nhật
- **Loại**: Sửa bug, Frontend Data Cache
- **File/Thành phần liên quan**:
  - [FE/assets/js/pages/members-list.js](FE/assets/js/pages/members-list.js#L511-L537) (Tab PT Detail Modal)
  - [FE/assets/js/pages/revenue.js](FE/assets/js/pages/revenue.js#L163-L180) (Card Doanh Thu)
- **Mô tả**:
  - **Vấn đề 1 — Thống kê PT không chính xác**: Khi xem chi tiết PT, dữ liệu `tong_buoi_da_day`, `so_hoc_vien`, `danh_gia` không được cập nhật từ API vào cache. Fix: Thêm logic cập nhật `window.GymApp.data.pts` sau khi fetch dữ liệu PT từ API `/trainers/{id}`, đảm bảo cache luôn được đồng bộ.
  - **Vấn đề 2 — Doanh thu gói PT/tập hôm nay sai**: Card "Gói tập" & "Gói PT" lấy dữ liệu từ `summary?.tong_goi_tap` (doanh thu tháng) thay vì `dayData?.tien_goi_tap` (doanh thu hôm nay). Fix: Thay đổi logic `_renderStats()` để 2 card này luôn dùng `dayData` (doanh thu hôm nay), bất kể khoảng thời gian nào được chọn. Chỉ card "Tổng doanh thu" mới dùng `summary`.
- **Kết quả**: Thành công 100%. Giờ đây khi đổi gói PT/tập, các thống kê và doanh thu đều cập nhật chính xác.

### 27/05/2026 08:45 — Bổ sung Thống kê PT & Trigger đồng bộ Doanh thu đổi gói PT
- **Loại**: Sửa bug, Nghiệp vụ, Database Trigger (Fullstack)
- **File/Thành phần liên quan**:
  - [trainers.controller.js](file:///d:/UI%20GYM/BE/src/controllers/trainers.controller.js) (Backend API)
  - [db.js](file:///d:/UI%20GYM/BE/src/config/db.js) (Backend DB)
- **Mô tả**:
  - **Sửa lỗi hiển thị chi tiết PT**: Cập nhật hàm `getTrainerById` trong `trainers.controller.js` để tính toán realtime và trả về đầy đủ các trường `so_hoc_vien`, `tong_buoi_da_day` và `so_goi_dang_day` qua câu truy vấn con, giúp frontend hiển thị chính xác bảng thống kê chi tiết HLV.
  - **Sửa lỗi đồng bộ doanh thu đổi gói PT**: Tạo Migration v14 trong `db.js` để thêm 2 trigger SQLite `trg_doanh_thu_goi_pt_price_update` (`AFTER UPDATE OF gia_thuc_te ON dang_ky_pt`) và `trg_doanh_thu_goi_tap_price_update` (`AFTER UPDATE OF gia_thuc_te ON dang_ky_goi_tap`). Nhờ vậy, khi thay đổi trực tiếp giá thực tế của gói (để đổi gói mà không tạo bản ghi mới), doanh thu hôm nay vẫn được tính toán cộng/trừ chênh lệch một cách chính xác dựa trên ngày tạo ban đầu.
- **Kết quả**: Thành công 100%.

### 26/05/2026 11:55 — Khắc Phục Lỗi Cú Pháp JSX/TSX Cho PTHomeScreen.js
- **Loại**: Sửa bug / Refactor code
- **File/Thành phần liên quan**: `MobileApp/src/screens/pt/PTHomeScreen.js`
- **Mô tả**: Sửa lỗi thiếu thẻ đóng `ScrollView`, khắc phục lỗi phân tích cú pháp (`unexpected token`, `identifier expected`) bằng cách tách các đoạn IIFE và biểu thức ternary lồng nhau phức tạp bên trong JSX ra hàm helper `renderNextSchedule()`, sửa đổi ký tự `&` trong label, và đơn giản hóa vòng lặp vẽ tia sáng của banner.
- **Kết quả**: Thành công 100%. Ứng dụng di động PT đã biên dịch và hoạt động bình thường.

### 26/05/2026 11:50 — Nâng Cấp Xác Nhận Kép Buổi Tập PT, Màn Hình Doanh Thu Admin và Đồng Bộ Dark Mode Toàn Diện
- **Loại**: Thêm tính năng mới, Chỉnh sửa UI/UX, Sửa lỗi hệ thống, Bảo mật & Nghiệp vụ (Fullstack)
- **File/Thành phần liên quan**:
  - `BE/src/config/db.js` (Backend DB)
  - `BE/src/controllers/pt-schedules.controller.js` (Backend API)
  - `BE/src/jobs/cron-pt-confirm.js` (Backend Cron Job)
  - `MobileApp/src/screens/shared/PTMeScreen.js` (Mobile Chat)
  - `MobileApp/src/screens/member/MemberHomeScreen.js` (Mobile Member)
  - `MobileApp/src/screens/member/MemberScheduleScreen.js` (Mobile Member)
  - `MobileApp/src/screens/pt/PTHomeScreen.js` (Mobile PT)
  - `MobileApp/src/screens/pt/PTScheduleScreen.js` (Mobile PT)
  - `MobileApp/src/screens/pt/PTQRCodeScreen.js` (Mobile PT)
  - `MobileApp/src/screens/pt/PTStudentsScreen.js` (Mobile PT)
  - `MobileApp/src/navigation/AdminNavigator.js` (Mobile Admin Navigation)
  - `MobileApp/src/screens/admin/AdminDashboardScreen.js` (Mobile Admin Dashboard)
  - `MobileApp/src/screens/admin/AdminRevenueScreen.js` (Mobile Admin Revenue)
  - `MobileApp/src/screens/admin/AdminProfileScreen.js` (Mobile Admin Profile)
  - `MobileApp/src/screens/admin/AdminAddEditMemberScreen.js` (Mobile Admin Form)
  - `MobileApp/src/screens/admin/AdminAddEditPTScreen.js` (Mobile Admin Form)
  - `MobileApp/src/screens/admin/AdminAddEditPackageScreen.js` (Mobile Admin Form)
  - `MobileApp/src/screens/admin/AdminRegisterPTScreen.js` (Mobile Admin Form)
  - `MobileApp/src/screens/admin/AdminRegisterPackageScreen.js` (Mobile Admin Form)
- **Mô tả**:
  - **Cơ chế xác nhận kép buổi tập PT (Backend & Mobile)**:
    - Thêm cột `pt_xac_nhan` và `hv_xac_nhan` vào bảng `lich_tap` (Migration v13).
    - Cập nhật logic `confirmSchedule` trong Backend: buổi tập chỉ hoàn thành (chuyển sang `da_tap` và trừ số buổi còn lại của học viên) khi cả PT và Hội viên đều xác nhận.
    - Cập nhật cron job `cron-pt-confirm.js` để tự động xác nhận cả 2 bên vào cuối ngày đối với các buổi đã check-in.
    - Hiển thị nhãn trạng thái động trên app di động: *"Chờ bạn xác nhận"*, *"Chờ PT xác nhận"*, *"Chờ học viên xác nhận"* tương ứng với vai trò.
  - **Giao diện & Tiện ích di động**:
    - Cấu trúc lại bong bóng chat trong `PTMeScreen.js`: Tin nhắn hội viên căn lề Phải, PT căn lề Trái theo vai trò của người gửi tin nhắn.
    - Redesign modal lịch tập trên màn hình chính Hội viên thành bottom sheet trượt chiếm **95%** chiều cao màn hình để tối ưu hóa không gian.
    - Sửa lỗi vỡ giao diện/nền trắng khi ở Dark Mode trên các màn hình di động của PT (`PTHomeScreen.js`, `PTScheduleScreen.js`, v.v.).
    - Tích hợp thêm Gym Info Card & Modal vào trang chủ PT để đồng bộ trải nghiệm với trang Hội viên.
  - **Phân tích Doanh thu Admin di động (Mới)**:
    - Đăng ký và hoàn thiện màn hình `AdminRevenueScreen.js` hỗ trợ các bộ lọc Hôm nay, 7 ngày, 30 ngày.
    - Hiển thị các thẻ chỉ số KPI doanh thu, biểu đồ vùng động (Area Chart) vẽ bằng thẻ SVG nguyên bản (`react-native-svg`), danh sách giao dịch & phân tích chi tiết.
    - Chuyển hướng nút "Doanh thu tháng" trên Admin Dashboard sang màn hình phân tích doanh thu mới.
  - **Chỉnh sửa hồ sơ Admin di động**:
    - Redesign `AdminProfileScreen.js` đồng bộ màu sắc hiện đại và tích hợp `EditProfileModal` cho phép Admin tự chỉnh sửa thông tin cá nhân và cập nhật avatar lên Cloudinary.
  - **Sửa lỗi Status Bar đè lên nút tiêu đề trên Admin Forms**:
    - Áp dụng Safe Area Insets (`paddingTop: insets.top` và chiều cao Header tự động thích ứng `60 + insets.top`) trên cả 5 màn hình biểu mẫu Admin.
  - **Sửa lỗi cú pháp PTHomeScreen.js**:
    - Khắc phục lỗi thiếu thẻ đóng `ScrollView` và lỗi phân tích cú pháp lồng nhau bằng cách tách IIFE và biểu thức ternary phức tạp thành hàm bổ trợ riêng biệt `renderNextSchedule()`, sửa đổi ký tự `&` trong label, và đơn giản hóa vòng lặp vẽ tia sáng.
- **Kết quả**: Thành công 100%. Toàn bộ hệ thống hoạt động ổn định và đồng bộ nhất quán.

### 25/05/2026 — Phân Trang Lịch Tập PT (3 Ngày/Trang) & Redesign Form Gói Tập Hội Viên (Lưới 3-3-3-1)
- **Loại**: Cải tiến giao diện UI/UX, Bố cục hiển thị
- **File/Thành phần liên quan**:
  - [pt-training.js](file:///d:/UI%20GYM/FE/assets/js/pages/pt-training.js)
  - [member-add.js](file:///d:/UI%20GYM/FE/assets/js/pages/member-add.js)
- **Mô tả**:
  - **Lịch đào tạo PT**: 
    - Thiết lập số ngày hiển thị mỗi trang `_daysPerPage` thành 3 ngày để tránh danh sách quá dài khi lượng dữ liệu lớn. Mặc định tự động mở rộng 3 ngày có lịch tập gần nhất ở trang đầu tiên.
    - Giới hạn hiển thị tối đa 4 card lịch tập trên 1 ngày theo chiều ngang, tự động tạo thanh cuộn ngang (`flex flex-row overflow-x-auto`) nếu số lượng lịch tập nhiều hơn.
    - Loại bỏ dropdown chọn "Trạng thái" trong bộ lọc và xóa bỏ phần "Danh sách Huấn luyện viên" ở phía cuối trang theo yêu cầu rút gọn giao diện.
  - **Form đăng ký Gói tập**:
    - Sắp xếp lại toàn bộ form đăng ký gói tập hội viên theo cấu trúc lưới **3-3-3-1** cân đối (Dòng 1: Chọn gói, Giá gói, Từ ngày; Dòng 2: Đến ngày, Mã giảm giá, Tổng tiền; Dòng 3: Tiền khách trả, Ngày thu, Phương thức; Dòng 4: Ghi chú thanh toán full-width).
    - Giãn khoảng cách các input lên 1 cấp: tăng padding dọc của input/select từ `py-1.5` lên `py-2`, tăng margin-bottom của nhãn label từ `mb-1` lên `mb-1.5` trong các helper và biểu mẫu tĩnh. Thay đổi khoảng cách grid gap từ `gap-3` lên `gap-standard` (1rem / 16px).
- **Kết quả**: Thành công 100%. Giao diện hiển thị cực kỳ cân đối, hiện đại và tối ưu hóa không gian trên mọi thiết bị.

### 25/05/2026 — Hoàn Thiện Nghiệp Vụ Đổi Gói Tập (Nâng Cấp/Hạ Cấp) & Đồng Bộ Dynamic UI (Web & Mobile)
- **Loại**: Cải tiến logic nghiệp vụ, UI/UX, Đồng bộ hệ thống (Web & Mobile)
- **File/Thành phần liên quan**:
  - [members-list.js](file:///d:/UI%20GYM/FE/assets/js/pages/members-list.js)
  - [AdminMemberDetailScreen.js](file:///d:/UI%20GYM/MobileApp/src/screens/admin/AdminMemberDetailScreen.js)
  - [AdminRegisterPackageScreen.js](file:///d:/UI%20GYM/MobileApp/src/screens/admin/AdminRegisterPackageScreen.js)
  - [db.js (BE)](file:///d:/UI%20GYM/BE/src/config/db.js)
- **Mô tả**:
  - **Database & Trigger (BE)**: Bổ sung Migration v12 cập nhật trigger `trg_doanh_thu_goi_tap_update` để trừ doanh thu dựa trên số tiền hoàn thực tế `COALESCE(NEW.so_tien_hoan, OLD.gia_thuc_te)` khi hủy hoặc đổi gói tập, ngăn lỗi thất thoát doanh thu của số ngày đã sử dụng.
  - **Mobile App**:
    - Nâng cấp `AdminMemberDetailScreen` để truyền `activePkg` sang màn hình đăng ký gói.
    - Cải tiến `AdminRegisterPackageScreen` nhận `activePkg` để hiển thị Banner thông tin gói đang hoạt động kèm số tiền hoàn bảo lưu gợi ý (tính toán thực tế theo số ngày còn lại / tổng số ngày của gói cũ).
    - Thêm chức năng lựa chọn "Loại giao dịch" (Đổi gói tập vs Đăng ký song song) khi hội viên đang có gói hoạt động.
    - Phát triển logic tính chênh lệch thu tiền động: nếu nâng cấp (tiền đóng thêm >= 0) hiển thị màu xanh và nhãn "Tiền đóng thêm (đ)"; nếu hạ cấp (tiền đóng thêm < 0) hiển thị màu đỏ và nhãn "Tiền hoàn trả khách (đ)", đồng bộ hoàn toàn với logic trên Web Frontend theo mong muốn của khách hàng.
    - Tích hợp gọi đúng API `POST /api/members/:id/package/switch` khi xác nhận đổi gói.
  - **Web Frontend**: Nhãn và phong cách của trường chênh lệch được đồng bộ linh hoạt giữa "Tiền thanh toán thêm" và "Tiền hoàn trả khách" tùy theo chênh lệch âm dương khi thực hiện đổi gói (nâng cấp/hạ cấp).
- **Kết quả**: Thành công 100%.

### 25/05/2026 — Ràng Buộc Thanh Toán Đầy Đủ Gói Tập & Khóa Ngày Thu Tiền
- **Loại**: Cải tiến logic nghiệp vụ, UX, Đồng bộ hệ thống (Fullstack)
- **File/Thành phần liên quan**:
  - `FE/assets/js/pages/member-add.js`
  - `MobileApp/src/screens/admin/AdminRegisterPackageScreen.js`
- **Mô tả**:
  - **Web Frontend**: Khóa ô "Ngày thu" thành chỉ đọc (read-only) và tự động đồng bộ hóa giá trị với ô "Từ ngày" (ngày bắt đầu gói tập). Bổ sung điều kiện validation khi nhấn nút "Lưu đăng ký gói" để đảm bảo số tiền khách trả không được nhỏ hơn giá trị thực tế của gói tập, ngăn chặn ghi nhận nợ ngoài ý muốn.
  - **Mobile App**: Bổ sung validation tương ứng trong `handleRegister` để chặn đăng ký gói tập nếu số tiền thu thực tế (`paidAmount`) nhỏ hơn giá gói tập thực tế (`actualPrice`), đảm bảo tính nhất quán nghiệp vụ giữa nền tảng Web và Di động.
- **Kết quả**: Thành công 100%.

### 25/05/2026 — Tích Hợp Đầy Đủ Chức Năng Admin & Đồng Bộ Hóa Dark Mode Trên MobileApp
- **Loại**: Cải tiến tính năng, UI/UX, Đồng bộ hệ thống (Mobile)
- **File/Thành phần liên quan**:
  - `MobileApp/src/navigation/AdminNavigator.js`
  - `MobileApp/src/screens/admin/AdminDashboardScreen.js`
  - `MobileApp/src/screens/admin/AdminMembersScreen.js`
  - `MobileApp/src/screens/admin/AdminPTScreen.js`
  - `MobileApp/src/screens/admin/AdminPackagesScreen.js`
  - `MobileApp/src/screens/admin/AdminPackageRequestsScreen.js`
  - `MobileApp/src/screens/admin/AdminMemberDetailScreen.js`
  - `MobileApp/src/screens/admin/AdminAddEditMemberScreen.js`
  - `MobileApp/src/screens/admin/AdminRegisterPackageScreen.js`
  - `MobileApp/src/screens/admin/AdminRegisterPTScreen.js`
  - `MobileApp/src/screens/admin/AdminAddEditPTScreen.js`
  - `MobileApp/src/screens/admin/AdminAddEditPackageScreen.js`
- **Mô tả**:
  - Đồng bộ hóa 100% Dark Mode trên toàn bộ các màn hình quản trị của Admin bằng cách chuyển từ các mã màu tĩnh sang context `useTheme()`.
  - Tích hợp đầy đủ luồng nghiệp vụ quản trị Admin: duyệt yêu cầu gia hạn gói tập, xem chi tiết hồ sơ hội viên và lịch sử check-in/lịch sử gói, CRUD hội viên, CRUD PT, CRUD gói tập (Gym & PT), và thực hiện các giao dịch đăng ký gói tập/hợp đồng PT trực tiếp trên thiết bị di động.
  - Cấu hình lại thanh bottom tab navigator ẩn các màn hình stack phụ để đảm bảo trải nghiệm điều hướng tự nhiên, mượt mà trên di động.
  - Sửa lỗi `ReferenceError: Property 'Platform' doesn't exist` tại [AdminMembersScreen.js](file:///d:/UI%20GYM/MobileApp/src/screens/admin/AdminMembersScreen.js) bằng cách import `Platform` từ `react-native`.
  - Sửa lỗi `ReferenceError: Property 'ScrollView' doesn't exist` tại [AdminMembersScreen.js](file:///d:/UI%20GYM/MobileApp/src/screens/admin/AdminMembersScreen.js) bằng cách import `ScrollView` từ `react-native`.
  - Sửa lỗi 500 do thiếu cột `so_tien_da_thu` trong bảng `dang_ky_goi_tap` bằng cách bổ sung migration tự động khi Backend khởi chạy tại [db.js](file:///d:/UI%20GYM/BE/src/config/db.js).
- **Kết quả**: Thành công 100%.

### 23/05/2026 — Redesign Modal Header (members-list.js)
- **Loại**: UI/UX Design
- **File/Thành phần liên quan**: `FE/assets/js/pages/members-list.js`
- **Mô tả**: Redesign toàn bộ modal trong trang Danh sách hội viên:
  - Modal chính (hội viên): Banner gradient đổi từ `#1a5e2a → #1D9336 → #22c55e` sang `#2d6a4f → #40916c → #52b788` (sage forest, dịu hơn). Stats bar dưới dùng `rgba(255,255,255,0.08)` thay `rgba(0,0,0,0.15)`. Avatar border, badge status, dot check-in đều nhẹ hơn.
  - Modal phụ thêm/sửa/hủy gói tập: Header gradient xanh sage (`#2d6a4f → #40916c`). Nút X dạng circle glass. Overlay từ `rgba(0,0,0,0.65)` → `rgba(0,0,0,0.45)`, blur tăng từ 4px → 6px.
  - Modal hủy gói tập: Header gradient đỏ (`#b91c1c → #dc2626`) để phân biệt hành động nguy hiểm.
  - Modal đổi gói tập: Header gradient xanh dương (`#1e40af → #2563eb`).
  - Tất cả modal: shadow giảm từ `0 30px 80px rgba(0,0,0,0.4)` → `0 20px 60px rgba(0,0,0,0.2)`.
- **Kết quả**: Thành công

### 23/05/2026 — Fix Bug Validate + Đổi Gói PT + Mobile PayOS (Task A–C)
- **Loại**: Sửa lỗi UX / Thêm tính năng
- **File/Thành phần liên quan**:
  - `FE/assets/js/pages/members-list.js`
  - `MobileApp/src/screens/member/MemberHomeScreen.js`
  - `MobileApp/src/screens/member/OrderConfirmationScreen.js`
- **Mô tả**:
  - **Task A — FE Validate đăng ký gói**: `calcDebt()` đổi màu nền ô nợ/dư (đỏ/xanh). Handler `#pkg-save-btn` thêm check: nếu `regStatus !== 'debt'` và `paid < needToPay` → toast lỗi, block submit.
  - **Task B — FE Đổi gói PT**: Thêm info panel tính tiền hoàn gợi ý (`credit = gia_thuc_te × buoi_con_lai / tong_buoi`). Thêm ô "Hoàn tiền gói cũ" (tự điền, sửa được) và ô "Tiền đóng thêm" (readonly, cập nhật realtime = giá mới − hoàn).
  - **Task C — Mobile Gia hạn PayOS**: Xóa modal renewal cũ (dùng `alert()`, không PayOS). `openRenewModal` nay navigate thẳng sang `OrderConfirmationScreen`. `OrderConfirmationScreen` hỗ trợ thêm luồng vào không có `packageItem` — tự fetch danh sách gói cho user chọn trước khi thanh toán.
- **Kết quả**: Thành công



### 23/05/2026 — Fix Luồng Logic Duyệt Gia Hạn Gói Tập (Task 1–4)
- **Loại**: Sửa lỗi logic nghiệp vụ (Fullstack)
- **File/Thành phần liên quan**:
  - `BE/src/controllers/members.controller.js`
  - `BE/src/jobs/cron-daily.js`
  - `FE/assets/js/member-portal.js`
  - `FE/assets/js/pages/members-list.js`
- **Mô tả**:
  - **Task 1 — BE `approvePackageRequest`**: Đổi `finalStatus = 'cho_duyet'` → `'cho_kich_hoat'` khi admin duyệt gói nối tiếp (tu_ngay > hôm nay). Gói `cho_kich_hoat` sẽ không xuất hiện lại trong danh sách chờ duyệt. Thông báo gửi cho hội viên cũng được điều chỉnh theo 2 trường hợp: kích hoạt ngay vs chờ kích hoạt.
  - **Task 1 — BE `checkPayosStatus`**: Cùng logic — PayOS PAID + tu_ngay tương lai → `cho_kich_hoat` thay vì `cho_duyet`.
  - **Task 2 — BE cron-daily.js**: Cập nhật query kích hoạt hàng ngày nhận cả `trang_thai IN ('cho_kich_hoat', 'cho_duyet')` + `ngay_thanh_toan IS NOT NULL`.
  - **Task 3 — BE `requestPackageRenewal`**: Kiểm tra duplicate bao gồm cả `cho_kich_hoat` để tránh hội viên đăng ký trùng khi đã có gói chờ kích hoạt. Sửa thông báo lỗi rõ ràng theo từng trường hợp.
  - **Task 3 — BE `co_yeu_cau_gia_han`**: Cập nhật 3 chỗ trong SQL để nhận cả `cho_kich_hoat`.
  - **Task 3 — BE `getMemberById`**: Thêm `cho_kich_hoat` vào `trang_thai IN (...)` để trả về gói này cho FE.
  - **Task 3 — BE `approvePackageRequest` validation**: Cho phép admin xử lý cả `cho_kich_hoat` (edge case: cần sửa gói đã duyệt).
  - **Task 4 — FE member-portal.js**: Thêm hàm `getScheduledPackage()`, hiển thị badge + thông báo "sẽ kích hoạt ngày X" cho gói `cho_kich_hoat` trong dashboard.
  - **Task 4 — FE members-list.js**: Phân biệt label "Đã duyệt — Chờ kích hoạt nối tiếp" vs "Gói nối tiếp — Chờ kích hoạt" theo `trang_thai`. Loại trừ `cho_kich_hoat` khỏi section "Lịch sử & Gói khác".
- **Kết quả**: Luồng gia hạn gói tập nối tiếp hoạt động đúng end-to-end: hội viên gửi yêu cầu → admin duyệt → gói chuyển `cho_kich_hoat` → cron job kích hoạt đúng ngày → gói `dang_hoat_dong`.



### 22/05/2026 10:48 — Thiết Kế Lưới Card HLV Trực Quan & Đồng Bộ Cơ Chế Chọn Trên Toàn Bộ Web
- **Loại**: Cải tiến giao diện UI/UX (Frontend)
- **File/Thành phần liên quan**: `FE/assets/js/pages/members-list.js`, `FE/assets/js/pages/pt-register.js`
- **Mô tả**:
  - **members-list.js**: Chuyển đổi giao diện chọn PT trong 3 modal (Đăng ký, Sửa, Đổi gói PT) từ danh sách dọc `flex flex-col` sang `grid grid-cols-1 sm:grid-cols-2` responsive. Thẻ PT chuyển từ hàng ngang sang card dọc: avatar 'md' to hơn, text căn giữa, chuyên môn và mã số rõ ràng, hover nổi bật (shadow + lift + border xanh). Modal Đăng ký lịch tập PT: thay thế hoàn toàn `<select>` dropdown bằng Grid card + hidden input + card đã chọn kèm nút xóa "x", tự động chọn nếu chỉ có 1 PT.
  - **pt-register.js**: Chuyển đổi cả danh sách PT (`#pt-list`) và danh sách Hội viên (`#member-list`) sang `grid grid-cols-2 lg:grid-cols-3` responsive. Thẻ PT/Hội viên thiết kế lại dạng card dọc đẹp mắt tương tự.
- **Kết quả**: Giao diện chọn PT/HLV trên toàn bộ hệ thống Web Admin trở nên trực quan, hiện đại, responsive và đồng bộ cơ chế tích chọn/xóa chọn nhất quán.

### 22/05/2026 10:30 — Thiết Kế Lại Chọn PT Trực Quan Trong Các Modal & Sửa Lỗi Định Dạng Excel
- **Loại**: Cải tiến giao diện UI/UX & Sửa lỗi hệ thống (Fullstack)
- **File/Thành phần liên quan**: `BE/src/controllers/export.controller.js`, `FE/assets/js/pages/members-list.js`, `task.md`
- **Mô tả**:
  - **Sửa lỗi xuất Excel**: Cập nhật file `export.controller.js` giúp định dạng số điện thoại (bọc dạng chuỗi `="0..."` để không mất số 0 ở đầu) và ngày tháng (bọc dạng chuỗi `="DD/MM/YYYY"`) trong tất cả các file xuất Excel/CSV trên toàn hệ thống Web Admin. Sửa logic escape CSV tránh phá vỡ định dạng công thức Excel này.
  - **Chọn PT trực quan**: Thiết kế lại giao diện chọn Huấn luyện viên (PT) dạng card trong cả 3 modal: Đăng ký gói PT (`_showAddPtRegistrationModal`), Chỉnh sửa gói PT (`_showEditPtRegistrationModal`), và Đổi gói PT mới (`_showSwitchPtRegistrationModal`) trong trang Danh sách hội viên (`members-list.js`). Thay thế thẻ select dropdown đơn điệu bằng thanh tìm kiếm trực quan và danh sách cuộn hiển thị thẻ PT sinh động bao gồm avatar, tên, mã số, chuyên môn, số học viên hiện tại. Tự động hiển thị và chọn PT đang được gán cho hợp đồng hiện tại khi mở modal chỉnh sửa hoặc đổi gói.
- **Kết quả**: Giao diện quản lý gói PT trở nên cực kỳ cao cấp, nhất quán với ngôn ngữ thiết kế Material 3 Glassmorphism của hệ thống, đồng thời file Excel xuất ra không còn bị lỗi mất số 0 đầu số điện thoại hay đảo ngày tháng.

### 22/05/2026 10:15 — Nâng Cấp Thông Báo Mobile App & Khắc Phục Lỗi Z-Index Giao Diện Web
- **Loại**: Cải tiến giao diện, Sửa lỗi & Nâng cấp nghiệp vụ (Fullstack)
- **File/Thành phần liên quan**: `BE/src/controllers/members.controller.js`, `MobileApp/src/screens/member/MemberNotificationScreen.js`, `MobileApp/src/screens/pt/PTNotificationScreen.js`, `FE/index.html`, `FE/pt-portal.html`, `kientruchethong.md`
- **Mô tả**:
  - **Backend**: Thêm helper `getLocalNowString()` gán thời gian `ngay_tao` (định dạng `YYYY-MM-DD HH:mm:ss`) cho tất cả thông báo realtime. Sắp xếp danh sách thông báo theo `ngay_tao` giảm dần để đảm bảo thông báo mới nhất hiển thị trên đầu.
  - **Mobile App**: Thiết kế component `PulsingDot` bằng React Native Animated API nhấp nháy mượt mà cho thông báo chưa đọc. Làm phẳng danh sách thông báo (không phân nhóm) và hiển thị thời gian tương đối qua hàm `formatTimeAgo()`. Trì hoãn cuộc gọi API `markAsRead` đến khi người dùng chuyển trang/thoát màn hình (cleanup function của `useFocusEffect`).
  - **Web Frontend**: Nâng chỉ số `z-index` của header từ `z-10` lên `z-40` trong cả `index.html` và `pt-portal.html` để dropdown thông báo luôn hiển thị đè lên trên các thẻ đếm và các thành phần giao diện khác phía dưới.
- **Kết quả**: Hoàn thành xuất sắc, giao diện dropdown trên web hiển thị đúng vị trí chồng xếp lớp, thông báo trên mobile app sinh động, thân thiện và tối ưu trải nghiệm đọc.

### 22/05/2026 09:00 — Tích Hợp Cổng Thanh Toán PayOS, Đồng Bộ Chi Nhánh & Tự Động Kích Hoạt Gói Tập Nối Tiếp
- **Loại**: Tính năng mới & Đồng bộ hệ thống (Fullstack)
- **File chỉnh sửa/thêm mới**:
  - `FE/assets/data/branches.json` [NEW] — Định nghĩa danh sách 12 chi nhánh dùng chung tại TP.HCM.
  - `BE/src/utils/payos.js` [NEW] — Khởi tạo SDK PayOS và định nghĩa các hàm helper xử lý mô tả đơn hàng, tạo link thanh toán, kiểm tra trạng thái giao dịch.
  - `BE/src/controllers/branches.controller.js` [NEW] — Controller trả về danh sách chi nhánh từ file JSON dùng chung.
  - `BE/src/routes/branches.routes.js` [NEW] — Route công khai `/api/branches` để Mobile App và Web Admin cùng fetch dữ liệu.
  - `BE/src/config/db.js` — Thực hiện Migration v11 thêm 3 cột `payos_order_code`, `payos_status` và `chi_nhanh_mua` vào bảng `dang_ky_goi_tap`.
  - `BE/src/controllers/members.controller.js` —
    - Nâng cấp `requestPackageRenewal` tự động kiểm tra thời hạn gói cũ và cộng dồn nối tiếp (`tu_ngay = den_ngay_goi_cu + 1`), hỗ trợ chọn chi nhánh và tạo link thanh toán PayOS.
    - Bổ sung hàm `checkPayosStatus` cho phép polling trạng thái giao dịch từ Mobile App, tự kích hoạt gói nếu bắt đầu hôm nay hoặc giữ trạng thái chờ để kích hoạt nối tiếp sau này.
    - Cập nhật `approvePackageRequest` tự động giữ trạng thái `'cho_duyet'` thay vì kích hoạt ngay nếu ngày bắt đầu gói duyệt thủ công nằm ở tương lai.
    - Tối ưu hóa `getPackageRequests` để loại trừ những yêu cầu đã thanh toán hoặc đã duyệt thành công nhưng đang chờ đến ngày kích hoạt.
  - `BE/src/jobs/cron-daily.js` — Nâng cấp công việc hàng ngày lúc 08:00 tự động quét và kích hoạt các gói tập đã thanh toán/được duyệt khi đến ngày bắt đầu (`tu_ngay`), kèm thông báo đến người dùng và admin.
  - `MobileApp/src/screens/member/PackageDetailScreen.js` [NEW] — Giao diện hiển thị chi tiết gói tập, quyền lợi hội viên và nút mua ngay.
  - `MobileApp/src/screens/member/OrderConfirmationScreen.js` [NEW] — Màn hình xác nhận thanh toán, hỗ trợ chọn chi nhánh từ API, chọn phương thức thanh toán, hiển thị QR code của PayOS và polling kiểm tra giao dịch tự động.
  - `FE/assets/js/pages/member-add.js` & `FE/assets/js/pages/members-list.js` — Thay thế danh sách chi nhánh tĩnh bằng cách gọi API động `/api/branches`.
  - `FE/assets/js/pages/expired.js` — Cập nhật giao diện lễ tân hiển thị badge PayOS (Đã thanh toán / Chờ thanh toán) và chi nhánh mua gói, tự động chọn phương thức chuyển khoản và điền ghi chú giao dịch khi duyệt gói đã thanh toán qua PayOS.
- **Mô tả chi tiết**:
  - **Tự động nối tiếp**: Giải quyết triệt để vấn đề chồng chéo thời gian khi hội viên mua gói mới lúc gói cũ còn hạn. Gói mới sẽ tự động được đặt ngày bắt đầu nối tiếp và chỉ chuyển sang trạng thái hoạt động vào đúng ngày bắt đầu thông qua Cron Job hàng ngày.
  - **Thanh toán PayOS**: Tích hợp thanh toán QR VietQR tự động, phản hồi realtime giúp hội viên mua gói và tự kích hoạt không cần lễ tân duyệt thủ công.
- **Kết quả**: Hệ thống mua gói và thanh toán tự động hoạt động mượt mà, đồng bộ hoàn hảo dữ liệu chi nhánh và luồng nghiệp vụ trên toàn hệ thống.

### 19/05/2026 15:40 — Cải Tiến Giao Diện Thẻ Học Viên Của Tôi (PT Portal)
- **Loại**: Cải tiến giao diện (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pt-portal.js`
- **Mô tả chi tiết**:
  - **Đồng bộ ngôn ngữ thiết kế**: Thiết kế lại hoàn toàn thẻ học viên trong mục "Học viên của tôi" để đồng bộ với ngôn ngữ thiết kế hiện đại của mục "Lịch tập".
  - **Nâng cấp UI/UX**: Thêm thanh viền gradient (accent bar), hiệu ứng đổ bóng (shadow) và di chuột (hover). Cấu trúc lại lưới thông số (Đã tập/Còn lại/Tổng) bằng layout hiển thị rõ ràng với `bg-surface-container-low`. Thêm hiệu ứng cảnh báo (pulsing dot) cho các học viên sắp hết buổi.
- **Kết quả**: Giao diện quản lý học viên đẹp mắt, chuyên nghiệp và nhất quán hơn.

### 19/05/2026 15:35 — Khắc Phục Lỗi Hiển Thị Dữ Liệu Học Viên Trong PT Portal
- **Loại**: Sửa lỗi khớp nối dữ liệu (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pt-portal.js` —
    - Ánh xạ các trường dữ liệu từ API (`so_buoi_da_tap` -> `buoi_da_tap`, `so_buoi_dang_ky` -> `tong_buoi_dk`, `den_ngay` -> `ngay_het_han`) khi lưu thông tin vào `window.GymApp.data.myStudents` trong hàm `init()` của tab học viên của tôi.
    - Sửa lỗi chính tả đường dẫn API tạo lịch mới từ `/pt/my-members` thành `/pt/schedules/my-members`.
- **Mô tả chi tiết**:
  - **Sửa hiển thị sai thông tin**: API trả về định dạng SQL Snake Case (`so_buoi_da_tap`, `so_buoi_dang_ky`, `den_ngay`) nhưng phía giao diện render lại dùng các trường custom (`buoi_da_tap`, `tong_buoi_dk`, `ngay_het_han`), dẫn đến tình trạng sau khi xác nhận đã dạy xong, thông tin trên card học viên bị reset/hiển thị sai dữ liệu (Đã tập: 0, Tiến độ: 0%).
- **Kết quả**: Dữ liệu tiến độ, tổng số buổi và ngày hết hạn hiển thị hoàn toàn chính xác trên card thông tin học viên.

### 19/05/2026 15:30 — Sửa Lỗi Màu Sắc Nút Lưu Ghi Chú Trong PT Portal
- **Loại**: Cải tiến giao diện người dùng (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pt-portal.js` — Thay đổi thuộc tính inline `background: var(--brand-primary)` của nút "Lưu ghi chú" (`btn-save-note`) thành mã màu xanh lục đặc trưng `#1D9336`.
- **Mô tả chi tiết**:
  - **Sửa nút bị trắng**: Trước đó nút này sử dụng biến CSS `var(--brand-primary)` vốn chưa được định nghĩa trong hệ thống CSS tĩnh khiến nút bị mất màu nền (chuyển thành màu trắng). Việc sửa lại màu nền cụ thể giúp nút hiển thị đồng bộ với thiết kế giao diện chung của PT Portal.
- **Kết quả**: Nút "Lưu ghi chú" đã hiển thị màu xanh lục chính xác, đồng bộ hoàn toàn với các nút khác.

### 19/05/2026 15:25 — Khóa Tài Khoản Đăng Nhập Khi Xóa Hồ Sơ
- **Loại**: Cải tiến logic nghiệp vụ & Bảo mật hệ thống (Backend)
- **File chỉnh sửa**:
  - `BE/src/controllers/members.controller.js` — Trong hàm `deleteMember`, cập nhật trạng thái `trang_thai = 'khoa'` cho tài khoản tương ứng với hồ sơ hội viên bị xóa.
  - `BE/src/controllers/trainers.controller.js` — Trong hàm `deleteTrainer`, cập nhật trạng thái `trang_thai = 'khoa'` cho tài khoản tương ứng với hồ sơ PT bị xóa.
  - `BE/src/controllers/staff.controller.js` — Trong hàm `deleteStaff`, cập nhật trạng thái `trang_thai = 'khoa'` cho tài khoản tương ứng với hồ sơ nhân viên bị xóa.
- **Mô tả chi tiết**:
  - **Chặn đăng nhập của tài khoản đã bị xóa**: Khi thực hiện xóa mềm hồ sơ của bất kỳ hội viên, PT hoặc nhân viên nào, tài khoản đăng nhập (`tai_khoan`) liên kết với hồ sơ đó cũng sẽ được cập nhật trạng thái thành `'khoa'` (locked) để ngăn chặn truy cập trái phép hoặc tiếp tục sử dụng hệ thống.
- **Kết quả**: Tài khoản của hồ sơ bị xóa sẽ tự động bị chặn đăng nhập ngay lập tức.

### 19/05/2026 15:20 — Khắc Phục Lỗi 404 Khi Tải Lịch Sử Check-in & QR Code Của Tài Khoản Thiếu Hồ Sơ
- **Loại**: Vá lỗi (Backend)
- **File chỉnh sửa**:
  - `BE/src/controllers/checkins.controller.js` — Thêm cơ chế fallback tìm kiếm hồ sơ khi tài khoản đã bị xóa hồ sơ hoặc chưa liên kết hoàn chỉnh, trả về mảng rỗng thay vì ném lỗi 404 gây lỗi giao diện.
  - `BE/src/controllers/qr-checkin.controller.js` — Thêm cơ chế fallback và sinh thông tin hồ sơ tạm thời (`TEMP_id`) dựa trên tài khoản khi gặp trường hợp profile của tài khoản đó bị soft-delete hoặc chưa được liên kết, ngăn chặn 404 và giúp màn hình hiển thị bình thường.
- **Mô tả chi tiết**:
  - **Khắc phục lỗi giao diện**: Ngăn chặn lỗi JavaScript trên console của Web Member Portal khi truy cập danh mục check-in và hiển thị QR Code của những tài khoản thử nghiệm chưa hoàn thiện hoặc đã bị xóa mềm hồ sơ.
- **Kết quả**: Giải quyết hoàn toàn lỗi console, khôi phục giao diện hoạt động bình thường.

### 19/05/2026 15:15 — Chặn Trùng Lặp Yêu Cầu Gia Hạn & Tự Động Cộng Dồn Thời Gian Nối Tiếp Gói Cũ
- **Loại**: Cải tiến logic nghiệp vụ & Bảo mật dữ liệu (Backend)
- **File chỉnh sửa**:
  - `BE/src/controllers/members.controller.js` — Thêm bước kiểm tra sự tồn tại của yêu cầu ở trạng thái `cho_duyet`. Nếu có, trả về lỗi 400 để chặn spam. Tự động kiểm tra thời hạn gói cũ đang hoạt động và điều chỉnh ngày bắt đầu `tu_ngay` của yêu cầu gia hạn mới thành `den_ngay_cu + 1 ngày` để cộng dồn nối tiếp, tránh chồng chéo.
- **Mô tả chi tiết**:
  - **Chống spam**: Bảo vệ hệ thống khỏi việc hội viên gửi liên tục nhiều yêu cầu gia hạn cùng lúc.
  - **Cộng dồn tự động**: Tính toán ngày hiệu lực hoàn toàn ở Backend để đảm bảo quyền lợi thời gian sử dụng gói tập của hội viên, bất kể ngày gửi yêu cầu là khi nào.
- **Kết quả**: Dữ liệu đồng bộ trực tiếp lên Mobile App và Web Portal.

### 19/05/2026 15:10 — Sửa Lỗi Logic Nghiệp Vụ, Cơ Sở Dữ Liệu & Hợp Đồng PT
- **Loại**: Sửa lỗi logic nghiệp vụ, bảo mật check-in & cơ sở dữ liệu (Backend)
- **File chỉnh sửa**:
  - `BE/src/controllers/qr-checkin.controller.js` — Thêm điều kiện `tu_ngay <= today` khi truy vấn gói đang hoạt động để tránh check-in sớm. Tự động cập nhật `da_checkin = 1` cho các buổi tập PT hôm nay của hội viên khi quét QR vào phòng thành công.
  - `BE/src/controllers/checkins.controller.js` — Tự động cập nhật `da_checkin = 1` cho các buổi tập PT hôm nay của hội viên khi lễ tân check-in thủ công thành công.
  - `BE/src/controllers/pt-registrations.controller.js` — Thay thế join nhầm bảng từ `goi_tap` thành `goi_pt` để hiển thị chính xác tên gói tập PT của học viên.
  - `BE/src/controllers/pt-schedules.controller.js` — Thêm ràng buộc số buổi lên lịch (đã tập + chờ tập) không vượt quá `so_buoi_dang_ky` của hợp đồng PT. Thêm kiểm tra trùng lịch tập phía hội viên trước khi xếp lịch mới.
  - `BE/src/jobs/cron-daily.js` — Tích hợp câu lệnh tự động cập nhật `trang_thai = 'het_han'` (với gói tập) và `'hoan_thanh'` (với gói PT) khi đã quá hạn hoặc hoàn thành số buổi tập vào đầu job chạy hàng ngày lúc 08:00.
- **Mô tả chi tiết**:
  - **Bảo mật check-in**: Ngăn chặn hoàn toàn việc hội viên có gói tập đã được duyệt kích hoạt ở tương lai nhưng vẫn check-in được vào phòng tập hôm nay.
  - **Tự động hóa PT session**: Cập nhật chỉ số `da_checkin = 1` giúp kích hoạt hoàn hảo cron job tự động xác nhận hoàn thành buổi tập lúc 22:00.
  - **Ràng buộc lịch PT**: Bảo đảm không xếp trùng lịch hội viên và không cho phép PT xếp lịch vượt số buổi hội viên đã mua.
- **Kết quả**: Thành công 100%, bảo đảm tính nhất quán dữ liệu và nghiệp vụ phòng tập.

### 19/05/2026 14:45 — Gộp Mục Yêu Cầu Gia Hạn Vào Trang Hết Hạn / Sắp Hết Hạn
- **Loại**: Cải tiến cấu trúc giao diện & Tối ưu hóa UI/UX (Frontend)
- **File chỉnh sửa**:
  - `FE/index.html` — Xóa bỏ menu con "Yêu cầu gia hạn", gắn `pkg-req-badge` vào menu "Hết hạn / Sắp hết hạn", loại bỏ script nhúng cũ.
  - `FE/assets/js/app.js` — Cấu hình lại PAGE_TITLES và SUB_PAGES để loại bỏ trang `package-requests`.
  - `FE/assets/js/pages/expired.js` — Thêm giao diện Mobile Card View cho danh sách Yêu cầu, sửa lỗi hàm gọi `refreshData` thành `fetchInitialData`.
  - `FE/assets/js/pages/package-requests.js` — Làm sạch và đánh dấu deprecate cho file cũ.
- **Mô tả chi tiết**:
  - **Tối ưu hóa Sidebar**: Giảm thiểu sự phức tạp của sidebar bằng cách loại bỏ liên kết trực tiếp tới trang yêu cầu gia hạn trùng lặp. Đưa huy hiệu báo tin màu đỏ sang mục Hết hạn / Sắp hết hạn để người dùng dễ theo dõi.
  - **Trải nghiệm di động (Mobile Card View)**: Tab "Yêu cầu" trên trang Hết hạn hiện đã hiển thị dạng thẻ đẹp mắt khi truy cập trên thiết bị di động, thay vì vỡ giao diện dạng bảng.
  - **Khắc phục lỗi logic**: Sửa triệt để bug gọi hàm `refreshData` (hàm không tồn tại) gây lỗi ngưng xử lý JS sau khi admin thực hiện duyệt/từ chối yêu cầu.
- **Kết quả**: Thành công 100%, cấu trúc module quản lý gói hết hạn và yêu cầu gia hạn gọn gàng, chạy ổn định và không còn trùng lặp.

### 19/05/2026 14:30 — Đồng Bộ Hóa Trạng Thái Gói Chờ Duyệt Giữa Mobile App Và Web Portal
- **Loại**: Đồng bộ hóa tính năng & Nâng cấp UI/UX (Fullstack)
- **File chỉnh sửa**:
  - `FE/assets/js/member-portal.js` — Cập nhật Dashboard và Hồ sơ cá nhân của Cổng hội viên để hiển thị trạng thái của gói chờ duyệt và ẩn/vô hiệu hóa nút đăng ký gia hạn khi có yêu cầu đang chờ duyệt.
  - `FE/assets/js/app.js` — Thêm các trạng thái `cho_duyet` (Chờ duyệt) và `huy` (Bị từ chối) vào bộ định dạng badge và nhãn chung của hệ thống.
  - `FE/member-portal.html` & `FE/pt-portal.html` — Đồng bộ hóa các hàm định dạng hiển thị badge và nhãn trạng thái bản cục bộ trên các trang HTML.
- **Mô tả chi tiết**:
  - **Cổng hội viên (Web Portal)**: Cập nhật giao diện khi người dùng có yêu cầu gia hạn đang chờ duyệt. Tránh việc gửi yêu cầu trùng lặp bằng cách chuyển đổi nút "Gia hạn" sang trạng thái disabled "Đang chờ duyệt...". Bổ sung hiển thị thông tin gói đang chờ duyệt tại phần Stats và Tình trạng hội viên (Ghi chú & Trạng thái).
  - **Đồng bộ hóa nhãn trạng thái**: Đảm bảo tất cả các badge và chuỗi văn bản liên quan đến trạng thái gói đăng ký hoặc gia hạn hiển thị đúng màu sắc và nhãn tương ứng trên mọi portal (Member Portal, PT Portal, và Admin Portal).
- **Kết quả**: Thành công 100%, luồng gia hạn hoạt động liền mạch và đồng bộ toàn diện giữa Mobile App và các Portal Web.

### 18/05/2026 19:00 — Tối Ưu Hóa Giao Diện Card (Loại Bỏ Khung Viền Vuông Avatar)
- **Loại**: Cải tiến giao diện & Tối ưu hóa thẩm mỹ UI (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/members-list.js` — Loại bỏ thẻ bao ngoài `member-card-avatar-wrapper` (khung viền vuông bo góc có border màu xanh) xung quanh ảnh đại diện của cả hai tab **Hội viên** và **Huấn luyện viên (PT)**.
- **Mô tả chi tiết**:
  - **Thiết kế mượt mà hơn**: Thay thế khung vuông bao ngoài rườm rà bằng cách hiển thị trực tiếp ảnh đại diện dạng tròn nguyên bản của hệ thống, giúp tổng thể card trở nên thanh thoát, tinh gọn và tôn lên nét cao cấp của thiết kế Material 3.
  - **Đồng bộ hóa vị trí chấm trạng thái**: Đưa chấm nhỏ chỉ báo hoạt động (online/offline) bám chính xác vào góc dưới bên phải của vòng tròn ảnh đại diện, tạo trải nghiệm trực quan đồng bộ như các nền tảng chat/dashboard hàng đầu hiện nay.
- **Kết quả**: Thành công 100%, giao diện được tối giản hóa sang trọng, đúng ý người dùng.

### 18/05/2026 18:45 — Đồng Bộ & Chuẩn Hóa Phương Thức Thanh Toán (Chỉ Giữ Tiền Mặt & Chuyển Khoản)
- **Loại**: Cải tiến bảo mật, Đồng bộ & Đơn giản hóa quy trình tài chính (Fullstack)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/members-list.js` — Cập nhật các select box `pkg-payment-method` (thêm gói tập) và `ptreg-payment` (đăng ký gói PT) chỉ giữ lại hai lựa chọn: "Tiền mặt" (`tien_mat`) và "Chuyển khoản" (`chuyen_khoan`). Loại bỏ hoàn toàn các tùy chọn "Thẻ", "MoMo", "ZaloPay", "Khác" không nằm trong quy chuẩn.
  - `FE/assets/js/pages/expired.js` — Loại bỏ tùy chọn "Quẹt thẻ" (`the`) trong dropdown phương thức thanh toán của modal duyệt gia hạn.
  - `BE/src/controllers/members.controller.js` — Thêm kiểm tra validation nghiêm ngặt trên backend tại các API đăng ký gói tập (`registerPackage`), chỉnh sửa gói tập (`editPackage`), chuyển gói tập (`switchPackage`), và duyệt gia hạn (`approvePackageRequest`).
  - `BE/src/controllers/pt-registrations.controller.js` — Cập nhật `validTT` chỉ cho phép `tien_mat` và `chuyen_khoan` trong API đăng ký gói PT cho hội viên.
- **Mô tả chi tiết**:
  - **Kiểm soát chặt chẽ**: Đồng bộ toàn bộ các biểu mẫu tài chính trên cả giao diện quản lý hội viên, huấn luyện viên, gia hạn, chuyển gói để thống nhất hai phương thức thanh toán chính thống của trung tâm.
  - **An toàn tối đa**: Rà soát và thêm ràng buộc dữ liệu tại tầng backend để loại bỏ hoàn toàn các yêu cầu giao dịch bất hợp lệ gửi trực tiếp qua API.
- **Kết quả**: Thành công 100%, bảo mật dòng tiền tối ưu, kiểm soát chính sách tài chính của phòng GYM nghiêm ngặt.

### 18/05/2026 18:30 — Loại bỏ Trạng Thái "Sắp Kích Hoạt" Rườm Rà & Đơn Giản Hóa Luồng Nghiệp Vụ Gói Tập
- **Loại**: Cải tiến giao diện & Đơn giản hóa quy trình nghiệp vụ (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/members-list.js` — Xóa bỏ hoàn toàn khu vực tiêu đề "Sắp kích hoạt". Gộp các gói có ngày bắt đầu ở tương lai chung vào danh sách "Lịch sử & Gói khác", hiển thị thẻ "Chờ kích hoạt" tinh tế để lễ tân dễ dàng theo dõi.
  - `FE/assets/js/pages/member-add.js` — Loại bỏ dropdown "Trạng thái" rườm rà khi tạo mới/đăng ký gói tập, vì hệ thống tự động gán hoạt động dựa trên thời gian bắt đầu thực tế, giảm thiểu bước thao tác cho lễ tân.
- **Mô tả chi tiết**:
  - **Đơn giản hóa tuyệt đối**: Giao diện quản lý gói tập của hội viên giờ chỉ còn 2 phần trực quan: "Đang sử dụng" (Gói đang hoạt động) và "Lịch sử & Gói khác" (Tất cả các gói khác).
  - **Tránh Reference Error**: Khai báo biến `today` tại đầu hàm hiển thị tab `package` để định dạng nhãn trạng thái chính xác dựa theo thời gian thực mà không bị crash ứng dụng.
- **Kết quả**: Thành công 100%, giao diện tinh gọn và sang trọng, nghiệp vụ đơn giản hóa tối đa.

### 18/05/2026 18:15 — Cập Nhật Bộ Gợi Ý Quê Quán Thành 34 Tỉnh Thành Mới & Đồng Bộ Hóa Web & Mobile
- **Loại**: Cải tiến nghiệp vụ hành chính & Trải nghiệm người dùng (Frontend & Mobile)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/member-add.js` — Thay thế danh sách 63 tỉnh thành cũ của `dl-que-quan` datalist thành 34 tỉnh thành mới đã hợp nhất theo đúng quy hoạch địa giới hành chính hiện hành. Sắp xếp thứ tự bảng chữ cái để thuận tiện cho việc chọn.
- **Mô tả chi tiết**:
  - **34 Tỉnh thành mới**: Cập nhật danh sách Quê quán sang danh sách 34 tỉnh thành đã sáp nhập (Ví dụ: Hợp nhất Bà Rịa - Vũng Tàu, Bình Dương và TP.HCM đặt tại TP.HCM; Hợp nhất Bắc Kạn và Thái Nguyên đặt tại Thái Nguyên,...).
  - **Đồng bộ hóa tuyệt đối Web và Mobile**: Nhờ cấu trúc lưu trữ dữ liệu đồng bộ dạng chuỗi văn bản và cơ chế lọc địa chỉ hiển thị `.filter(Boolean).join(', ')` thông minh, hệ thống hiển thị địa chỉ trên cả giao diện Web Admin, Web Portal và Mobile App (`MobileApp/src/screens/member/MemberProfileScreen.js`) đều tự động tương thích và hiển thị trơn tru, tuyệt đối không bị lỗi thừa dấu phẩy hay lỗi hiển thị nào khác.
- **Kết quả**: Thành công tuyệt đối, đồng bộ hoàn hảo.

### 18/05/2026 18:00 — Nâng Cấp Bộ Chọn Địa Chỉ Hành Chính Mới Cho TP.HCM & Tích Hợp Datalist Search Cho Phường/Xã
- **Loại**: Cải tiến giao diện & Nâng cấp nghiệp vụ hành chính (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/member-add.js` — Thay thế dropdown select truyền thống của Phường/Xã bằng thẻ `<input>` tích hợp `<datalist>`. Tải thêm dữ liệu hành chính mới nhất của TP.HCM [hanh_chinh_tphcm.json](file:///d:/UI%20GYM/FE/assets/data/hanh_chinh_tphcm.json). Cập nhật sự kiện `change` của `#reg-tinh-thanh` để tự động ẩn ô chọn Quận / Huyện và nạp trực tiếp danh sách phường mới nhất đã chuẩn hóa (loại bỏ trùng lặp và sắp xếp bảng chữ cái) vào datalist.
- **Mô tả chi tiết**:
  - **Tích hợp Datalist Search**: Thay vì hiển thị dropdown select cuộn dài khó tìm kiếm, trường Phường/Xã giờ đây cho phép người dùng **vừa nhập tìm kiếm nhanh vừa chọn** gợi ý tự động (Datalist Autocomplete).
  - **Ẩn Quận / Huyện**: Khi chọn "Thành phố Hồ Chí Minh" (mã `"79"`), dropdown Quận/Huyện tự động ẩn đi để giảm bớt bước chọn trung gian.
  - **Tải Phường Mới Trực Tiếp**: Trích xuất các phường mới nhất thuộc HCMC từ file dữ liệu mới và điền trực tiếp vào datalist Phường/Xã. Đối với các tỉnh thành khác, luồng chọn 3 cấp (Tỉnh -> Quận -> Phường) vẫn chạy mượt mà và tự động điền các phường thuộc Quận/Huyện tương ứng vào datalist gợi ý.
  - **Đồng bộ hóa hiển thị**: Tương thích hoàn hảo với database và các màn hình hiển thị địa chỉ khác nhờ cấu hình lấy giá trị văn bản trực tiếp.
- **Kết quả**: Thành công tuyệt đối, mang lại trải nghiệm nhập liệu siêu tốc.

### 18/05/2026 17:45 — Sửa Nút Đóng Modal Chỉnh Sửa Hồ Sơ & Nâng Cấp Dấu (*) Bắt Buộc Màu Đỏ
- **Loại**: Cải tiến giao diện & Sửa lỗi UX (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/members-list.js` — Thiết lập `z-index: 50` trên nút đóng `close-edit-member` để tránh bị đè bởi các phần tử tương đối cùng cấp. Thay thế các dấu asterisk `*` thô cũ thành thẻ `<span style="color:#ba1a1a;">*</span>` chuẩn màu đỏ thương hiệu.
  - `FE/assets/js/pages/member-add.js` — Cấu hình lại hai helper `_field` và `_select` để tự động parse dấu `*` và thay thế thành màu đỏ chuẩn. Đồng bộ hóa các nhãn nhập liệu tĩnh để hiển thị dấu `*` màu đỏ rực rỡ nhất.
- **Mô tả chi tiết**:
  - **Sự cố nút đóng bị đơ/chập chờn**: Do modal chỉnh sửa hồ sơ hội viên có cấu trúc header xếp chồng nhiều phần tử tuyệt đối (`position:absolute`) và tương đối (`position:relative; z-index:1`) nhưng nút close `x` lại thiếu chỉ số xếp chồng `z-index`, dẫn đến việc click chuột đôi khi bị các phần tử khác che phủ ngầm.
  - **Giải pháp**: Gán `z-index: 50` trực tiếp cho nút đóng.
  - **Đồng bộ hóa dấu sao đỏ bắt buộc**: Toàn bộ dấu `*` ở các trường bắt buộc của module Quản lý Hội viên, PT, và Tạo tài khoản đăng nhập đều đã được đồng bộ sang màu đỏ đậm (#ba1a1a) chuyên nghiệp.
- **Kết quả**: Thành công tuyệt đối.

### 18/05/2026 10:15 — Thiết Kế Lại Toàn Diện Trang Sinh Nhật Premium & Đại Tiệc Ăn Mừng
- **Loại**: Cải tiến giao diện & Trải nghiệm tương tác (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/birthday.js` — Thay thế giao diện dạng bảng đơn điệu bằng Grid 12 Card tương ứng 12 tháng. Mỗi card được gán gradient màu sắc theo mùa (Xuân/Hạ/Thu/Đông) có độ tương phản cực sắc nét ở cả Dark/Light Mode.
- **Mô tả chi tiết nâng cấp**:
  - **Kiến trúc Grid Card Mùa**: Thiết kế 12 card biểu trưng cho 12 tháng, làm nổi bật "Tháng hiện tại" bằng viền phát sáng và badge nhấp nháy, gắn badge "Đông nhất" cho tháng có số lượng sinh nhật cao nhất.
  - **Hiệu ứng Bánh kem & Bóng bông Di động**: Tích hợp các emoji 🎂 và 🎈 di chuyển nhẹ nhàng (breath animation) tại phần header của mỗi card tháng. Khi di chuyển chuột vào (hover), các emoji sẽ nhảy nảy (bounce animation) vô cùng sống động.
  - **Đại tiệc tương tác toàn màn hình**: Nâng cấp chức năng "Bắn hiệu ứng" và "Đại tiệc" thành hệ thống cascade đa tầng: Confetti rơi xoay, bóng bay 🎈 và bánh kem 🎂 khổng lồ bay lên từ đáy màn hình, bong bóng thủy tinh glassmorphic 🫧 nổi lên, và một banner trung tâm kính mờ hiển thị lời chúc mừng siêu sang trọng.
  - **Click-to-Pop đặc biệt**: Người dùng có thể click chuột vào bất kỳ điểm nào trên màn hình khi hiệu ứng đang chạy để tạo thêm các cụm pháo hoa và emoji nổ ra tại vị trí con trỏ chuột.
  - **Đồng bộ hóa Dark Mode hoàn hảo**: Màu sắc, độ bóng viền, và chữ hiển thị của các banner/particles được tinh chỉnh tự động tương thích với theme Dark/Light.
- **Kết quả**: Thành công tuyệt đối, mang lại trải nghiệm WOW vượt trội.

### 18/05/2026 11:00 — Nâng Cấp Giao Diện Bộ Chọn Ngày Sinh (Date Picker Calendar)
- **Loại**: Cải tiến giao diện & Trải nghiệm (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/app.js` — Cấu hình lại ngôn ngữ hiển thị tiếng Việt, các nhãn hiển thị tháng và hàm tùy chỉnh tiêu đề lịch cho bộ chọn ngày `AirDatepicker`.
  - `FE/assets/css/main.css` — Thay đổi bo góc các ô chọn lịch (cells) từ hình tròn sang hình vuông bo góc mềm mại.
- **Mô tả chi tiết**:
  - **Sự cố / Yêu cầu**:
    - Tiêu đề tháng hiển thị định dạng cũ có dấu phẩy và in hoa (ví dụ: "Tháng 5, 2026") làm mất đi sự tối giản.
    - Trong lưới chọn tháng nhanh, các tháng hiển thị viết tắt dạng "Th 1", "Th 2",... thay vì viết đầy đủ và không in hoa.
    - Các ô chọn ngày, tháng, năm hiển thị dưới dạng hình tròn thay vì hình vuông bo góc mềm mại.
  - **Giải pháp**:
    - **Tiêu đề không dấu phẩy & chữ thường**: Bổ sung cấu hình `navTitles.days` tùy chỉnh cho `AirDatepicker` để lấy tên tháng từ locale viết hoàn toàn bằng chữ thường và hiển thị nối tiếp với năm mà không có dấu phẩy (ví dụ: "tháng 5 2026").
    - **Hiển thị tháng đầy đủ**: Thay đổi các mảng `months` và `monthsShort` trong `localeVi` thành chữ viết thường đầy đủ (ví dụ: "tháng 1", "tháng 2",...) thay vì viết tắt.
    - **Bo góc mềm mại dạng ô vuông**: Thay đổi biến CSS `--adp-cell-border-radius` của lịch từ `50%` (hình tròn) thành `8px` (hình vuông bo góc nhẹ nhàng).
- **Kết quả**: Thành công vượt trội, bộ chọn lịch hiển thị đồng bộ, hiện đại, thân thiện và cực kỳ cao cấp.

### 18/05/2026 10:45 — Thiết Kế Lại Toàn Diện Modal Duyệt Gia Hạn Gói Tập
- **Loại**: Cải tiến giao diện & Trải nghiệm (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/expired.js` — Thiết kế lại hoàn toàn cấu trúc HTML và CSS của modal xác nhận duyệt gia hạn gói tập (`modal-approve-renewal`).
- **Mô tả chi tiết**:
  - **Sự cố**: Các ô nhập liệu (`input`, `select`), khoảng đệm (`padding`), cỡ chữ (`font-size`), và nút bấm trong modal duyệt gia hạn cũ hiển thị quá to so với chuẩn chung của hệ thống, phá vỡ trải nghiệm thống nhất.
  - **Giải pháp**:
    - Thu nhỏ các input từ `py-4 text-headline-sm` về `py-2 text-body-sm font-black` (bằng chuẩn form chung).
    - Thay thế bo góc thô `rounded-[28px]` bằng `rounded-2xl` mượt mà, chuyên nghiệp.
    - Cải tiến phần thẻ thông tin yêu cầu gói tập (`Gói tập`, `Thời gian gia hạn`) thành dạng bento box thu nhỏ với viền mảnh sang trọng.
    - Chuẩn hóa các nút hành động (`Hủy bỏ`, `Duyệt gia hạn`) từ `py-3 rounded-2xl` sang `py-2 rounded-xl text-body-sm font-bold/black` để đồng nhất 100% với các modal khác trong Dashboard.
- **Kết quả**: Thành công, giao diện cân đối, gọn gàng và cao cấp.

### 18/05/2026 10:30 — Sửa Lỗi Trùng Định Tuyến (Route Collision) Endpoint Nội Quy Phòng Tập
- **Loại**: Sửa lỗi hệ thống (Backend)
- **File chỉnh sửa**:
  - `BE/src/routes/config.routes.js` — Di chuyển định tuyến wildcard `router.get('/:khoa')` xuống dưới cùng của danh sách route.
- **Mô tả**: Wildcard `:khoa` được đặt phía trên tĩnh `/rules` và `/rules/all`, dẫn tới việc Express tự động nhận diện `/rules` là tham số khóa cấu hình và trả về mã lỗi 404 (Không tìm thấy cấu hình) cho thiết bị di động (`GymRulesScreen`). Sau khi di chuyển wildcard xuống cuối, định tuyến tĩnh đã hoạt động chính xác hoàn toàn.
- **Kết quả**: Thành công, ứng dụng di động truy xuất nội quy mượt mà không gặp lỗi 404.

### 15/05/2026 09:30 — Tối Ưu Hóa Mật Độ Thông Tin Dashboard (Toàn Diện)
- **Loại**: Cải thiện UI/UX (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/expired.js`, `FE/assets/js/pages/birthday.js`, `FE/assets/js/pages/pt-register.js`, `FE/assets/js/pages/pt-training.js` — Đồng bộ hóa việc giảm khoảng trắng bằng cách thay thế các class utility `gap-loose/margin` và `p-loose/margin` sang `gap-standard/lg` và `p-standard/compact`.
  - Tinh gọn Section Headers, Card padding, và Table cell padding trên toàn bộ các module còn lại.
  - Đảm bảo tính tương thích đa thiết bị (Responsive) sau khi thu hẹp khoảng cách spacing.
- **Mô tả**: Hoàn tất chiến dịch chuẩn hóa mật độ thông tin cho toàn bộ Dashboard Admin, giúp giao diện chuyên nghiệp hơn và hiển thị được nhiều dữ liệu hơn trên cùng một khung hình.
- **Kết quả**: Thành công

### 15/05/2026 08:45 — Tối Ưu Spacing Dashboard, Doanh Thu & Check-in
- **Loại**: Cải thiện UI/UX (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/dashboard.js`, `FE/assets/js/pages/revenue.js`, `FE/assets/js/pages/checkin.js`, `FE/assets/js/pages/packages.js` — Bắt đầu lộ trình tối ưu mật độ thông tin; tinh gọn khoảng cách giữa các stat cards, charts và rows trong bảng dữ liệu.
- **Mô tả**: Áp dụng các spacing tokens `standard` và `compact` mới thay cho các giá trị `loose` cũ để tăng hiệu quả sử dụng không gian màn hình.
- **Kết quả**: Thành công

### 15/05/2026 08:25 — Redesign Modal Chi Tiết PT & Fix Chức Năng Lọc/Sửa
- **Loại**: Cải thiện tính năng & giao diện (Frontend)
- **File chỉnh sửa**:
  - `FE/assets/js/pages/members-list.js` — (1) Thiết kế lại `_showPtModal` theo layout 3 tab (Thông tin / Lịch dạy / Học viên) với banner gradient và quick stats bar; (2) Viết lại `_applyPtFilter` hỗ trợ mapping linh hoạt thuộc tính `chuyen_mon/specialty` và `trang_thai/status` giúp bộ lọc hoạt động chính xác; (3) Sửa lỗi `_showPtEditModal` chuyển sang dùng endpoint chuẩn `/members/:id` và fix payload gửi lên backend; (4) Tối ưu hóa việc thu thập danh sách chuyên môn (unique specialties) trong modal lọc.
- **Mô tả**: Đồng nhất trải nghiệm quản lý PT với quản lý Hội viên. Giải quyết các lỗi tồn đọng về logic lọc dữ liệu và lưu thông tin hồ sơ PT.
- **Kết quả**: Thành công



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

### 20/05/2026 - Bổ sung Hội viên tự xác nhận PT & Xóa mốc 3 tháng doanh thu & Seeding 30 hội viên
- **Loại**: Cập nhật tính năng & Dữ liệu mẫu
- **Mô tả**:
    - Cho phép hội viên vào Member Portal / Mobile App để tự xác nhận buổi tập PT (trạng thái chờ tập).
    - Xóa nút lọc Doanh thu 3 tháng, chuyển thành Hôm nay, 7 ngày, 30 ngày trên FE Web & Mobile App.
    - Viết script tự động thêm 30 hội viên (có tài khoản đăng nhập và gói tập) để dễ dàng test giao diện.
# Cập nhật 22/05/2026 — Đánh giá PT, BMI và luồng PT & Tôi

- **Loại**: Tính năng mới & đồng bộ Web/Mobile/Backend
- **Phạm vi**: `danh_gia_pt`, `pt_toi_nhat_ky`, BMI hồ sơ, rating PT, Web Member/PT Portal và Mobile App.
- **Kết quả**: Hội viên có thể đánh giá/sửa đánh giá PT sau buổi đã hoàn thành; điểm sao PT đồng bộ lên danh sách chọn PT; hồ sơ lưu chiều cao/cân nặng hiện tại để tính BMI; hai bên có luồng trao đổi chung `PT & Tôi` kèm thông báo khi tạo/chỉnh sửa.

### 28/05/2026 09:15 — Thêm mục Nhật ký kiểm tra (Audit Logs) và bộ lọc vai trò
- **Loại**: Tính năng mới & Đồng bộ giao diện (Frontend)
- **File/Thành phần liên quan**: `FE/index.html`, `FE/assets/js/app.js`, `FE/assets/js/pages/audit-logs.js`
- **Mô tả**:
    - Thêm mục "Nhật ký kiểm tra" vào sidebar trong `FE/index.html` và nạp script.
    - Cấu hình route và title trong `FE/assets/js/app.js`.
    - Tạo trang `FE/assets/js/pages/audit-logs.js` hiển thị lịch sử thao tác từ bảng `audit_log`, hỗ trợ lọc nhanh theo 4 vai trò (Quản trị viên, Lễ tân, Huấn luyện viên, Hội viên) và xem tất cả.
    - Hỗ trợ các bộ lọc nâng cao gồm tìm kiếm theo từ khóa tài khoản/họ tên/ghi chú, loại hành động, khoảng thời gian (sử dụng AirDatepicker) và phân trang.
- **Kết quả**: ✅ Hoàn thành tích hợp tính năng nhật ký kiểm tra đồng bộ với backend và style thiết kế hệ thống.

### 29/05/2026 08:30 — Sửa đổi logic gia hạn gói tập/PT, cập nhật giao diện Admin di động và tích hợp thống kê doanh thu
- **Loại**: Cải tiến nghiệp vụ, Nâng cấp UI/UX, Sửa lỗi hệ thống (Fullstack)
- **File/Thành phần liên quan**:
  - `BE/src/config/db.js` (Migration v18 & Triggers doanh thu)
  - `BE/src/controllers/members.controller.js` (Đăng ký gói Gym)
  - `BE/src/controllers/pt-registrations.controller.js` (Đăng ký gói PT)
  - `BE/src/jobs/cron-daily.js` (Cron Job tự động kích hoạt gói)
  - `BE/src/controllers/revenue.controller.js` (API Doanh thu)
  - `FE/assets/js/pages/revenue.js` (Web Doanh thu)
  - `MobileApp/src/screens/admin/AdminRegisterPackageScreen.js` (Mobile Đăng ký gói Gym)
  - `MobileApp/src/screens/admin/AdminRegisterPTScreen.js` (Mobile Đăng ký gói PT)
  - `MobileApp/src/screens/admin/AdminRegisterPTScheduleScreen.js` (Mobile Đặt lịch PT)
  - `MobileApp/src/navigation/AdminNavigator.js` (Mobile Admin Navigation)
  - Màn hình danh sách Admin di động: `AdminMembersScreen.js`, `AdminPTScreen.js`, `AdminPackagesScreen.js`, `AdminExpiredMembersScreen.js`, `AdminPackageRequestsScreen.js`
- **Mô tả**:
  - **Logic Nghiệp vụ Gia hạn (Backend & DB)**: 
    - Áp dụng Migration v18 bổ sung constraint trạng thái `cho_kich_hoat` và nâng cấp các triggers doanh thu để ghi nhận doanh thu của các gói "chờ kích hoạt" ngay tại ngày thanh toán/ngày tạo.
    - Cập nhật backend đăng ký gói tập Gym và PT tự động chuyển trạng thái thành `cho_kich_hoat` nếu ngày bắt đầu lớn hơn ngày hiện tại.
    - Bổ sung Cron Job quét lúc 08:00 hàng ngày để tự động kích hoạt gói `cho_kich_hoat` sang `dang_hoat_dong` khi đến ngày bắt đầu.
    - API Doanh thu hỗ trợ thống kê thêm các gói ở trạng thái `cho_kich_hoat`.
  - **Giao diện di động (Mobile App)**:
    - **Đăng ký gói & PT**: Tự động tính ngày bắt đầu nối tiếp liền kề sau ngày kết thúc của gói cũ và khóa trường ngày bắt đầu để ngăn đăng ký song song sai logic.
    - **Đặt lịch PT**: Chuyển đổi ô nhập giờ bắt đầu/kết thúc viết tay thành dạng dropdown danh sách giờ từ 06:00 đến 21:00 và tự động tính giờ kết thúc bằng giờ bắt đầu cộng 1.5 tiếng.
    - **Icon PT & Phân trang**: Thay đổi icon tab PT thành biểu tượng quả tạ `Dumbbell` thay vì biểu đồ cột. Tích hợp phân trang client-side 10 dòng/trang cho 5 màn hình danh sách Admin di động.
  - **Giao diện Web**: Hiển thị các gói gia hạn mới (`cho_kich_hoat`) trong danh sách giao dịch hôm nay của trang quản lý doanh thu.
- **Kết quả**: ✅ Hoàn thành 100% yêu cầu nghiệp vụ và tối ưu hóa trải nghiệm người dùng.

### 29/05/2026 09:40 — Sửa lỗi CHECK constraint đăng ký PT và điều chỉnh thứ tự/hiển thị tin nhắn PT & Tôi
- **Loại**: Cải tiến giao diện di động, Sửa bug hệ thống (Fullstack)
- **File/Thành phần liên quan**:
  - [db.js](file:///d:/UI%20GYM/BE/src/config/db.js) (Database Migration & Constraints)
  - [PTMeScreen.js](file:///d:/UI%20GYM/MobileApp/src/screens/shared/PTMeScreen.js) (Giao diện di động PT & Tôi)
- **Mô tả**:
  - **Sửa lỗi CHECK constraint**: Cập nhật lại khối Migration v18 trong `db.js` để cưỡng bức tái cấu trúc bảng `dang_ky_pt` khi boot up (bỏ qua điều kiện sql.includes vì có thể schema trong sqlite_master chưa được đồng bộ từ nodemon), đảm bảo trạng thái `cho_kich_hoat` được SQLite chấp nhận hợp lệ khi đăng ký nối tiếp gói PT.
  - **Sắp xếp & Hiển thị tin nhắn**:
    - Sắp xếp các tin nhắn của mục "PT & Tôi" theo thứ tự tin nhắn mới nhất hiển thị lên đầu (sắp xếp giảm dần theo thời gian tạo).
    - Hiển thị ngày đầy đủ và giờ cho mỗi tin nhắn (ví dụ: `08:30 29/05/2026`) thay vì chỉ hiển thị giờ như trước đây.
- **Kết quả**: ✅ Khắc phục hoàn toàn lỗi crash khi đăng ký nối tiếp PT và cải thiện trải nghiệm chat.

### 02/06/2026 10:00 — Chuyển đổi giao diện tab PT sang dạng bảng (Table)
- **Loại**: Chỉnh sửa & Cải tiến UI/UX (Frontend)
- **File**: `FE/assets/js/pages/members-list.js`
- **Mô tả**: 
  - Đã chuyển đổi giao diện hiển thị danh sách huấn luyện viên (PT) từ dạng thẻ (card-based grid) sang dạng bảng (table-based layout) đồng bộ hoàn toàn với tab Hội viên.
  - Sửa wrapper `id="pt-cards-container"` sang dạng full-width (`w-full`) để bảng trải rộng tối đa.
  - Thiết kế lại hàm `_renderPtCards` để render table trên desktop (gồm các cột: Họ tên, Mã HLV, Chuyên môn, Kinh nghiệm, Đánh giá, Trạng thái, Thao tác) và dạng list gọn gàng trên mobile.
  - Tích hợp sự kiện click dòng bảng (`.pt-row`) vào `_bindPtCardEvents` để mở chi tiết PT tương tự như Hội viên.
- **Kết quả**: ✅ Thành công. Giao diện bảng PT đồng bộ, đẹp mắt và các chức năng cũ (Xem, Sửa, Xóa, Lọc, Sắp xếp, Tìm kiếm) hoạt động mượt mà.

### 02/06/2026 10:15 — Sửa lỗi trạng thái PT và Thêm badge vai trò trang Check-in
- **Loại**: Sửa bug & Cải tiến UI/UX (Fullstack)
- **File**: 
  - `BE/src/controllers/trainers.controller.js` (Backend)
  - `FE/assets/js/pages/members-list.js` (Web Frontend - members-list)
  - `FE/assets/js/pages/checkin.js` (Web Frontend - checkin)
- **Mô tả**:
  - **Sửa lỗi trạng thái PT hiển thị "Tạm nghỉ"**: Do Backend SQL select thiếu trường trạng thái tài khoản. Khắc phục bằng cách `LEFT JOIN tai_khoan` và select `COALESCE(tk.trang_thai, 'hoat_dong') AS trang_thai`. Đồng thời sửa Frontend map thêm trạng thái `'kich_hoat'` của tài khoản.
  - **Cải tiến hiển thị check-in**: Bổ sung hiển thị badge loại tài khoản (HLV, HV, Lễ tân, NV) bên cạnh mã hồ sơ của từng người trong danh sách/bảng check-in để dễ phân biệt.
- **Kết quả**: ✅ Khắc phục triệt để lỗi hiển thị sai trạng thái HLV. Thống kê check-in rõ ràng, trực quan hơn.

### [03/06/2026 09:50] — Đồng bộ bộ lọc chi nhánh toàn diện trên Backend và Mobile App
- **Loại**: Cải tiến tính năng & Sửa lỗi đồng bộ (Fullstack)
- **File**:
  - `BE/src/controllers/revenue.controller.js`
  - `BE/src/controllers/pt-registrations.controller.js`
  - `BE/src/controllers/trainers.controller.js`
  - `BE/src/controllers/pt-schedules.controller.js`
  - `MobileApp/src/store/useAuthStore.js`
  - `MobileApp/src/screens/admin/AdminDashboardScreen.js`
  - `MobileApp/src/screens/admin/AdminRevenueScreen.js`
  - `MobileApp/src/screens/admin/AdminPTScreen.js`
  - `MobileApp/src/screens/admin/AdminMembersScreen.js`
- **Mô tả**:
  - **Backend**:
    - Sửa stats.yeu_cau_cho_duyet trong `getDashboard` để lọc theo chi nhánh.
    - Cập nhật các endpoint danh sách đăng ký PT (`getRegistrations`), danh sách huấn luyện viên (`getTrainers`), danh sách lịch tập PT (`getSchedules`) để hỗ trợ lọc theo tham số query `chi_nhanh`.
  - **Mobile App**:
    - Đưa trạng thái `selectedBranch` và `setSelectedBranch` vào Zustand store chung (`useAuthStore.js`) để đồng bộ phiên lọc trên toàn app.
    - Cập nhật màn hình Dashboard, Revenue, PT, và Members để lấy/đổi chi nhánh qua store chung.
    - Bổ sung thanh chọn chi nhánh (ScrollView ngang) và gửi tham số `chi_nhanh` khi gọi API trên màn hình PT và Members.
- **Kết quả**: ✅ Hoàn thành đồng bộ bộ lọc chi nhánh toàn diện giữa Web và Mobile.

### [03/06/2026 15:42] — Tạo script chẩn đoán và sửa lỗi cơ sở dữ liệu SQLite
- **Loại**: Sửa lỗi database (DevOps/Database)
- **File**: `BE/inspect_and_repair.js`, `BE/package.json`
- **Mô tả**: Tạo file `inspect_and_repair.js` để tự động kiểm tra và sửa lỗi database. Người dùng thực hiện dọn dẹp file ghi tạm `.db-wal` và `.db-shm` rồi chạy thành công script sửa lỗi (thực hiện REINDEX và VACUUM thành công). Dọn dẹp lại các file tạm và script trong `package.json`.
- **Kết quả**: ✅ Sửa lỗi hỏng database thành công. Database đã hoạt động bình thường.

### [03/06/2026 15:56] — Triển khai Graceful Shutdown đóng SQLite an toàn
- **Loại**: Cải tiến chất lượng code (Database)
- **File**: `BE/src/config/db.js`
- **Mô tả**: Lắng nghe các sự kiện tắt ứng dụng (`SIGINT`, `SIGTERM`) và đặc biệt là sự kiện restart của nodemon (`SIGUSR2`) để tự động đóng kết nối database bằng `db.close()`, ngăn chặn hỏng cấu trúc file WAL/SHM khi lưu code.
- **Kết quả**: ✅ Tránh triệt để lỗi cơ sở dữ liệu khi phát triển và cập nhật code.

### [04/06/2026 16:35] - S?a l?i hi?n th? sai chi nhnh PT
- **Lo?i**: S?a bug
- **File**: `MobileApp/src/screens/pt/PTScheduleScreen.js`, `BE/src/controllers/auth.controller.js`
- **M t?**: ?i `item.chi_nhanh` thnh `item.chi_nhanh_tap` ? ph?n hi?n th? l?ch d?y c nhn PT. Thm tru?ng `chi_nhanh` vo API getMe c?a BE d? cc file s? d?ng profile c thng tin chi nhnh.
- **K?t qu?**: Thnh cng

### [08/06/2026 08:55] — Khắc phục triệt để lỗ hổng phân quyền chi nhánh & Tối ưu hóa Web FE
- **Loại**: Sửa lỗi bảo mật & Tối ưu hóa (Fullstack)
- **File**: BE/src/controllers/members.controller.js, BE/src/controllers/revenue.controller.js, BE/src/controllers/checkins.controller.js, FE/assets/js/pages/expired.js
- **Mô tả**:
  - **Backend**: Thêm logic ép buộc lọc theo chi nhánh của tài khoản đăng nhập (nếu không phải là admin/chu_phong_gym) trong tất cả các controller của Hội viên, Doanh thu, Dashboard, Checkin. Chặn hoàn toàn khả năng can thiệp/sửa đổi tham số query chi nhánh từ client-side.
  - **Web Frontend**: Sửa đổi expired.js để truyền tham số chi nhánh khi gọi API hội viên hết hạn/gia hạn từ Backend, thay vì tải hết dữ liệu rồi tự lọc ở client. Tăng hiệu năng và đảm bảo dữ liệu không bị rò rỉ.
- **Kết quả**: Thành công

### [08/06/2026 09:13] — Mở rộng rà soát và khắc phục triệt để rò rỉ dữ liệu chi nhánh
- **Loại**: Sửa lỗi bảo mật (Backend)
- **File**: BE/src/controllers/pt-registrations.controller.js, BE/src/controllers/pt-schedules.controller.js, BE/src/controllers/trainers.controller.js, BE/src/controllers/staff.controller.js
- **Mô tả**:
  - Khắc phục lỗ hổng rò rỉ dữ liệu chi nhánh chéo cho các module: Đăng ký PT (getRegistrations), Lịch dạy/lịch tập PT (getSchedules), Danh sách huấn luyện viên (getTrainers), và Danh sách nhân viên/lễ tân (getStaff).
  - Áp dụng cơ chế tự động ghi đè bộ lọc chi nhánh của Backend đối với các tài khoản nhân viên cơ sở để đảm bảo ranh giới dữ liệu an toàn tuyệt đối.
- **Kết quả**: Thành công

### [08/06/2026 09:28] — Sửa luồng tạo hồ sơ trên Web (Hội viên vs PT/Nhân viên)
- **Loại**: Sửa bug (Web Frontend)
- **File**: FE/assets/js/pages/member-add.js
- **Mô tả**: Sửa lỗi tự động chuyển hướng sang tab Đăng ký gói tập sau khi tạo mới hồ sơ là Huấn luyện viên (PT) hoặc Nhân viên. Hiện tại, chỉ loại hồ sơ "Hội viên" mới chuyển sang tab này, các loại khác sẽ hiện thông báo thành công và chuyển hướng về trang danh sách (members-list). Đã kiểm tra Mobile App và xác nhận Mobile không bị lỗi này do luồng xử lý riêng biệt.
- **Kết quả**: Thành công


### [08/06/2026 09:56] — Thiết kế lại Header và Modal chỉnh sửa nhân viên trên Web
- **Loại**: Chỉnh sửa & Cải tiến UI/UX
- **File**: `FE/assets/js/pages/staff.js`
- **Mô tả**: 
  - Tách Header (Tiêu đề và nút ''Thêm nhân viên'', ''Tải lại'') khỏi Filter Bar để tránh đè layout, sửa lỗi thẻ div đóng thừa.
  - Viết lại hàm `_showEditStaffModal` để hiển thị Modal chỉnh sửa thông tin nhân viên tại chỗ kèm tải ảnh đại diện và lưu trực tiếp qua API `PUT /staff/:id` thay vì điều hướng qua trang thêm.
  - Sửa khớp ID của sự kiện click nút Tải lại từ `staff-staff-reload` thành `btn-staff-reload`.
- **Kết quả**: Thành công, giao diện hiển thị gọn gàng, luồng chỉnh sửa tại chỗ hoạt động mượt mà.

### [08/06/2026 10:06] — Căn giữa icon thao tác, bỏ required email và sửa hiển thị chi nhánh nhân viên
- **Loại**: Cải tiến UI & Sửa lỗi dữ liệu (Fullstack)
- **File**: 
  - `FE/assets/js/pages/staff.js`
  - `BE/src/controllers/staff.controller.js`
- **Mô tả**: 
  - Căn giữa các icon trong cột thao tác trên bảng nhân viên Web Frontend.
  - Bỏ thuộc tính `required` và dấu bắt buộc ở input email trong Modal chỉnh sửa nhân viên.
  - Sửa lỗi không hiển thị chi nhánh của nhân viên trên bảng bằng cách thêm trường `h.chi_nhanh` vào câu SELECT của hàm `getStaff` ở backend.
- **Kết quả**: Thành công.

### [10/06/2026 12:00] — Sửa lỗi dời lịch tập quá khứ, trùng tên đăng nhập và import useEffect
- **Loại**: Sửa bug (Fullstack)
- **File**: 
  - `MobileApp/src/screens/admin/AdminMemberDetailScreen.js`
  - `BE/src/controllers/pt-schedules.controller.js`
  - `BE/src/controllers/members.controller.js`
  - `FE/assets/js/pages/member-add.js`
- **Mô tả**: 
  - **Mobile App**: Thêm import `useEffect` bị thiếu tại `AdminMemberDetailScreen.js` để khắc phục lỗi văng ứng dụng `ReferenceError: Property 'useEffect' doesn't exist`.
  - **Dời lịch tập**: Viết lại cơ chế xác định ngày và giờ hiện tại theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh`) chuẩn hóa định dạng `YYYY-MM-DD` và `HH:MM` độc lập với môi trường/ICU của hệ thống, giúp sửa triệt để lỗi chặn dời lịch sang ngày trong quá khứ do locale bị fallback.
  - **Tạo tài khoản & Trùng tên đăng nhập**: Thêm hỗ trợ kiểm tra trùng lặp `ten_dang_nhap` ở API `/check-duplicate` phía Backend và tích hợp kiểm tra trước khi lưu hồ sơ ở Frontend `member-add.js` để ngăn chặn rác hồ sơ khi tạo tài khoản bị trùng lặp.
- **Kết quả**: Thành công.

### [10/06/2026 15:11] — Hỗ trợ xem chi tiết hồ sơ PT/Nhân viên và ẩn phần đăng ký gói tập của họ
- **Loại**: Sửa bug & Nghiệp vụ (Fullstack)
- **File**: 
  - `BE/src/controllers/members.controller.js`
  - `MobileApp/src/screens/admin/AdminMemberDetailScreen.js`
- **Mô tả**: 
  - **Backend**: Loại bỏ điều kiện `AND h.loai_ho_so = 'hoi_vien'` trong hàm `getMemberById` để cho phép truy vấn thông tin chi tiết của hồ sơ Nhân viên (`nhan_vien`) và Huấn luyện viên (`pt`), giải quyết triệt để lỗi `Request failed with status code 404` khi mở trang chi tiết hoặc trang chỉnh sửa trên di động.
  - **Mobile App**: Bao bọc phần hiển thị **Gói tập Gym** và **Hợp đồng PT** bằng điều kiện `{member?.loai_ho_so === 'hoi_vien' && (...)}` để ẩn các phần này và ngăn việc hiển thị nút đăng ký/gia hạn gói tập cho Nhân viên/PT. Cập nhật tiêu đề và nhãn phụ hiển thị đúng vai trò của hồ sơ (Huấn luyện viên/Nhân viên) thay vì mặc định hiển thị "Hội viên" hay "Standard".
- **Kết quả**: Thành công.