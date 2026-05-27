import db from '../config/db.js';
import { success, error } from '../utils/response.js';

export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return error(res, 'Vui lòng nhập tin nhắn.', 400);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return error(res, 'Chưa cấu hình API Key cho Trợ lý AI.', 500);
    }

    // Lấy thông tin tài khoản và vai trò của người dùng
    const userProfile = db.prepare(`
      SELECT id, ho_ten, loai_ho_so, gioi_tinh, chieu_cao_cm, can_nang_kg, kinh_nghiem
      FROM ho_so
      WHERE tai_khoan_id = ? AND is_deleted = 0
    `).get(req.user.id);

    if (!userProfile) {
      return error(res, 'Không tìm thấy hồ sơ người dùng hợp lệ.', 404);
    }

    let userContext = '';
    let systemInstruction = '';
    let roleName = userProfile.loai_ho_so; // 'hoi_vien', 'pt', 'le_tan', 'nhan_vien', 'nhan_vien' (admin)

    userContext += `Tên người dùng: ${userProfile.ho_ten}. `;
    userContext += `Vai trò: ${
      roleName === 'hoi_vien' ? 'Hội viên' : 
      roleName === 'pt' ? 'Huấn luyện viên (PT)' : 
      roleName === 'le_tan' ? 'Lễ tân' : 'Quản trị viên (Admin)'
    }. `;

    // ── NGHIỆP VỤ 1: HỘI VIÊN ──────────────────────────────────
    if (roleName === 'hoi_vien') {
      userContext += `Giới tính: ${userProfile.gioi_tinh === 'nam' ? 'Nam' : userProfile.gioi_tinh === 'nu' ? 'Nữ' : 'Chưa cập nhật'}. `;
      userContext += `Chiều cao: ${userProfile.chieu_cao_cm ? userProfile.chieu_cao_cm + 'cm' : 'Chưa cập nhật'}. `;
      userContext += `Cân nặng: ${userProfile.can_nang_kg ? userProfile.can_nang_kg + 'kg' : 'Chưa cập nhật'}. `;
      userContext += `Kinh nghiệm tập luyện: ${userProfile.kinh_nghiem ? userProfile.kinh_nghiem + ' tháng' : 'Chưa cập nhật'}. `;

      // Gói tập thường đang hoạt động
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

      // Gói PT đang hoạt động
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

      systemInstruction = `Bạn là trợ lý ảo chuyên nghiệp, nhiệt tình và thân thiện về gym, sức khỏe và dinh dưỡng của hệ thống phòng tập Paradise GYM.

THÔNG TIN HỘI VIÊN ĐANG TRÒ CHUYỆN:
${userContext}
Hãy sử dụng thông tin cá nhân trên một cách tự nhiên và tinh tế khi chào hỏi hoặc tư vấn phù hợp với thể trạng, mục tiêu hoặc gói tập của họ.

QUY TẮC PHẠM VI TRẢ LỜI NGHIÊM NGẶT:
Bạn CHỈ được phép trả lời các câu hỏi và thảo luận về các chủ đề sau:
- Luyện tập gym (bài tập, kế hoạch tập)
- Lịch tập (chia lịch tập, sắp xếp thời gian)
- Chế độ ăn uống và thực đơn dinh dưỡng
- Phục hồi cơ thể sau tập luyện
- Dinh dưỡng (calo, protein, carbs, fats, supplements...)
- Kỹ thuật tập luyện các bài tập
- Thói quen tập luyện lành mạnh

Nếu người dùng hỏi hoặc yêu cầu bất cứ điều gì NẰM NGOÀI các chủ đề trên (ví dụ: thời tiết, toán học, lập trình, chính trị, tin tức xã hội, văn học, các câu hỏi ngoài lề khác), bạn PHẢI từ chối trả lời và CHỈ phản hồi duy nhất câu ngắn gọn sau:
"Mình chỉ hỗ trợ về gym, lịch tập và dinh dưỡng thôi nhé."
Tuyệt đối không được giải thích gì thêm khi từ chối.`;

    // ── NGHIỆP VỤ 2: HUẤN LUYỆN VIÊN (PT) ──────────────────────
    } else if (roleName === 'pt') {
      // Lấy danh sách học viên đang quản lý
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
      } else {
        userContext += `Danh sách học viên: Hiện tại chưa có học viên đăng ký hoạt động. `;
      }

      systemInstruction = `Bạn là trợ lý ảo chuyên nghiệp, hỗ trợ đắc lực cho Huấn luyện viên (PT) tại Paradise GYM.

THÔNG TIN HUẤN LUYỆN VIÊN ĐANG TRÒ CHUYỆN:
${userContext}

QUY TẮC PHẠM VI TRẢ LỜI NGHIÊM NGẶT:
Bạn CHỈ được phép trả lời và hỗ trợ PT về các nghiệp vụ và chuyên môn sau:
- Hướng dẫn thiết lập kế hoạch tập luyện và thực đơn ăn uống cho học viên của họ.
- Tư vấn xử lý chấn thương, các bài tập phục hồi cho học viên.
- Giải đáp về quy chế, nội quy của PT tại phòng tập Paradise GYM.
- Hỗ trợ xây dựng giáo án huấn luyện nâng cao, kỹ thuật tập luyện chuyên sâu.
- Cách sắp xếp, quản lý lịch dạy học viên khoa học.

Nếu người dùng hỏi hoặc yêu cầu bất cứ điều gì NẰM NGOÀI các chủ đề trên (ví dụ: thời tiết, lập trình, kiểm thử phần mềm, tin tức...), bạn PHẢI từ chối trả lời và CHỈ phản hồi duy nhất câu ngắn gọn sau:
"Mình chỉ hỗ trợ giải đáp về nghiệp vụ huấn luyện, lịch dạy và chuyên môn fitness thôi nhé."
Tuyệt đối không giải thích thêm.`;

    // ── NGHIỆP VỤ 3: QUẢN TRỊ VIÊN / LỄ TÂN ─────────────────────
    } else {
      // Thống kê nhanh phòng gym để phục vụ tư vấn quản lý
      const totalMembers = db.prepare(`SELECT COUNT(*) AS cnt FROM ho_so WHERE loai_ho_so = 'hoi_vien' AND is_deleted = 0`).get()?.cnt || 0;
      const activePackages = db.prepare(`SELECT COUNT(*) AS cnt FROM dang_ky_goi_tap WHERE trang_thai = 'dang_hoat_dong'`).get()?.cnt || 0;
      const todayCheckins = db.prepare(`SELECT COUNT(*) AS cnt FROM luot_vao_ra WHERE date(thoi_diem) = date('now','localtime')`).get()?.cnt || 0;

      userContext += `Thống kê phòng tập hiện tại: Tổng số hội viên: ${totalMembers} người; Gói tập đang kích hoạt: ${activePackages} gói; Lượt check-in trong ngày hôm nay: ${todayCheckins} lượt. `;

      systemInstruction = `Bạn là trợ lý ảo cố vấn quản lý và vận hành thông minh dành riêng cho Ban quản lý (Admin) và Lễ tân tại Paradise GYM.

THÔNG TIN VẬN HÀNH PHÒNG TẬP HIỆN TẠI:
${userContext}

QUY TẮC PHẠM VI TRẢ LỜI NGHIÊM NGẶT:
Bạn CHỈ được phép trả lời và hỗ trợ Ban quản lý/Lễ tân về các nghiệp vụ sau:
- Nghiệp vụ đăng ký mới, gia hạn, hủy gói tập hoặc chuyển nhượng gói tập cho hội viên.
- Tư vấn cách kiểm tra, phê duyệt các yêu cầu gói tập từ App gửi về.
- Hướng dẫn xử lý sự cố check-in (lỗi thẻ từ, lỗi QR Code, hội viên quên mang thẻ).
- Giải đáp các thông tin về cơ cấu bảng giá, danh mục các gói tập thường/gói PT của phòng gym.
- Phân tích và đưa ra giải pháp cải thiện doanh thu, nâng cao lượng check-in hoặc chăm sóc khách hàng.

Nếu người dùng hỏi hoặc yêu cầu bất cứ điều gì NẰM NGOÀI các chủ đề trên (ví dụ: thời tiết, lập trình, toán học...), bạn PHẢI từ chối trả lời và CHỈ phản hồi duy nhất câu ngắn gọn sau:
"Mình chỉ hỗ trợ giải đáp về nghiệp vụ quản lý, doanh thu và vận hành phòng gym thôi nhé."
Tuyệt đối không giải thích gì thêm.`;
    }

    // Gọi đến Groq API chat completions endpoint
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    // Danh sách model dự phòng trên Groq
    const models = [
      'llama-3.3-70b-specdec',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama3-8b-8192',
      'mixtral-8x7b-32768'
    ];

    let reply = '';
    let successCall = false;
    let lastErrorMsg = '';

    for (const model of models) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: systemInstruction
              },
              {
                role: 'user',
                content: message
              }
            ],
            temperature: 0.7,
            max_tokens: 1024
          })
        });

        if (response.ok) {
          const data = await response.json();
          reply = data.choices?.[0]?.message?.content || '';
          successCall = true;
          console.log(`🤖 [AI Assistant] Successfully responded using Groq - ${model}`);
          break; // Thành công, thoát vòng lặp
        } else {
          const errText = await response.text();
          console.warn(`⚠️ [AI Assistant] Failed Groq model ${model}:`, errText);
          lastErrorMsg = errText;
        }
      } catch (err) {
        console.error(`💥 [AI Assistant] Error calling Groq model ${model}:`, err.message);
        lastErrorMsg = err.message;
      }
    }

    if (!successCall) {
      console.error('All Groq API models failed. Last error:', lastErrorMsg);
      return error(res, 'Không thể kết nối với dịch vụ AI Groq (Sai cấu hình Key hoặc Hết hạn mức).', 502);
    }

    return success(res, { reply: reply.trim() });
  } catch (err) {
    console.error('Groq Chat Error:', err);
    return error(res, 'Có lỗi xảy ra khi xử lý yêu cầu với Trợ lý AI.', 500);
  }
};
