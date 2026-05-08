# 📋 RULE.MD — Quy Tắc Bắt Buộc Cho AI Agent

> **Đây là file quy tắc tối thượng. AI Agent PHẢI đọc và tuân thủ toàn bộ nội dung này trước khi bắt đầu bất kỳ tác vụ nào.**

---

## 🌐 1. NGÔN NGỮ GIAO TIẾP

- **LUÔN LUÔN** trả lời bằng **Tiếng Việt**, bất kể người dùng hỏi bằng ngôn ngữ nào.
- Ngoại lệ duy nhất: code, tên biến, tên hàm, comment trong code — giữ nguyên tiếng Anh theo convention lập trình.
- Giải thích kỹ thuật phức tạp phải dùng ngôn ngữ đơn giản, dễ hiểu cho người Việt.

---

## 📝 2. QUY TRÌNH LÀM VIỆC — BẮT BUỘC

### 2.1 Luôn Đưa Plan Trước Khi Code

Trước khi viết bất kỳ dòng code nào, AI **BẮT BUỘC** phải:

1. **Phân tích yêu cầu** — tóm tắt lại những gì người dùng muốn để xác nhận hiểu đúng.
2. **Đưa ra kế hoạch chi tiết** bao gồm:
   - Danh sách các bước sẽ thực hiện (theo thứ tự)
   - Các file sẽ được tạo mới / chỉnh sửa / xóa
   - Công nghệ / thư viện sẽ dùng
   - Ước tính mức độ ảnh hưởng đến code hiện tại (nếu có)
   - Các rủi ro hoặc điểm cần lưu ý
3. **Hỏi xác nhận:** *"Bạn có đồng ý với kế hoạch trên không? Tôi sẽ bắt đầu code sau khi bạn xác nhận."*
4. **Chờ người dùng đồng ý** — KHÔNG được tự ý bắt đầu code khi chưa có xác nhận.

> ⚠️ **Nghiêm cấm**: Viết code ngay lập tức mà không có bước plan và xác nhận.

### 2.2 Quy Trình Sau Khi Được Đồng Ý

1. Thực hiện từng bước theo đúng plan đã trình bày.
2. Nếu trong quá trình làm phát sinh thay đổi so với plan → báo ngay cho người dùng, giải thích lý do, hỏi ý kiến trước khi tiếp tục.
3. Sau khi hoàn thành → cập nhật `tiendo.md` (xem mục 3).

---

## 📒 3. FILE TIENDO.MD — NHẬT KÝ TIẾN ĐỘ

### 3.1 Mục Đích

File `tiendo.md` là **nhật ký hoạt động** giúp người dùng theo dõi toàn bộ những gì AI đã làm trong dự án mà không cần đọc lại toàn bộ lịch sử hội thoại.

### 3.2 Khi Nào Phải Cập Nhật

AI **BẮT BUỘC** cập nhật `tiendo.md` sau MỖI hành động sau:

- ✅ Tạo file mới
- ✅ Chỉnh sửa / cập nhật file hiện có
- ✅ Xóa file
- ✅ Cài thêm thư viện / package
- ✅ Thay đổi cấu trúc thư mục
- ✅ Sửa bug
- ✅ Thêm tính năng mới
- ✅ Refactor code
- ✅ Thay đổi config / môi trường

### 3.3 Định Dạng Bắt Buộc Của tiendo.md

```markdown
# 📒 Nhật Ký Tiến Độ Dự Án

## Thông Tin Dự Án
- **Tên dự án**: [tên]
- **Ngày bắt đầu**: [ngày]
- **Mô tả**: [mô tả ngắn]

---

## 📌 Trạng Thái Hiện Tại
[Mô tả ngắn gọn trạng thái dự án đang ở đâu, đang làm gì]

---

## 📋 Danh Sách Thay Đổi

### [DD/MM/YYYY HH:MM] — [Tiêu đề ngắn gọn]
- **Loại**: Tạo mới / Chỉnh sửa / Xóa / Cài package / Sửa bug / ...
- **File/Thành phần liên quan**: `tên-file.ext`
- **Mô tả**: Giải thích rõ đã làm gì và tại sao
- **Kết quả**: Thành công / Thất bại / Cần kiểm tra thêm

---
```

### 3.4 Lưu Ý

- Mỗi lần cập nhật **THÊM VÀO ĐẦU** danh sách (mới nhất ở trên cùng).
- Không được xóa lịch sử cũ trong file này.
- File này phải **luôn tồn tại** trong thư mục gốc của dự án.

---

## 🏛️ 3B. FILE KIENTRUCHETHONG.MD — BẢN ĐỒ HỆ THỐNG

### 3B.1 Mục Đích

File `kientruchethong.md` là **bản đồ sống của toàn bộ hệ thống** — giúp AI hiểu ngay kiến trúc tổng thể và danh sách chức năng mà không cần đọc lại toàn bộ source code. Đây là file quan trọng nhất để AI có thể làm việc hiệu quả ở mọi phiên làm việc.

### 3B.2 Khi Nào Phải Tạo

AI **BẮT BUỘC** tạo file `kientruchethong.md` ngay khi:
- Bắt đầu dự án mới (tạo cùng lúc với `tiendo.md`), nếu dự án đã có sẵn file rồi thì không cần tạo lại
- Nhận dự án có sẵn mà chưa có file này → phân tích rồi tạo ngay trước khi làm bất kỳ việc gì khác

### 3B.3 Khi Nào Phải Cập Nhật

AI **BẮT BUỘC** cập nhật `kientruchethong.md` ngay sau khi:

- ✅ Thêm module / service / component mới
- ✅ Xóa hoặc gộp module / service
- ✅ Thay đổi luồng dữ liệu (data flow) giữa các thành phần
- ✅ Thêm / sửa / xóa chức năng (feature)
- ✅ Thay đổi công nghệ / framework / database
- ✅ Thêm hoặc thay đổi API endpoint
- ✅ Thay đổi cấu trúc thư mục lớn
- ✅ Tích hợp thêm service bên thứ ba

### 3B.4 Định Dạng Bắt Buộc Của kientruchethong.md

```markdown
# 🏛️ Kiến Trúc Hệ Thống

> Cập nhật lần cuối: [DD/MM/YYYY] — [mô tả thay đổi lần cuối]

---

## 1. Tổng Quan Dự Án

- **Tên**: [tên dự án]
- **Mục tiêu**: [mô tả ngắn gọn dự án làm gì, phục vụ ai]
- **Stack chính**: [VD: Next.js 14 + FastAPI + PostgreSQL + Redis]
- **Môi trường**: [VD: Node 20, Python 3.11, Docker]

---

## 2. Sơ Đồ Kiến Trúc Tổng Thể

```
[Vẽ sơ đồ dạng ASCII hoặc mô tả luồng chính]

Ví dụ:
Client (Next.js)
    ↓ HTTP/REST
API Gateway / Backend (FastAPI)
    ↓               ↓
PostgreSQL        Redis (cache)
    ↓
File Storage (S3)
```

---

## 3. Các Thành Phần Hệ Thống

### [Tên module/service]
- **Vị trí**: `đường/dẫn/thư/mục/`
- **Vai trò**: [làm gì trong hệ thống]
- **Công nghệ**: [framework, lib chính]
- **Giao tiếp với**: [module khác nó kết nối]

---

## 4. Cơ Sở Dữ Liệu

### Các bảng / collection chính
| Tên | Mô tả | Quan hệ |
|-----|-------|---------|
| users | Thông tin người dùng | 1-n với orders |
| ... | ... | ... |

---

## 5. API Endpoints Chính

| Method | Endpoint | Chức năng | Auth? |
|--------|----------|-----------|-------|
| POST | /api/auth/login | Đăng nhập | ❌ |
| GET | /api/users/me | Lấy thông tin user | ✅ |
| ... | ... | ... | ... |

---

## 6. Danh Sách Chức Năng

### ✅ Đã hoàn thành
- [x] Chức năng A — mô tả ngắn
- [x] Chức năng B — mô tả ngắn

### 🔄 Đang phát triển
- [ ] Chức năng C — mô tả ngắn — *đang làm*

### 📋 Kế hoạch
- [ ] Chức năng D — mô tả ngắn — *chưa bắt đầu*

---

## 7. Luồng Nghiệp Vụ Chính (Business Flow)

### [Tên luồng - VD: Luồng đặt hàng]
```
Bước 1: User chọn sản phẩm → giỏ hàng
Bước 2: Thanh toán → gọi Payment API
Bước 3: Xác nhận → gửi email → cập nhật DB
```

---

## 8. Biến Môi Trường Quan Trọng

| Biến | Mô tả | Bắt buộc? |
|------|-------|-----------|
| DATABASE_URL | Kết nối DB | ✅ |
| JWT_SECRET | Ký token | ✅ |
| ... | ... | ... |

---

## 9. Ghi Chú Kiến Trúc & Quyết Định Kỹ Thuật

> Ghi lại các quyết định quan trọng và lý do để AI không hỏi lại những thứ đã được quyết định

- **[DD/MM/YYYY]** Dùng Redis thay Memcached vì cần hỗ trợ pub/sub
- **[DD/MM/YYYY]** Chọn PostgreSQL vì dữ liệu có quan hệ phức tạp
```

### 3B.5 Lưu Ý Quan Trọng

- File này **KHÔNG** là nhật ký (không ghi mọi thay đổi nhỏ) — chỉ phản ánh **trạng thái hiện tại** của hệ thống.
- Luôn cập nhật **section 6 (Danh Sách Chức Năng)** mỗi khi thêm/hoàn thành/thay đổi tính năng.
- Dòng `> Cập nhật lần cuối` ở đầu file phải được cập nhật mỗi lần chỉnh sửa file này.
- Nếu sơ đồ kiến trúc thay đổi lớn → vẽ lại toàn bộ, không patch chắp vá.



## 🔄 4. QUY TẮC KHI RESTART / TIẾP TỤC DỰ ÁN

### 4.1 Khi Người Dùng Bắt Đầu Session Mới

Khi người dùng nói các từ như: *"tiếp tục", "resume", "restart", "hãy đọc lại dự án"*, AI **PHẢI**:

1. **Đọc ngay lập tức** các file sau theo thứ tự:
   - `rule.md` — để nạp lại toàn bộ quy tắc
   - `tiendo.md` — để biết đã làm gì rồi, đang ở đâu
   - `kientruchethong.md` — để nắm rõ kiến trúc và toàn bộ chức năng hệ thống
   - `README.md` — tổng quan dự án (nếu có)
   - Các file cấu hình quan trọng: `package.json`, `.env.example`, `requirements.txt`, v.v.

2. **Tóm tắt lại** cho người dùng biết:
   - Dự án này đang làm gì
   - Lần cuối đã làm đến đâu
   - Bước tiếp theo là gì (nếu có)

3. **KHÔNG** đi đọc lại toàn bộ source code ngay — chỉ đọc khi cần thiết cho task cụ thể.

### 4.2 Tối Ưu Context Window

- Ưu tiên đọc file `.md` tóm tắt thay vì đọc toàn bộ source code.
- Chỉ đọc file code khi thực sự cần chỉnh sửa hoặc debug file đó.
- Không load toàn bộ dự án vào context khi không cần thiết.

---

## 🏗️ 5. QUY TẮC VIẾT CODE

### 5.1 Chất Lượng Code

- Code phải **rõ ràng, dễ đọc**, có comment tiếng Việt cho các đoạn phức tạp.
- Đặt tên biến/hàm bằng tiếng Anh, rõ nghĩa, theo convention của ngôn ngữ đang dùng.
- Không viết code "magic" khó hiểu — luôn ưu tiên readability.
- Xử lý **edge case** và **error handling** đầy đủ.

### 5.2 Không Tự Ý Thay Đổi Ngoài Phạm Vi

- Chỉ chỉnh sửa những file liên quan trực tiếp đến task được giao.
- **Không** tự ý refactor / đổi tên biến / thay đổi logic ở những phần không liên quan.
- Nếu phát hiện bug / vấn đề khác trong quá trình làm → **báo cho người dùng** thay vì tự sửa.

### 5.3 Kiểm Tra Trước Khi Báo Hoàn Thành

Trước khi nói "xong rồi", phải tự kiểm tra:
- [ ] Code có syntax error không?
- [ ] Logic có đúng với yêu cầu không?
- [ ] Có import/require thiếu không?
- [ ] File đã được lưu đúng chỗ chưa?
- [ ] `tiendo.md` đã được cập nhật chưa?
- [ ] `kientruchethong.md` đã được cập nhật nếu có thay đổi kiến trúc / chức năng không?

---

## 🚫 6. NHỮNG THỨ TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM

| ❌ Hành động bị cấm | ✅ Thay vào đó |
|---|---|
| Code ngay không có plan | Luôn plan trước, xin xác nhận |
| Tự ý thay đổi ngoài phạm vi | Báo người dùng và hỏi ý kiến |
| Quên cập nhật `tiendo.md` | Cập nhật ngay sau mỗi thay đổi |
| Quên cập nhật `kientruchethong.md` | Cập nhật ngay khi kiến trúc / chức năng thay đổi |
| Trả lời bằng tiếng Anh | Luôn dùng tiếng Việt |
| Tự ý xóa file | Phải hỏi xác nhận trước |
| Commit/push code (nếu có git) | Hỏi người dùng trước |
| Bịa đặt kết quả khi không chắc | Nói thẳng "tôi không chắc" và đề xuất cách kiểm tra |
| Load toàn bộ codebase khi restart | Chỉ đọc file .md tóm tắt trước |

---

## 💬 7. QUY TẮC GIAO TIẾP

### 7.1 Khi Không Hiểu Yêu Cầu

- **Hỏi lại** thay vì tự đoán và làm sai.
- Chỉ hỏi tối đa **2-3 câu hỏi** quan trọng nhất, không hỏi lan man.
- Tóm tắt lại yêu cầu bằng lời của mình để xác nhận hiểu đúng.

### 7.2 Khi Gặp Lỗi / Vấn Đề

- **Báo ngay** cho người dùng, không cố gắng che giấu.
- Mô tả rõ: lỗi gì, ở đâu, nguyên nhân có thể là gì.
- Đề xuất ít nhất **1-2 giải pháp** có thể thực hiện. 
- Hỏi người dùng muốn xử lý theo hướng nào.

### 7.3 Báo Cáo Tiến Độ

- Với task dài (nhiều bước), sau mỗi bước hoàn thành → báo ngắn gọn: *"✅ Bước X xong. Đang tiến hành bước Y..."*
- Không im lặng quá lâu mà không có phản hồi.

---

## 📁 8. QUY TẮC QUẢN LÝ FILE & THƯ MỤC

### 8.1 Cấu Trúc File Bắt Buộc Trong Mọi Dự Án

```
project-root/
├── rule.md               ← Quy tắc cho AI (file này)
├── tiendo.md             ← Nhật ký tiến độ (AI luôn cập nhật)
├── kientruchethong.md    ← Kiến trúc hệ thống & danh sách chức năng (AI luôn cập nhật)
├── README.md             ← Mô tả dự án (AI tạo/cập nhật khi cần)
└── ...                   ← Code và các file khác
```

### 8.2 Quy Tắc Đặt Tên File

- Tên file: dùng `kebab-case` (ví dụ: `user-service.js`, `auth-controller.py`)
- Tên component React: dùng `PascalCase` (ví dụ: `UserProfile.jsx`)
- File config: giữ nguyên convention của framework/tool đang dùng

### 8.3 Trước Khi Xóa File

- LUÔN hỏi xác nhận người dùng trước khi xóa bất kỳ file nào.
- Nêu rõ file đó đang được dùng ở đâu (nếu biết).

---

## 🔐 9. QUY TẮC BẢO MẬT

- **KHÔNG** hardcode API key, password, secret vào code.
- Luôn dùng biến môi trường (`.env`) cho thông tin nhạy cảm.
- Nhắc người dùng thêm `.env` vào `.gitignore` nếu dùng git.
- Nếu phát hiện secret bị lộ trong code → **cảnh báo ngay lập tức**.

---

## 📦 10. QUY TẮC QUẢN LÝ PACKAGE / DEPENDENCY

- Trước khi cài thêm package mới → **thông báo** cho người dùng biết sẽ cài gì và tại sao.
- Ưu tiên dùng package **phổ biến, được maintain tốt, ít dependency phụ**.
- Sau khi cài package → cập nhật `tiendo.md`.
- Không cài package nếu có thể giải quyết bằng code thuần túy một cách đơn giản.

---

## 🧪 11. QUY TẮC TESTING

- Với mỗi tính năng quan trọng, đề xuất cách test đơn giản để người dùng xác nhận hoạt động đúng.
- Nếu dự án có testing framework → viết test cho code mới.
- Mô tả rõ **cách chạy test** và **kết quả mong đợi**.

---

## 🔁 12. QUY TRÌNH CHUẨN MỖI PHIÊN LÀM VIỆC

```
[BẮT ĐẦU PHIÊN]
  → Đọc rule.md (nếu chưa đọc)
  → Đọc tiendo.md để biết context
  → Đọc kientruchethong.md để nắm kiến trúc hệ thống
  → Tóm tắt cho người dùng biết đang ở đâu

[NHẬN TASK MỚI]
  → Xác nhận hiểu đúng yêu cầu
  → Đưa ra plan chi tiết
  → Chờ xác nhận
  → Thực hiện từng bước
  → Cập nhật tiendo.md
  → Cập nhật kientruchethong.md (nếu có thay đổi kiến trúc/chức năng)
  → Báo cáo kết quả

[KẾT THÚC PHIÊN]
  → Đảm bảo tiendo.md đã được cập nhật đầy đủ
  → Đảm bảo kientruchethong.md phản ánh đúng trạng thái hệ thống hiện tại
  → Tóm tắt những gì đã làm trong phiên này
  → Gợi ý bước tiếp theo (nếu có)
```

---

## ⚡ 13. CÁC PHÍM TẮT / TỪ KHÓA ĐẶC BIỆT

| Từ khóa người dùng nói | AI phải làm |
|---|---|
| `"plan"` / `"lên kế hoạch"` | Đưa ra plan chi tiết, không code |
| `"tiếp tục"` / `"resume"` | Đọc tiendo.md + kientruchethong.md, tóm tắt, hỏi tiếp tục từ đâu |
| `"tóm tắt"` / `"đang làm gì"` | Đọc tiendo.md và tóm tắt ngắn gọn |
| `"kiến trúc"` / `"hệ thống"` | Đọc và tóm tắt kientruchethong.md |
| `"xem lại"` / `"review"` | Đọc code liên quan và đưa ra nhận xét |
| `"undo"` / `"hoàn tác"` | Hỏi rõ muốn hoàn tác gì, đề xuất cách xử lý |
| `"dừng lại"` / `"stop"` | Dừng ngay, chờ lệnh tiếp theo |
| `"giải thích"` / `"explain"` | Giải thích code/logic bằng tiếng Việt dễ hiểu |

---

> 📌 **Lưu ý cuối**: File `rule.md` này có thể được cập nhật theo thời gian. Mỗi khi người dùng cập nhật file này, AI phải đọc lại và áp dụng ngay các quy tắc mới.

---
*Phiên bản: 1.1 — Tạo bởi người dùng với sự hỗ trợ của Claude | Cập nhật: thêm kientruchethong.md*
