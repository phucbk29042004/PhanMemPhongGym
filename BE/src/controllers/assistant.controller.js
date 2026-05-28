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
    let roleName = userProfile.loai_ho_so; // 'hoi_vien', 'pt', 'le_tan', 'nhan_vien' (admin)

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

      // Lấy lịch tập hôm nay của hội viên
      const todaySchedule = db.prepare(`
        SELECT lt.gio_bat_dau, lt.gio_ket_thuc, lt.loai_buoi, lt.trang_thai, pt.ho_ten AS ten_pt
        FROM lich_tap lt
        JOIN ho_so pt ON pt.id = lt.pt_id
        WHERE lt.hoi_vien_id = ? AND lt.ngay_tap = date('now','localtime') AND lt.trang_thai != 'da_huy'
        ORDER BY lt.gio_bat_dau
      `).all(userProfile.id);

      if (todaySchedule.length > 0) {
        userContext += `Lịch tập hôm nay: ${todaySchedule.map(s => `- Ca tập PT từ ${s.gio_bat_dau} đến ${s.gio_ket_thuc} (${s.loai_buoi === 'ca_nhan' ? 'Cá nhân' : 'Nhóm'}, PT: ${s.ten_pt}, Trạng thái: ${s.trang_thai === 'cho_tap' ? 'Chưa tập (Đang chờ)' : s.trang_thai === 'da_tap' ? 'Đã tập xong' : s.trang_thai})`).join('\n')}. `;
      } else {
        userContext += `Lịch tập hôm nay: Bạn không có lịch tập PT nào được lên lịch hôm nay. `;
      }

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

      systemInstruction = `Bạn là trợ lý ảo chuyên nghiệp, nhiệt tình và thân thiện của hệ thống phòng tập Paradise GYM. Bạn có kiến thức rộng về gym, sức khỏe, dinh dưỡng cũng như tất cả các lĩnh vực đời sống, khoa học, xã hội (sử dụng kiến thức đã được train sẵn của bạn).

THÔNG TIN HỘI VIÊN ĐANG TRÒ CHUYỆN:
${userContext}

QUY TẮC TRẢ LỜI QUAN TRỌNG:
1. Hãy sử dụng thông tin cá nhân trên một cách tự nhiên và tinh tế khi chào hỏi hoặc tư vấn phù hợp với thể trạng, mục tiêu hoặc gói tập của họ.
2. Nếu Hội viên hỏi "Hôm nay tôi có lịch tập không?" hoặc "Lịch tập hôm nay", hãy lấy thông tin từ "Lịch tập hôm nay" ở phần ngữ cảnh để trả lời chính xác, nêu cụ thể giờ tập, PT hướng dẫn và trạng thái. Nếu họ không có lịch, hãy lịch sự thông báo và hỏi họ xem họ có muốn đặt lịch với PT hoặc tự tập không.
3. Ngoài các câu hỏi liên quan đến phòng tập, gym và dinh dưỡng, bạn hoàn toàn có thể tự do trò chuyện và trả lời các câu hỏi về bất kỳ chủ đề nào khác (như khoa học, đời sống, lập trình, học tập...) bằng cách sử dụng kiến thức đã được train sẵn của bạn để hỗ trợ hội viên tốt nhất.`;

    // ── NGHIỆP VỤ 2: HUẤN LUYỆN VIÊN (PT) ──────────────────────
    } else if (roleName === 'pt') {
      // Lấy lịch dạy hôm nay của PT
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
        userContext += `Lịch dạy hôm nay: Huấn luyện viên không có ca dạy nào được xếp lịch hôm nay. `;
      }

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

      systemInstruction = `Bạn là trợ lý ảo chuyên nghiệp, hỗ trợ đắc lực cho Huấn luyện viên (PT) tại Paradise GYM. Bạn sẵn sàng giải đáp bất kỳ câu hỏi nào từ HLV sử dụng kiến thức chung và nghiệp vụ huấn luyện của mình.

THÔNG TIN HUẤN LUYỆN VIÊN ĐANG TRÒ CHUYỆN:
${userContext}

QUY TẮC TRẢ LỜI QUAN TRỌNG:
1. Nếu PT hỏi về lịch dạy hôm nay hoặc ca dạy hôm nay, hãy trích xuất dữ liệu từ "Lịch dạy hôm nay" để phản hồi chi tiết (giờ dạy, học viên và trạng thái ca dạy).
2. Hãy phản hồi với phong cách chuyên nghiệp, tôn trọng nhưng cũng gần gũi, giúp PT nắm bắt nhanh thông tin vận hành của mình.
3. Ngoài các nghiệp vụ và chuyên môn fitness tại phòng tập, bạn hoàn toàn có thể tự do trả lời bất kỳ thắc mắc hoặc hỗ trợ PT ở các chủ đề khác (như công việc, đời sống, khoa học, lập trình...) bằng kiến thức train sẵn của bạn.`;

    // ── NGHIỆP VỤ 3: QUẢN TRỊ VIÊN / LỄ TÂN ─────────────────────
    } else {
      // Thống kê nhanh phòng gym để phục vụ tư vấn quản lý
      const totalMembers = db.prepare(`SELECT COUNT(*) AS cnt FROM ho_so WHERE loai_ho_so = 'hoi_vien' AND is_deleted = 0`).get()?.cnt || 0;
      const activePackages = db.prepare(`SELECT COUNT(*) AS cnt FROM dang_ky_goi_tap WHERE trang_thai = 'dang_hoat_dong'`).get()?.cnt || 0;
      
      // Số người check-in vào hôm nay
      const todayCheckins = db.prepare(`
        SELECT COUNT(DISTINCT ho_so_id) AS cnt FROM luot_vao_ra 
        WHERE date(thoi_diem) = date('now','localtime') AND loai = 'vao'
      `).get()?.cnt || 0;

      // Doanh thu hôm nay
      const todayRevenue = db.prepare(`
        SELECT tong_tien, tien_goi_tap, tien_goi_pt FROM doanh_thu 
        WHERE ngay = date('now','localtime')
      `).get();
      const revenueText = todayRevenue 
        ? `${todayRevenue.tong_tien.toLocaleString('vi-VN')} VND (Gói tập thường: ${todayRevenue.tien_goi_tap.toLocaleString('vi-VN')} VND, Gói PT: ${todayRevenue.tien_goi_pt.toLocaleString('vi-VN')} VND)` 
        : '0 VND';

      // Số ca tập PT hôm nay
      const ptScheduleStats = db.prepare(`
        SELECT 
          COUNT(*) AS total,
          SUM(CASE WHEN trang_thai = 'da_tap' THEN 1 ELSE 0 END) AS completed
        FROM lich_tap
        WHERE ngay_tap = date('now','localtime') AND trang_thai != 'da_huy'
      `).get();

      // Số đăng ký gói tập mới đang chờ duyệt
      const pendingApprovals = db.prepare(`
        SELECT COUNT(*) AS cnt FROM dang_ky_goi_tap WHERE trang_thai = 'cho_duyet'
      `).get()?.cnt || 0;

      // Số yêu cầu tạm dừng/gia hạn đang chờ duyệt
      const pendingRequests = db.prepare(`
        SELECT COUNT(*) AS cnt FROM yeu_cau_goi_tap WHERE trang_thai = 'cho_duyet'
      `).get()?.cnt || 0;

      userContext += `Thống kê phòng tập hôm nay: 
- Tổng số hội viên: ${totalMembers} người.
- Gói tập thường đang hoạt động: ${activePackages} gói.
- Lượt check-in vào phòng tập hôm nay: ${todayCheckins} hội viên.
- Doanh thu ghi nhận trong hôm nay: ${revenueText}.
- Ca tập PT hôm nay: Tổng số ${ptScheduleStats.total} ca (Đã hoàn thành: ${ptScheduleStats.completed || 0}/${ptScheduleStats.total}).
- Yêu cầu chờ duyệt: ${pendingApprovals} đăng ký mới, ${pendingRequests} yêu cầu tạm dừng/gia hạn.`;

      systemInstruction = `Bạn là trợ lý ảo cố vấn quản lý và vận hành thông minh dành riêng cho Ban quản lý (Admin) và Lễ tân tại Paradise GYM. Bạn sẵn sàng hỗ trợ giải đáp mọi thắc mắc về vận hành phòng gym cũng như các câu hỏi kiến thức chung khác.

THÔNG TIN VẬN HÀNH PHÒNG TẬP HIỆN TẠI:
${userContext}

QUY TẮC TRẢ LỜI QUAN TRỌNG:
1. Hãy sử dụng thông tin vận hành trên để trả lời ngay lập tức các câu hỏi về doanh thu, lượt check-in, ca dạy PT hôm nay hay số yêu cầu đang chờ duyệt.
2. Trả lời một cách rõ ràng, mạch lạc, nên trình bày dạng gạch đầu dòng các thông số khi được hỏi về báo cáo tổng quan.
3. Ngoài các nghiệp vụ quản lý phòng tập, bạn hoàn toàn có thể tự do trả lời bất kỳ thắc mắc nào ở các lĩnh vực khác bằng cách sử dụng kho kiến thức đã được train sẵn của mình.`;
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
