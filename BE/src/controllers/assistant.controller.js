import db from '../config/db.js';
import { success, error } from '../utils/response.js';

// ── SCHEMA MÔ TẢ CHO AI ────────────────────────────────────────────────────
const DB_SCHEMA_DESCRIPTION = `
Cơ sở dữ liệu SQLite của hệ thống phòng tập Paradise GYM.

⚠️ LƯU Ý QUAN TRỌNG VỀ TÊN CỘT (KHÔNG ĐƯỢC NHẦM LẪN):
- Bảng dang_ky_goi_tap dùng "ho_so_id" để tham chiếu hội viên (KHÔNG PHẢI hoi_vien_id)
- Bảng dang_ky_pt dùng "hoi_vien_id" để tham chiếu hội viên (KHÔNG PHẢI ho_so_id)
- Bảng luot_vao_ra dùng "ho_so_id" để tham chiếu hội viên
- Bảng lich_tap dùng "hoi_vien_id" để tham chiếu hội viên
- KHÔNG có cột "is_active" trong bất kỳ bảng nào — dùng "is_deleted" (0=hoạt động, 1=đã xóa) thay thế
- KHÔNG có cột "loai_tai_khoan" — bảng tai_khoan dùng "vai_tro_id" (FK sang bảng vai_tro)
- Bảng tai_khoan dùng "trang_thai" ('hoat_dong'|'khoa'|'cho_xac_nhan') thay vì is_active
- Bảng goi_tap: cột giá là "gia" (KHÔNG phải gia_goc/gia_khuyen_mai), thời hạn là "so_thang" và "so_ngay_them"
- Bảng goi_pt: cột giá là "gia", loại là "loai_goi" ('theo_buoi'|'theo_thang'), số buổi là "so_buoi", số tháng là "so_thang"

CÁC BẢNG CHÍNH:
- vai_tro(id, ma_vai_tro['admin'|'le_tan'|'pt'|'hoi_vien'], ten_hien_thi)
- tai_khoan(id, ten_dang_nhap, mat_khau_hash, vai_tro_id[FK→vai_tro.id], trang_thai['hoat_dong'|'khoa'|'cho_xac_nhan'], ngay_tao)
- ho_so(id, tai_khoan_id, ma_ho_so, loai_ho_so['hoi_vien'|'pt'|'nhan_vien'|'le_tan'], ho_ten, gioi_tinh['nam'|'nu'|'khac'], ngay_sinh, so_dien_thoai, email, avatar_url, chieu_cao_cm, can_nang_kg, is_deleted[0|1], ngay_tao)
- goi_tap(id, ten_goi, so_thang, so_ngay_them, gia, mo_ta, is_deleted[0|1], ngay_tao)
- goi_pt(id, ten_goi, loai_goi['theo_buoi'|'theo_thang'], so_buoi, so_thang, gia, mo_ta, is_deleted[0|1], ngay_tao)
- dang_ky_goi_tap(id, ho_so_id[FK→ho_so.id], goi_tap_id[FK→goi_tap.id], tu_ngay, den_ngay, gia_thuc_te, trang_thai['dang_hoat_dong'|'het_han'|'huy'|'tam_dung'|'cho_duyet'], phuong_thuc_tt, nguoi_thu_id, ngay_tao)
- dang_ky_pt(id, hoi_vien_id[FK→ho_so.id], pt_id[FK→ho_so.id], goi_pt_id[FK→goi_pt.id], so_buoi_dang_ky, so_buoi_da_tap, tu_ngay, den_ngay, gia_thuc_te, trang_thai['dang_hoat_dong'|'hoan_thanh'|'huy'|'tam_dung'], ngay_tao)
- lich_tap(id, dang_ky_pt_id[FK→dang_ky_pt.id], hoi_vien_id[FK→ho_so.id], pt_id[FK→ho_so.id], ngay_tap[DATE], gio_bat_dau, gio_ket_thuc, loai_buoi['ca_nhan'|'nhom'], trang_thai['cho_tap'|'da_tap'|'da_huy'|'vang'], ngay_tao)
- luot_vao_ra(id, ho_so_id[FK→ho_so.id], thoi_diem[DATETIME], loai['vao'|'ra'], phuong_thuc['the_tu'|'qr_code'|'thu_cong'|'khuon_mat'])
- doanh_thu(id, ngay[DATE UNIQUE], tong_tien, tong_don, tien_goi_tap, tien_goi_pt, ngay_cap_nhat)
- danh_gia_pt(id, lich_tap_id, pt_id, hoi_vien_id, so_sao[1-5], noi_dung, ngay_tao)
- thong_bao(id, loai, tieu_de, noi_dung, danh_cho['admin'|'le_tan'|'ca_hai'], da_doc[0|1], ngay_tao)
- yeu_cau_goi_tap(id, ho_so_id[FK→ho_so.id], dang_ky_id[FK→dang_ky_goi_tap.id], loai_yeu_cau['gia_han'|'tam_dung'|'huy'], trang_thai['cho_duyet'|'da_duyet'|'tu_choi'], ngay_tao)
- noi_quy(id, tieu_de, noi_dung, thu_tu, ap_dung_cho['tat_ca'|'hoi_vien'|'pt'|'nhan_vien'], is_active[0|1])
- cau_hinh(khoa, gia_tri, mo_ta)

VÍ DỤ SQL MẪU ĐÚNG:
-- Hội viên sắp hết hạn gói tập trong 7 ngày:
SELECT h.ho_ten, dk.den_ngay, gt.ten_goi FROM dang_ky_goi_tap dk JOIN ho_so h ON h.id = dk.ho_so_id JOIN goi_tap gt ON gt.id = dk.goi_tap_id WHERE dk.trang_thai = 'dang_hoat_dong' AND dk.den_ngay BETWEEN date('now','localtime') AND date('now','localtime','+7 days') ORDER BY dk.den_ngay

-- Doanh thu 7 ngày qua:
SELECT ngay, tong_tien, tien_goi_tap, tien_goi_pt FROM doanh_thu WHERE ngay >= date('now','localtime','-7 days') ORDER BY ngay DESC

-- Số lượt check-in theo ngày trong tháng này:
SELECT date(thoi_diem) AS ngay, COUNT(*) AS luot_vao FROM luot_vao_ra WHERE loai = 'vao' AND strftime('%Y-%m', thoi_diem) = strftime('%Y-%m', date('now','localtime')) GROUP BY date(thoi_diem) ORDER BY ngay

-- PT dạy nhiều buổi nhất tháng này:
SELECT h.ho_ten, COUNT(*) AS so_buoi FROM lich_tap lt JOIN ho_so h ON h.id = lt.pt_id WHERE lt.trang_thai = 'da_tap' AND strftime('%Y-%m', lt.ngay_tap) = strftime('%Y-%m', date('now','localtime')) GROUP BY lt.pt_id ORDER BY so_buoi DESC LIMIT 10

-- Gói tập bán chạy nhất (dùng is_deleted thay is_active):
SELECT gt.ten_goi, COUNT(*) AS so_dang_ky FROM dang_ky_goi_tap dk JOIN goi_tap gt ON gt.id = dk.goi_tap_id WHERE gt.is_deleted = 0 GROUP BY dk.goi_tap_id ORDER BY so_dang_ky DESC LIMIT 5

-- Hội viên đang hoạt động (dùng is_deleted = 0):
SELECT ho_ten, so_dien_thoai, email FROM ho_so WHERE loai_ho_so = 'hoi_vien' AND is_deleted = 0 ORDER BY ho_ten

-- Tổng doanh thu theo tháng:
SELECT strftime('%Y-%m', ngay) AS thang, SUM(tong_tien) AS doanh_thu FROM doanh_thu GROUP BY thang ORDER BY thang DESC LIMIT 12

Lưu ý thời gian: dùng date('now','localtime') cho ngày hiện tại, datetime('now','localtime') cho timestamp hiện tại.

CÁC CỘT LỌC CHI NHÁNH:
- ho_so.chi_nhanh TEXT — chi nhánh của hội viên/nhân viên
- luot_vao_ra.chi_nhanh_thuc_hien TEXT — chi nhánh nơi check-in diễn ra
- dang_ky_goi_tap.chi_nhanh_dang_ky TEXT — chi nhánh đăng ký gói tập
- dang_ky_goi_tap.chi_nhanh_mua TEXT — chi nhánh thanh toán
- dang_ky_pt.chi_nhanh_dang_ky TEXT — chi nhánh đăng ký PT
- lich_tap.chi_nhanh_tap TEXT — chi nhánh diễn ra buổi tập

Khi lọc theo chi nhánh, dùng điều kiện WHERE tương ứng (ví dụ: AND h.chi_nhanh = 'Chi nhánh A').
`;


// ── ĐỊNH NGHĨA TOOL CHO GROQ FUNCTION CALLING ─────────────────────────────
const TOOLS_DEFINITION = [
  {
    type: 'function',
    function: {
      name: 'run_readonly_sql_query',
      description: `Thực thi câu truy vấn SQL SELECT trên cơ sở dữ liệu Paradise GYM để lấy thông tin lịch sử, thống kê, báo cáo theo thời gian. 
Chỉ dùng khi thông tin KHÔNG có sẵn trong context đã cung cấp.
Schema: ${DB_SCHEMA_DESCRIPTION}`,
      parameters: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'Câu lệnh SQL SELECT hợp lệ. CHỈ được dùng SELECT, không được dùng INSERT/UPDATE/DELETE/DROP/CREATE/ALTER.'
          },
          description: {
            type: 'string',
            description: 'Mô tả ngắn về mục đích câu truy vấn (ví dụ: "Lấy doanh thu 7 ngày qua")'
          }
        },
        required: ['sql', 'description']
      }
    }
  }
];

// ── BẢNG TRẮNG: BẢNG NHẠY CẢM CẦN HẠN CHẾ THEO ROLE ─────────────────────
const SENSITIVE_TABLES = ['tai_khoan']; // Chứa password hash — chỉ admin mới được query

/**
 * Thực thi SQL an toàn:
 * - Chỉ cho phép SELECT
 * - Hạn chế bảng nhạy cảm theo role
 * - Giới hạn 200 dòng kết quả
 */
function executeSafeSQL(sql, roleName) {
  // 1. Chuẩn hóa và kiểm tra chỉ SELECT
  const trimmedSQL = sql.trim();
  if (!/^SELECT\b/i.test(trimmedSQL)) {
    throw new Error('Chỉ được phép thực thi câu lệnh SELECT.');
  }

  // 2. Chặn các từ khóa nguy hiểm
  const dangerousKeywords = /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|ATTACH|DETACH|PRAGMA|VACUUM)\b/i;
  if (dangerousKeywords.test(trimmedSQL)) {
    throw new Error('Câu truy vấn chứa từ khóa không được phép.');
  }

  // 3. Kiểm tra bảng nhạy cảm theo role
  const isAdminOrReceptionist = ['nhan_vien', 'le_tan'].includes(roleName);
  if (!isAdminOrReceptionist) {
    for (const table of SENSITIVE_TABLES) {
      if (new RegExp(`\\b${table}\\b`, 'i').test(trimmedSQL)) {
        throw new Error(`Bạn không có quyền truy vấn bảng ${table}.`);
      }
    }
  }

  // 4. Thêm LIMIT nếu chưa có (tối đa 200 dòng)
  const sqlWithLimit = /\bLIMIT\b/i.test(trimmedSQL)
    ? trimmedSQL
    : `${trimmedSQL} LIMIT 200`;

  try {
    const stmt = db.prepare(sqlWithLimit);
    const rows = stmt.all();
    return rows;
  } catch (dbErr) {
    throw new Error(`Lỗi SQL: ${dbErr.message}`);
  }
}

// ── HÀM GỌI GROQ API VỚI FUNCTION CALLING ────────────────────────────────
async function callGroqWithTools(apiKey, systemInstruction, messages, model, enableTools = true) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const body = {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      ...messages
    ],
    temperature: 0.3,
    max_tokens: 1536
  };

  if (enableTools) {
    body.tools = TOOLS_DEFINITION;
    body.tool_choice = 'auto';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  return await response.json();
}

// ── HÀM GỌI GEMINI API VỚI FUNCTION CALLING ──────────────────────────────
// Hàm phụ trợ chuyển đổi schema sang định dạng chữ hoa mà Gemini yêu cầu
function toGeminiSchema(schema) {
  if (!schema) return undefined;
  const newSchema = { ...schema };
  if (typeof newSchema.type === 'string') {
    newSchema.type = newSchema.type.toUpperCase();
  }
  if (newSchema.properties) {
    const newProps = {};
    for (const key in newSchema.properties) {
      newProps[key] = toGeminiSchema(newSchema.properties[key]);
    }
    newSchema.properties = newProps;
  }
  if (newSchema.items) {
    newSchema.items = toGeminiSchema(newSchema.items);
  }
  return newSchema;
}

async function callGeminiWithTools(geminiKey, systemInstruction, messages, enableTools = true) {
  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiKey}`;

  // Chuyển đổi messages từ OpenAI format → Gemini format
  const contents = messages.map(msg => {
    if (msg.role === 'user') {
      return { role: 'user', parts: [{ text: msg.content || '' }] };
    }
    if (msg.role === 'assistant') {
      if (msg.tool_calls?.length > 0) {
        return {
          role: 'model',
          parts: msg.tool_calls.map(tc => ({
            functionCall: {
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments)
            }
          }))
        };
      }
      return { role: 'model', parts: [{ text: msg.content || '' }] };
    }
    if (msg.role === 'tool') {
      // Đúng chuẩn REST API của Gemini: role 'function', parts chứa 'functionResponse'
      return {
        role: 'function',
        parts: [{
          functionResponse: {
            name: 'run_readonly_sql_query',
            response: {
              name: 'run_readonly_sql_query',
              content: JSON.parse(msg.content)
            }
          }
        }]
      };
    }
    return null;
  }).filter(Boolean);

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
    generation_config: {
      temperature: 0.3,
      max_output_tokens: 1536
    }
  };

  if (enableTools) {
    const geminiParams = toGeminiSchema(TOOLS_DEFINITION[0].function.parameters);
    body.tools = [{
      function_declarations: [{
        name: 'run_readonly_sql_query',
        description: TOOLS_DEFINITION[0].function.description,
        parameters: geminiParams
      }]
    }];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`💥 [Gemini Details] API Error Response:`, errText);
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  return await response.json();
}

// ── HANDLER CHÍNH ──────────────────────────────────────────────────────────
export const handleChat = async (req, res) => {
  try {
    const { message, chi_nhanh } = req.body;
    if (!message || !message.trim()) {
      return error(res, 'Vui lòng nhập tin nhắn.', 400);
    }
    // chi_nhanh: tên chi nhánh cụ thể hoặc '' (Tất cả chi nhánh)
    const branchFilter = chi_nhanh && chi_nhanh.trim() ? chi_nhanh.trim() : null;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return error(res, 'Chưa cấu hình API Key cho Trợ lý AI.', 500);
    }

    // Lấy thông tin hồ sơ người dùng
    const userProfile = db.prepare(`
      SELECT id, ho_ten, loai_ho_so, gioi_tinh, chieu_cao_cm, can_nang_kg, kinh_nghiem
      FROM ho_so
      WHERE tai_khoan_id = ? AND is_deleted = 0
    `).get(req.user.id);

    if (!userProfile) {
      return error(res, 'Không tìm thấy hồ sơ người dùng hợp lệ.', 404);
    }

    const roleName = userProfile.loai_ho_so;
    let userContext = '';
    let systemInstruction = '';

    const accuracyRules = `
⚠️ NGUYÊN TẮC VỀ TÍNH CHÍNH XÁC CỦA SỐ LIỆU VÀ NGỮ CẢNH TRẢ LỜI:
- CHỈ sử dụng dữ liệu thống kê hoạt động phòng tập (như tổng số hội viên, lượt check-in, doanh thu hôm nay, số ca tập PT...) hoặc dữ liệu cá nhân (lịch tập, chiều cao, cân nặng...) khi người dùng hỏi các câu hỏi trực tiếp liên quan đến số liệu, báo cáo, tình trạng hoạt động của phòng tập hoặc hồ sơ cá nhân của họ.
- Đối với các câu hỏi kiến thức chung (ví dụ: mệt mỏi có nên đi tập không, dinh dưỡng, sức khỏe, tư vấn thể chất, kỹ thuật tập luyện, hoặc trò chuyện thông thường), hãy tập trung trả lời kiến thức chuyên môn và tuyệt đối KHÔNG tự động lồng ghép các số liệu thống kê vận hành của phòng tập vào câu trả lời để tránh gây lan man và làm loãng nội dung.
- Tuyệt đối KHÔNG được tự động nhận sai, "chiều lòng" người dùng hoặc thay đổi số liệu theo khẳng định hay con số chủ quan do người dùng đưa ra (ví dụ: người dùng nói "Doanh thu hôm nay phải là 19.500.000 chứ không phải X").
- Cơ sở dữ liệu (Database) là nguồn sự thật duy nhất (Single Source of Truth). Bạn chỉ được tin tưởng vào kết quả truy vấn thực tế thu được từ công cụ run_readonly_sql_query.
- Nếu người dùng nghi ngờ hoặc phản bác số liệu bạn đưa ra, hãy tự động thực hiện lại câu lệnh SQL để kiểm tra, đối chiếu thật kỹ càng và giải thích chi tiết dựa trên dữ liệu thực tế (ví dụ: giải thích chi tiết tổng hợp từ các giao dịch nào). Chỉ xác nhận số liệu thay đổi khi và chỉ khi kết quả truy vấn thực tế từ database trả về con số đó.
- NGHIÊM CẤM hiển thị hoặc in ra các câu lệnh SQL thô, cấu trúc bảng dữ liệu kỹ thuật, hay bất kỳ đoạn code SQL nào trong câu trả lời gửi cho người dùng. Công cụ run_readonly_sql_query chỉ được sử dụng ngầm để lấy thông tin. Khi phản hồi lại, bạn bắt buộc phải chuyển hóa dữ liệu thu được thành câu văn hoặc đoạn văn tự nhiên, dễ hiểu bằng tiếng Việt.`;

    userContext += `Tên người dùng: ${userProfile.ho_ten}. `;
    userContext += `Vai trò: ${roleName === 'hoi_vien' ? 'Hội viên' :
      roleName === 'pt' ? 'Huấn luyện viên (PT)' :
        roleName === 'le_tan' ? 'Lễ tân' : 'Quản trị viên (Admin)'
      }. `;

    // ── NGHIỆP VỤ 1: HỘI VIÊN ─────────────────────────────────────────────
    if (roleName === 'hoi_vien') {
      userContext += `Giới tính: ${userProfile.gioi_tinh === 'nam' ? 'Nam' : userProfile.gioi_tinh === 'nu' ? 'Nữ' : 'Chưa cập nhật'}. `;
      userContext += `Chiều cao: ${userProfile.chieu_cao_cm ? userProfile.chieu_cao_cm + 'cm' : 'Chưa cập nhật'}. `;
      userContext += `Cân nặng: ${userProfile.can_nang_kg ? userProfile.can_nang_kg + 'kg' : 'Chưa cập nhật'}. `;
      userContext += `Kinh nghiệm tập luyện: ${userProfile.kinh_nghiem ? userProfile.kinh_nghiem + ' tháng' : 'Chưa cập nhật'}. `;

      const todaySchedule = db.prepare(`
        SELECT lt.gio_bat_dau, lt.gio_ket_thuc, lt.loai_buoi, lt.trang_thai, pt.ho_ten AS ten_pt
        FROM lich_tap lt
        JOIN ho_so pt ON pt.id = lt.pt_id
        WHERE lt.hoi_vien_id = ? AND lt.ngay_tap = date('now','localtime') AND lt.trang_thai != 'da_huy'
        ORDER BY lt.gio_bat_dau
      `).all(userProfile.id);

      if (todaySchedule.length > 0) {
        userContext += `Lịch tập hôm nay: ${todaySchedule.map(s => `- Ca tập PT từ ${s.gio_bat_dau} đến ${s.gio_ket_thuc} (${s.loai_buoi === 'ca_nhan' ? 'Cá nhân' : 'Nhóm'}, PT: ${s.ten_pt}, Trạng thái: ${s.trang_thai === 'cho_tap' ? 'Chưa tập' : s.trang_thai === 'da_tap' ? 'Đã tập xong' : s.trang_thai})`).join('\n')}. `;
      } else {
        userContext += `Lịch tập hôm nay: Bạn không có lịch tập PT nào được lên lịch hôm nay. `;
      }

      const activePkgs = db.prepare(`
        SELECT gt.ten_goi, dk.den_ngay
        FROM dang_ky_goi_tap dk
        JOIN goi_tap gt ON gt.id = dk.goi_tap_id
        WHERE dk.ho_so_id = ? AND dk.trang_thai = 'dang_hoat_dong'
      `).all(userProfile.id);

      if (activePkgs.length > 0) {
        userContext += `Gói tập thường đang hoạt động: ${activePkgs.map(p => `${p.ten_goi} (hạn đến ${p.den_ngay})`).join(', ')}. `;
      } else {
        userContext += `Gói tập thường đang hoạt động: Không có gói nào đang hoạt động. `;
      }

      const activePtPkgs = db.prepare(`
        SELECT gp.ten_goi, dp.so_buoi_dang_ky, dp.so_buoi_da_tap, pt.ho_ten AS ten_pt
        FROM dang_ky_pt dp
        JOIN goi_pt gp ON gp.id = dp.goi_pt_id
        JOIN ho_so pt ON pt.id = dp.pt_id
        WHERE dp.hoi_vien_id = ? AND dp.trang_thai = 'dang_hoat_dong'
      `).all(userProfile.id);

      if (activePtPkgs.length > 0) {
        userContext += `Gói PT đang hoạt động: ${activePtPkgs.map(p => `${p.ten_goi} với PT ${p.ten_pt} (đã tập ${p.so_buoi_da_tap || 0}/${p.so_buoi_dang_ky || 'không giới hạn'} buổi)`).join(', ')}. `;
      }

      systemInstruction = `Bạn tên là Parry — trợ lý AI thân thiện của phòng tập Paradise GYM. Bạn như một người bạn đồng hành tập luyện, vừa hiểu gym vừa hiểu người — luôn vui vẻ, tích cực và sẵn sàng giúp đỡ bất cứ lúc nào.

Dưới đây là thông tin về người đang trò chuyện với bạn:
${userContext}

Bạn có khả năng tra cứu lịch sử tập luyện cá nhân của hội viên này (ho_so_id = ${userProfile.id}, hoi_vien_id = ${userProfile.id}) bằng công cụ run_readonly_sql_query. Chỉ được tra cứu dữ liệu của chính hội viên này thôi nhé, không tra người khác.

Cách bạn trò chuyện:
- Với câu hỏi về hôm nay (lịch tập, gói tập hiện tại): dùng thông tin đã có ngay ở trên.
- Với câu hỏi về quá khứ hay số liệu cụ thể ("tháng trước tôi tập mấy buổi?", "lịch sử check-in của tôi"...): dùng công cụ tra cứu DB để trả lời chính xác — đừng đoán mò.
- Bạn biết rất nhiều thứ ngoài gym: dinh dưỡng, sức khỏe, khoa học, đời sống... cứ tự nhiên chia sẻ!
- Luôn dùng tiếng Việt, xưng "mình" hoặc "Parry", gọi hội viên là "bạn". Nói chuyện tự nhiên như người thật, không cứng nhắc.` + accuracyRules;

      // ── NGHIỆP VỤ 2: HUẤN LUYỆN VIÊN (PT) ───────────────────────────────
    } else if (roleName === 'pt') {
      const todayTeaching = db.prepare(`
        SELECT lt.gio_bat_dau, lt.gio_ket_thuc, lt.loai_buoi, lt.trang_thai, hv.ho_ten AS ten_hv
        FROM lich_tap lt
        JOIN ho_so hv ON hv.id = lt.hoi_vien_id
        WHERE lt.pt_id = ? AND lt.ngay_tap = date('now','localtime') AND lt.trang_thai != 'da_huy'
        ORDER BY lt.gio_bat_dau
      `).all(userProfile.id);

      if (todayTeaching.length > 0) {
        userContext += `Lịch dạy hôm nay: ${todayTeaching.map(s => `- Ca dạy từ ${s.gio_bat_dau} đến ${s.gio_ket_thuc} (${s.loai_buoi === 'ca_nhan' ? 'Cá nhân' : 'Nhóm'}, Học viên: ${s.ten_hv}, Trạng thái: ${s.trang_thai === 'cho_tap' ? 'Chưa dạy' : s.trang_thai === 'da_tap' ? 'Đã dạy xong' : s.trang_thai})`).join('\n')}. `;
      } else {
        userContext += `Lịch dạy hôm nay: Không có ca dạy nào được xếp lịch hôm nay. `;
      }

      const activeStudents = db.prepare(`
        SELECT DISTINCT hv.ho_ten, gp.ten_goi, dp.so_buoi_dang_ky, dp.so_buoi_da_tap
        FROM dang_ky_pt dp
        JOIN ho_so hv ON hv.id = dp.hoi_vien_id
        JOIN goi_pt gp ON gp.id = dp.goi_pt_id
        WHERE dp.pt_id = ? AND dp.trang_thai = 'dang_hoat_dong'
        LIMIT 10
      `).all(userProfile.id);

      if (activeStudents.length > 0) {
        userContext += `Danh sách học viên đang dạy: ${activeStudents.map(s => `${s.ho_ten} (${s.ten_goi}, đã tập ${s.so_buoi_da_tap}/${s.so_buoi_dang_ky || 'KGH'} buổi)`).join(', ')}. `;
      }

      systemInstruction = `Bạn tên là Parry — trợ lý AI đồng hành của các Huấn luyện viên (PT) tại Paradise GYM. Bạn hiểu nghề PT, hiểu áp lực lịch dạy, và luôn sẵn sàng hỗ trợ để PT làm việc hiệu quả hơn.

Dưới đây là thông tin của PT đang trò chuyện:
${userContext}

Bạn có thể tra cứu lịch sử dạy học của PT này (pt_id = ${userProfile.id}) và học viên của họ bằng công cụ run_readonly_sql_query. Chỉ tra cứu dữ liệu liên quan đến PT này thôi nhé.

Cách bạn trò chuyện:
- Câu hỏi về hôm nay (lịch dạy, học viên đang dạy): dùng thông tin đã có ngay ở trên.
- Câu hỏi về quá khứ hoặc thống kê ("tháng này dạy bao nhiêu buổi?", "học viên nào còn ít buổi nhất?"...): dùng công cụ tra cứu DB để có số liệu chính xác.
- Luôn dùng tiếng Việt, xưng "mình" hoặc "Parry", gọi PT là "thầy/cô" hoặc "bạn" tùy văn cảnh. Trò chuyện tự nhiên, thân thiện.` + accuracyRules;

      // ── NGHIỆP VỤ 3: ADMIN / LỄ TÂN ──────────────────────────────────────
    } else {
      const branchLabel = branchFilter ? `Chi nhánh "${branchFilter}"` : 'Toàn hệ thống';

      // Tổng hội viên — lọc qua ho_so.chi_nhanh (cột chuẩn)
      const totalMembers = branchFilter
        ? db.prepare(`SELECT COUNT(*) AS cnt FROM ho_so WHERE loai_ho_so = 'hoi_vien' AND is_deleted = 0 AND chi_nhanh = ?`).get(branchFilter)?.cnt || 0
        : db.prepare(`SELECT COUNT(*) AS cnt FROM ho_so WHERE loai_ho_so = 'hoi_vien' AND is_deleted = 0`).get()?.cnt || 0;

      // Gói tập đang hoạt động — JOIN ho_so để lọc chi nhánh đúng (theo revenue.controller.js)
      const activePackages = branchFilter
        ? db.prepare(`SELECT COUNT(*) AS cnt FROM dang_ky_goi_tap dk JOIN ho_so h ON h.id = dk.ho_so_id WHERE dk.trang_thai = 'dang_hoat_dong' AND h.chi_nhanh = ?`).get(branchFilter)?.cnt || 0
        : db.prepare(`SELECT COUNT(*) AS cnt FROM dang_ky_goi_tap WHERE trang_thai = 'dang_hoat_dong'`).get()?.cnt || 0;

      // Check-in hôm nay — lọc qua luot_vao_ra.chi_nhanh_thuc_hien
      const todayCheckins = branchFilter
        ? db.prepare(`SELECT COUNT(DISTINCT ho_so_id) AS cnt FROM luot_vao_ra WHERE date(thoi_diem) = date('now','localtime') AND loai = 'vao' AND chi_nhanh_thuc_hien = ?`).get(branchFilter)?.cnt || 0
        : db.prepare(`SELECT COUNT(DISTINCT ho_so_id) AS cnt FROM luot_vao_ra WHERE date(thoi_diem) = date('now','localtime') AND loai = 'vao'`).get()?.cnt || 0;

      // Doanh thu hôm nay — JOIN ho_so để lọc chi nhánh, dùng so_tien_da_thu (đồng bộ revenue.controller.js)
      let revenueText = '0 VND';
      if (branchFilter) {
        const today = new Date().toISOString().slice(0, 10);
        const tapRev = db.prepare(`
          SELECT COALESCE(SUM(dk.so_tien_da_thu), 0) AS total
          FROM dang_ky_goi_tap dk
          JOIN ho_so h ON h.id = dk.ho_so_id
          WHERE COALESCE(date(dk.ngay_thanh_toan), date(dk.ngay_tao)) = ?
            AND dk.trang_thai != 'huy'
            AND h.chi_nhanh = ?
        `).get(today, branchFilter);
        const ptRev = db.prepare(`
          SELECT COALESCE(SUM(gia_thuc_te), 0) AS total
          FROM dang_ky_pt dp
          WHERE COALESCE(date(ngay_thanh_toan), date(ngay_tao)) = ?
            AND trang_thai != 'huy'
            AND chi_nhanh_dang_ky = ?
        `).get(today, branchFilter);
        const tienTap = tapRev?.total || 0;
        const tienPt = ptRev?.total || 0;
        revenueText = `${(tienTap + tienPt).toLocaleString('vi-VN')} VND (Gói tập thường: ${tienTap.toLocaleString('vi-VN')} VND, Gói PT: ${tienPt.toLocaleString('vi-VN')} VND)`;
      } else {
        const todayRevenue = db.prepare(`SELECT tong_tien, tien_goi_tap, tien_goi_pt FROM doanh_thu WHERE ngay = date('now','localtime')`).get();
        revenueText = todayRevenue
          ? `${todayRevenue.tong_tien.toLocaleString('vi-VN')} VND (Gói tập thường: ${todayRevenue.tien_goi_tap.toLocaleString('vi-VN')} VND, Gói PT: ${todayRevenue.tien_goi_pt.toLocaleString('vi-VN')} VND)`
          : '0 VND';
      }

      // Ca tập PT hôm nay — lọc qua lich_tap.chi_nhanh_tap
      const ptScheduleStats = branchFilter
        ? db.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN trang_thai = 'da_tap' THEN 1 ELSE 0 END) AS completed FROM lich_tap WHERE ngay_tap = date('now','localtime') AND trang_thai != 'da_huy' AND chi_nhanh_tap = ?`).get(branchFilter)
        : db.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN trang_thai = 'da_tap' THEN 1 ELSE 0 END) AS completed FROM lich_tap WHERE ngay_tap = date('now','localtime') AND trang_thai != 'da_huy'`).get();

      // Chờ duyệt — JOIN ho_so để lọc chi nhánh đúng
      const pendingApprovals = branchFilter
        ? db.prepare(`SELECT COUNT(*) AS cnt FROM dang_ky_goi_tap dk JOIN ho_so h ON h.id = dk.ho_so_id WHERE dk.trang_thai = 'cho_duyet' AND h.chi_nhanh = ?`).get(branchFilter)?.cnt || 0
        : db.prepare(`SELECT COUNT(*) AS cnt FROM dang_ky_goi_tap WHERE trang_thai = 'cho_duyet'`).get()?.cnt || 0;

      const pendingRequests = db.prepare(`SELECT COUNT(*) AS cnt FROM yeu_cau_goi_tap WHERE trang_thai = 'cho_duyet'`).get()?.cnt || 0;

      userContext += `Đang xem số liệu của: ${branchLabel}.
Thống kê phòng tập hôm nay:
- Tổng số hội viên: ${totalMembers} người.
- Gói tập thường đang hoạt động: ${activePackages} gói.
- Lượt check-in vào phòng tập hôm nay: ${todayCheckins} hội viên.
- Doanh thu ghi nhận trong hôm nay: ${revenueText}.
- Ca tập PT hôm nay: Tổng số ${ptScheduleStats?.total || 0} ca (Đã hoàn thành: ${ptScheduleStats?.completed || 0}/${ptScheduleStats?.total || 0}).
- Yêu cầu chờ duyệt: ${pendingApprovals} đăng ký mới, ${pendingRequests} yêu cầu tạm dừng/gia hạn.`;

      const branchSQLNote = branchFilter
        ? `\n\n⚠️ QUAN TRỌNG: Người dùng đang ở chi nhánh "${branchFilter}". Khi dùng công cụ run_readonly_sql_query, PHẢI luôn thêm điều kiện lọc chi nhánh phù hợp vào câu SQL:\n- Bảng ho_so (alias h): AND h.chi_nhanh = '${branchFilter}'\n- Bảng luot_vao_ra (alias lv): AND lv.chi_nhanh_thuc_hien = '${branchFilter}'\n- Bảng dang_ky_goi_tap (alias dk): PHẢI JOIN ho_so h ON h.id = dk.ho_so_id rồi AND h.chi_nhanh = '${branchFilter}' (KHÔNG dùng dk.chi_nhanh_dang_ky vì không đáng tin cậy). Dùng dk.so_tien_da_thu cho doanh thu thực thu.\n- Bảng dang_ky_pt (alias dp): AND dp.chi_nhanh_dang_ky = '${branchFilter}'\n- Bảng lich_tap (alias lt): AND lt.chi_nhanh_tap = '${branchFilter}'\nKhông được trả về dữ liệu của chi nhánh khác.`
        : '';

      systemInstruction = `Bạn tên là Parry — trợ lý AI quản lý thông minh của phòng tập Paradise GYM (${new Date().toLocaleDateString('vi-VN')}). Bạn như một người trợ lý đắc lực, nắm rõ mọi số liệu vận hành và luôn sẵn sàng báo cáo nhanh, phân tích kịp thời để giúp việc quản lý nhẹ nhàng hơn.

Số liệu vận hành hôm nay:
${userContext}

Bạn có toàn quyền tra cứu bất kỳ dữ liệu nào trong hệ thống bằng công cụ run_readonly_sql_query — doanh thu, check-in, hội viên, PT, gói tập, lịch sử... Cứ hỏi là mình tìm được.

Cách bạn làm việc:
- Câu hỏi về hôm nay: trả lời ngay từ số liệu vận hành ở trên, không cần tra thêm.
- Câu hỏi về quá khứ hoặc phân tích chi tiết ("doanh thu tuần trước", "hội viên sắp hết hạn", "PT nào dạy nhiều nhất"...): dùng công cụ tra DB để lấy số liệu thật — không đoán, không bịa.
- Khi có dữ liệu từ tra cứu, hãy trình bày rõ ràng, dễ đọc — có thể dùng danh sách, bảng số liệu nếu cần.
- Luôn dùng tiếng Việt, xưng "mình" hoặc "Parry". Thân thiện nhưng chuyên nghiệp — như một đồng nghiệp giỏi, không phải robot.${branchSQLNote}` + accuracyRules;
    }

    // ── DANH SÁCH MODEL DỰ PHÒNG (ưu tiên model hỗ trợ tool calling) ──────
    // Groq models hỗ trợ tool calling tốt nhất hiện tại:
    const modelsWithTools = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama3-8b-8192'
    ];
    // Model fallback không dùng tool (nếu tất cả tool model thất bại)
    const modelsFallback = [
      'llama-3.1-8b-instant'
    ];

    let reply = '';
    let successCall = false;
    let lastErrorMsg = '';

    // ── VÒNG LẶP THỬ CÁC MODEL CÓ HỖ TRỢ TOOL ────────────────────────────
    for (const model of modelsWithTools) {
      try {
        // Khởi tạo conversation messages
        const conversationMessages = [
          { role: 'user', content: message }
        ];

        // Bước 1: Gửi tin nhắn ban đầu với tools
        let data = await callGroqWithTools(apiKey, systemInstruction, conversationMessages, model, true);
        const firstChoice = data.choices?.[0];

        if (!firstChoice) {
          lastErrorMsg = `Model ${model}: No choices returned`;
          continue;
        }

        const assistantMsg = firstChoice.message;

        // Bước 2: Nếu AI muốn gọi tool → thực thi và phản hồi
        if (firstChoice.finish_reason === 'tool_calls' && assistantMsg.tool_calls?.length > 0) {
          console.log(`[AI Tool] Model ${model} yêu cầu ${assistantMsg.tool_calls.length} tool call(s)`);

          // Thêm phản hồi assistant vào conversation
          conversationMessages.push(assistantMsg);

          // Thực thi từng tool call
          for (const toolCall of assistantMsg.tool_calls) {
            let toolResult;
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.log(`[AI Tool] Thực thi: ${args.description}`);
              console.log(`[AI Tool] SQL: ${args.sql}`);

              const rows = executeSafeSQL(args.sql, roleName);
              toolResult = JSON.stringify({
                success: true,
                row_count: rows.length,
                data: rows
              });
              console.log(`[AI Tool] Kết quả: ${rows.length} dòng`);
            } catch (toolErr) {
              console.error(`[AI Tool] Lỗi thực thi tool:`, toolErr.message);
              toolResult = JSON.stringify({
                success: false,
                error: toolErr.message
              });
            }

            // Thêm kết quả tool vào conversation
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolResult
            });
          }

          // Bước 3: Gửi lại conversation với kết quả tool để AI tổng hợp trả lời
          data = await callGroqWithTools(apiKey, systemInstruction, conversationMessages, model, false);
          const secondChoice = data.choices?.[0];

          if (secondChoice?.message?.content) {
            reply = secondChoice.message.content;
            successCall = true;
            console.log(`[AI Assistant] Model ${model} trả lời sau tool call thành công`);
            break;
          }
        } else if (assistantMsg?.content) {
          // AI trả lời trực tiếp không cần tool
          reply = assistantMsg.content;
          successCall = true;
          console.log(`[AI Assistant] Model ${model} trả lời trực tiếp thành công`);
          break;
        }

        lastErrorMsg = `Model ${model}: Empty response`;
      } catch (err) {
        console.error(`💥 [AI Assistant] Lỗi model ${model}:`, err);
        lastErrorMsg = `${model}: ${err.message}`;
      }
    }

    // ── FALLBACK TIER 2: Groq không có tool (mixtral) ─────────────────────
    if (!successCall) {
      console.warn('[AI Assistant] Tất cả Groq tool models thất bại, thử Groq fallback...');
      for (const model of modelsFallback) {
        try {
          const data = await callGroqWithTools(apiKey, systemInstruction, [
            { role: 'user', content: message }
          ], model, false);

          const content = data.choices?.[0]?.message?.content;
          if (content) {
            reply = content;
            successCall = true;
            console.log(`[AI Assistant] Groq fallback model ${model} thành công`);
            break;
          }
        } catch (err) {
          console.error(`[AI Assistant] Groq fallback model ${model} lỗi:`, err.message);
          lastErrorMsg = err.message;
        }
      }
    }

    // ── FALLBACK TIER 3: Gemini (khi tất cả Groq thất bại) ───────────────
    if (!successCall) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        console.warn('[AI Assistant] Tất cả Groq thất bại, chuyển sang Gemini...');
        try {
          const conversationMessages = [{ role: 'user', content: message }];

          // Bước 1: Gửi lên Gemini với tool calling
          let geminiData = await callGeminiWithTools(geminiKey, systemInstruction, conversationMessages, true);
          const candidate = geminiData.candidates?.[0];
          const parts = candidate?.content?.parts || [];

          // Kiểm tra xem Gemini có muốn gọi tool không
          const functionCallPart = parts.find(p => p.functionCall);

          if (functionCallPart) {
            console.log(`[Gemini Tool] Thực thi: ${functionCallPart.functionCall.name}`);
            const args = functionCallPart.functionCall.args;
            console.log(`[Gemini Tool] SQL: ${args.sql}`);

            let toolResult;
            try {
              const rows = executeSafeSQL(args.sql, roleName);
              toolResult = { success: true, row_count: rows.length, data: rows };
              console.log(`[Gemini Tool] Kết quả: ${rows.length} dòng`);
            } catch (toolErr) {
              console.error(`[Gemini Tool] Lỗi:`, toolErr.message);
              toolResult = { success: false, error: toolErr.message };
            }

            // Bước 2: Gửi kết quả tool về Gemini để tổng hợp
            // Thêm model turn (functionCall) và user turn (functionResponse)
            const messagesWithTool = [
              { role: 'user', content: message },
              {
                role: 'assistant',
                tool_calls: [{
                  function: {
                    name: functionCallPart.functionCall.name,
                    arguments: JSON.stringify(args)
                  }
                }]
              },
              {
                role: 'tool',
                content: JSON.stringify(toolResult)
              }
            ];

            geminiData = await callGeminiWithTools(geminiKey, systemInstruction, messagesWithTool, false);
            const finalText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (finalText) {
              reply = finalText;
              successCall = true;
              console.log(`[AI Assistant] Gemini trả lời sau tool call thành công`);
            }
          } else {
            // Gemini trả lời trực tiếp không cần tool
            const textPart = parts.find(p => p.text);
            if (textPart?.text) {
              reply = textPart.text;
              successCall = true;
              console.log(`[AI Assistant] Gemini trả lời trực tiếp thành công`);
            }
          }
        } catch (geminiErr) {
          console.error(`[AI Assistant] Gemini lỗi:`, geminiErr.message);
          lastErrorMsg = geminiErr.message;
        }
      } else {
        console.warn('[AI Assistant] Không có GEMINI_API_KEY, bỏ qua Gemini fallback.');
      }
    }

    if (!successCall) {
      console.error('All AI providers failed. Last error:', lastErrorMsg);
      return error(res, 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.', 502);
    }

    return success(res, { reply: reply.trim() });
  } catch (err) {
    console.error('Groq Chat Error:', err);
    return error(res, 'Có lỗi xảy ra khi xử lý yêu cầu với Trợ lý AI.', 500);
  }
};
