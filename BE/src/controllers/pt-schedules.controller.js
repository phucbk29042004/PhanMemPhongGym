/**
 * PT Schedules Controller — Quản lý lịch tập PT
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { ghi_audit_log } from '../utils/audit.js';
import { createNotification, createUserNotification } from '../utils/notifications.js';
import { getActorBranch } from '../utils/branch.js';
import { getIO } from '../socket.js';


const getTodayStrHoChiMinh = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.format(new Date()).split('/');
  return `${parts[2]}-${parts[0]}-${parts[1]}`;
};

const getNowTimeStrHoChiMinh = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(new Date());
};


const safeJson = (value, fallback = []) => {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch (_) { return fallback; }
};

const toJson = (value) => {
  if (value == null) return null;
  return JSON.stringify(value);
};

export const autoCancelExpiredSchedules = () => {
  const todayStr = getTodayStrHoChiMinh();
  const nowTimeStr = getNowTimeStrHoChiMinh();

  // Tìm các lịch tập quá hạn đang ở trạng thái 'cho_tap' hoặc 'pending'
  const expired = db.prepare(`
    SELECT lt.id, lt.pt_id, lt.hoi_vien_id, lt.ngay_tap, lt.gio_bat_dau, lt.gio_ket_thuc,
           hv.ho_ten AS ho_ten_hoi_vien, pt.ho_ten AS ho_ten_pt
    FROM lich_tap lt
    JOIN ho_so hv ON hv.id = lt.hoi_vien_id
    JOIN ho_so pt ON pt.id = lt.pt_id
    WHERE lt.trang_thai IN ('cho_tap', 'pending')
      AND (lt.ngay_tap < ? OR (lt.ngay_tap = ? AND lt.gio_ket_thuc <= ?))
  `).all(todayStr, todayStr, nowTimeStr);

  if (expired.length === 0) return;

  const updateOne = db.prepare(`
    UPDATE lich_tap
    SET trang_thai = 'da_huy', ly_do_huy = 'Hệ thống tự động hủy do quá hạn khung giờ đặt lịch', nguoi_huy_id = NULL
    WHERE id = ?
  `);

  const cancelAll = db.transaction((rows) => {
    for (const row of rows) {
      updateOne.run(row.id);
      
      // Tạo thông báo cho admin
      createNotification(
        'huy_buoi_tap',
        'Buổi tập tự động hủy',
        `Buổi ${row.gio_bat_dau} ngày ${row.ngay_tap} của ${row.ho_ten_hoi_vien} với HLV ${row.ho_ten_pt} đã tự động hủy do quá hạn`,
        row.id,
        'lich_tap',
        'ca_hai'
      );

      // Tạo thông báo cá nhân cho Hội viên và PT
      createUserNotification(
        row.hoi_vien_id,
        'Buổi tập bị hủy tự động ❌',
        `Buổi tập lúc ${row.gio_bat_dau} ngày ${row.ngay_tap} với HLV ${row.ho_ten_pt} đã bị hệ thống tự động hủy do quá hạn khung giờ.`,
        'nhac_nho_gia_han'
      );
      createUserNotification(
        row.pt_id,
        'Buổi dạy bị hủy tự động ❌',
        `Buổi dạy lúc ${row.gio_bat_dau} ngày ${row.ngay_tap} với học viên ${row.ho_ten_hoi_vien} đã bị hệ thống tự động hủy do quá hạn khung giờ.`,
        'nhac_nho_gia_han'
      );
    }
  });

  try {
    cancelAll(expired);
    console.log(`[AUTO-CANCEL] Đã tự động hủy ${expired.length} buổi tập PT quá hạn.`);
  } catch (err) {
    console.error('[AUTO-CANCEL] Lỗi khi tự động hủy lịch tập:', err.message);
  }
};

// ── GET /api/pt/schedules ─────────────────────────────────
// Xem lịch tập toàn phòng (admin) hoặc lịch cá nhân (PT/hội viên)
export const getSchedules = (req, res) => {
  // Tự động quét và hủy lịch quá hạn trước khi trả về danh sách
  autoCancelExpiredSchedules();

  const { date, pt_id, hoi_vien_id, trang_thai, chi_nhanh } = req.query;

  let filterBranch = chi_nhanh;
  if (req.user.vai_tro !== 'admin' && req.user.vai_tro !== 'chu_phong_gym') {
    const actor = db.prepare('SELECT chi_nhanh FROM ho_so WHERE tai_khoan_id = ? AND is_deleted = 0').get(req.user.id);
    filterBranch = actor?.chi_nhanh || 'KHONG_CO_CHI_NHANH';
  }

  let where = 'WHERE 1=1';
  const params = [];

  if (filterBranch) {
    where += ' AND lt.chi_nhanh_tap = ?';
    params.push(filterBranch);
  }

  // Nếu là PT: chỉ xem lịch của mình
  if (req.user.vai_tro === 'pt') {
    const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (hoSo) { where += ' AND lt.pt_id = ?'; params.push(hoSo.id); }
  }
  // Nếu là hội viên: chỉ xem lịch của mình
  else if (req.user.vai_tro === 'hoi_vien') {
    const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (hoSo) { where += ' AND lt.hoi_vien_id = ?'; params.push(hoSo.id); }
  }
  // Admin/lễ tân: xem được tất cả, có thể filter thêm
  else {
    if (pt_id) { where += ' AND lt.pt_id = ?'; params.push(pt_id); }
    if (hoi_vien_id) { where += ' AND lt.hoi_vien_id = ?'; params.push(hoi_vien_id); }
  }

  if (date) { where += ' AND lt.ngay_tap = ?'; params.push(date); }
  if (trang_thai) { where += ' AND lt.trang_thai = ?'; params.push(trang_thai); }

  const rows = db.prepare(`
    SELECT
      lt.id, lt.ngay_tap, lt.gio_bat_dau, lt.gio_ket_thuc,
      lt.loai_buoi, lt.trang_thai, lt.ghi_chu, lt.ly_do_huy,
      lt.pt_xac_nhan, lt.hv_xac_nhan, lt.chi_nhanh_tap,
      hv.id AS hoi_vien_id, hv.ho_ten AS ten_hoi_vien, hv.avatar_url AS avatar_hoi_vien,
      pt.id AS pt_id, pt.ho_ten AS ten_pt, pt.avatar_url AS avatar_pt,
      dk.so_buoi_dang_ky, dk.so_buoi_da_tap,
      (dk.so_buoi_dang_ky - dk.so_buoi_da_tap) AS buoi_con_lai,
      lt.ngay_xac_nhan,
      dg.so_sao AS danh_gia_sao,
      dg.noi_dung AS danh_gia_noi_dung,
      dg.tag_json AS danh_gia_tags,
      dg.tieu_chi_json AS danh_gia_tieu_chi,
      ROUND((SELECT AVG(so_sao) FROM danh_gia_pt WHERE pt_id = lt.pt_id), 1) AS pt_rating,
      (SELECT COUNT(*) FROM danh_gia_pt WHERE pt_id = lt.pt_id) AS pt_rating_count
    FROM lich_tap lt
    JOIN ho_so hv ON hv.id = lt.hoi_vien_id
    JOIN ho_so pt ON pt.id = lt.pt_id
    JOIN dang_ky_pt dk ON dk.id = lt.dang_ky_pt_id
    LEFT JOIN danh_gia_pt dg ON dg.lich_tap_id = lt.id AND dg.hoi_vien_id = lt.hoi_vien_id
    ${where} AND hv.is_deleted = 0 AND pt.is_deleted = 0
    ORDER BY lt.id DESC
  `).all(...params);

  rows.forEach(row => {
    row.danh_gia_tags = safeJson(row.danh_gia_tags);
    row.danh_gia_tieu_chi = safeJson(row.danh_gia_tieu_chi, {});
  });

  return success(res, rows);
};

// ── POST /api/pt/schedules ────────────────────────────────
// Đặt lịch tập mới
export const createSchedule = (req, res) => {
  const { dang_ky_pt_id, ngay_tap, gio_bat_dau, gio_ket_thuc, loai_buoi = 'ca_nhan', ghi_chu } = req.body;
  if (!dang_ky_pt_id || !ngay_tap || !gio_bat_dau || !gio_ket_thuc) {
    return error(res, 'Thiếu: dang_ky_pt_id, ngay_tap, gio_bat_dau, gio_ket_thuc', 400);
  }

  // Chặn đặt lịch trong quá khứ
  const todayStr = getTodayStrHoChiMinh();
  if (ngay_tap < todayStr) {
    return error(res, 'Không thể đặt lịch tập ở ngày trong quá khứ.', 400);
  }
  // Chặn đặt lịch vào giờ đã qua trong ngày hôm nay
  if (ngay_tap === todayStr) {
    const nowTime = getNowTimeStrHoChiMinh();
    if (gio_bat_dau <= nowTime) {
      return error(res, 'Không thể đặt lịch tập vào giờ đã qua trong ngày hôm nay.', 400);
    }
  }

  // Lấy thông tin đăng ký PT
  const dkpt = db.prepare(`
    SELECT dp.*, h_hv.id AS hv_id, h_hv.ho_ten AS ho_ten_hv, h_pt.id AS pt_hoso_id, h_pt.ho_ten AS ho_ten_pt
    FROM dang_ky_pt dp
    JOIN ho_so h_hv ON h_hv.id = dp.hoi_vien_id
    JOIN ho_so h_pt ON h_pt.id = dp.pt_id
    WHERE dp.id = ? AND dp.trang_thai = 'dang_hoat_dong' AND h_hv.is_deleted = 0 AND h_pt.is_deleted = 0
  `).get(dang_ky_pt_id);

  if (!dkpt) return error(res, 'Đăng ký PT không tồn tại hoặc đã kết thúc.', 404);

  // Kiểm tra gói Gym chính còn hạn (hội viên phải có gói Gym bao trùm ngày tập)
  const activeGym = db.prepare(`
    SELECT id FROM dang_ky_goi_tap
    WHERE hoi_vien_id = ? AND trang_thai = 'dang_hoat_dong' AND tu_ngay <= ? AND den_ngay >= ?
    LIMIT 1
  `).get(dkpt.hoi_vien_id, ngay_tap, ngay_tap);

  if (!activeGym) {
    return error(res, 'Hội viên không có gói Gym còn hiệu lực vào ngày tập này. Vui lòng gia hạn gói Gym trước khi xếp lịch.', 400);
  }

  // Chặn đặt lịch trước ngày bắt đầu hiệu lực của gói PT
  if (dkpt.tu_ngay && ngay_tap < dkpt.tu_ngay) {
    return error(res, `Gói PT chưa có hiệu lực. Chỉ được đặt lịch từ ngày ${dkpt.tu_ngay} trở đi.`, 400);
  }

  const actorBranch = getActorBranch(req.user);
  if (actorBranch) {
    // Nếu tài khoản là PT, chi nhánh của họ được lưu trong hồ sơ PT.
    // Cho phép PT đặt lịch nếu chi nhánh của PT trùng với chi nhánh đăng ký của gói (dkpt.chi_nhanh_dang_ky)
    // Hoặc nếu trùng với chi nhánh dạy.
    if (req.user.vai_tro === 'pt') {
      const ptProfile = db.prepare('SELECT chi_nhanh FROM ho_so WHERE id = ?').get(dkpt.pt_id);
      const ptBranch = ptProfile?.chi_nhanh || actorBranch;
      if (dkpt.chi_nhanh_dang_ky !== ptBranch) {
        return error(res, `Bạn không có quyền xếp lịch cho học viên thuộc chi nhánh khác (Chi nhánh đăng ký gói: ${dkpt.chi_nhanh_dang_ky}, Chi nhánh của bạn: ${ptBranch}).`, 403);
      }
    } else {
      // Đối với Lễ tân/nhân viên chi nhánh khác
      if (dkpt.chi_nhanh_dang_ky !== actorBranch) {
        return error(res, 'Bạn không có quyền xếp lịch cho hội viên thuộc chi nhánh khác.', 403);
      }
    }
  }


  // PT chỉ đặt lịch cho học viên của mình
  if (req.user.vai_tro === 'pt') {
    const hoSoPt = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (!hoSoPt || dkpt.pt_id !== hoSoPt.id) {
      return error(res, 'Bạn chỉ có thể đặt lịch cho học viên của chính mình.', 403);
    }
  }

  // Kiểm tra số lượng buổi đã lên lịch (gồm đã tập và chờ tập)
  if (dkpt.so_buoi_dang_ky !== null) {
    const scheduledCount = db.prepare(`
      SELECT COUNT(*) as cnt FROM lich_tap
      WHERE dang_ky_pt_id = ? AND trang_thai IN ('da_tap', 'cho_tap')
    `).get(dang_ky_pt_id).cnt;

    if (scheduledCount >= dkpt.so_buoi_dang_ky) {
      return error(res, `Đăng ký PT đã đặt đủ số buổi tập (${dkpt.so_buoi_dang_ky} buổi). Không thể đặt thêm.`, 400);
    }
  }

  // Kiểm tra PT có lịch bị trùng không
  const conflict = db.prepare(`
    SELECT id FROM lich_tap
    WHERE pt_id = ? AND ngay_tap = ? AND trang_thai != 'da_huy'
      AND NOT (gio_ket_thuc <= ? OR gio_bat_dau >= ?)
  `).get(dkpt.pt_id, ngay_tap, gio_bat_dau, gio_ket_thuc);

  if (conflict) return error(res, 'PT đã có lịch tập trong khung giờ này.', 409);

  // Kiểm tra Hội viên có lịch bị trùng không
  const memberConflict = db.prepare(`
    SELECT id FROM lich_tap
    WHERE hoi_vien_id = ? AND ngay_tap = ? AND trang_thai != 'da_huy'
      AND NOT (gio_ket_thuc <= ? OR gio_bat_dau >= ?)
  `).get(dkpt.hoi_vien_id, ngay_tap, gio_bat_dau, gio_ket_thuc);

  if (memberConflict) return error(res, 'Hội viên đã có lịch tập khác trong khung giờ này.', 409);

  const { chi_nhanh_tap } = req.body;
  let branchTap = chi_nhanh_tap;
  if (!branchTap) {
    const ptProfile = db.prepare('SELECT chi_nhanh FROM ho_so WHERE id = ?').get(dkpt.pt_id);
    branchTap = ptProfile ? ptProfile.chi_nhanh : null;
  }

  const result = db.prepare(`
    INSERT INTO lich_tap (dang_ky_pt_id, pt_id, hoi_vien_id, ngay_tap, gio_bat_dau, gio_ket_thuc, loai_buoi, ghi_chu, nguoi_tao_id, chi_nhanh_tap)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(dang_ky_pt_id, dkpt.pt_id, dkpt.hoi_vien_id, ngay_tap, gio_bat_dau, gio_ket_thuc, loai_buoi, ghi_chu || null, req.user.id, branchTap);

  ghi_audit_log(req, 'CREATE', 'lich_tap', result.lastInsertRowid, null, { ngay_tap, gio_bat_dau, gio_ket_thuc }, 'Đặt lịch tập PT');

  // Tạo thông báo inbox cá nhân (chạm đến hộp thư di động & kích hoạt badge số lượng màu đỏ)
  createUserNotification(
    dkpt.hv_id,
    'Lịch tập mới được xếp 🗓️',
    `Bạn có lịch tập mới vào lúc ${gio_bat_dau}–${gio_ket_thuc} ngày ${ngay_tap} với HLV ${dkpt.ho_ten_pt}.`,
    'thong_bao_chung'
  );
  createUserNotification(
    dkpt.pt_hoso_id,
    'Lịch tập mới được xếp 🗓️',
    `Lịch dạy mới với học viên ${dkpt.ho_ten_hv} vào lúc ${gio_bat_dau}–${gio_ket_thuc} ngày ${ngay_tap} đã được xếp thành công.`,
    'thong_bao_chung'
  );

  try { getIO().emit('pt_schedule_changed', { action: 'create' }); } catch (_) {}
  return success(res, db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(result.lastInsertRowid), 'Đặt lịch thành công', 201);
};

// ── PUT /api/pt/schedules/:id/confirm ────────────────────
// Xác nhận buổi đã tập (cơ chế xác nhận kép: PT + Hội viên)
export const confirmSchedule = (req, res) => {
  const { id } = req.params;
  const schedule = db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);

  const actorBranch = getActorBranch(req.user);
  if (actorBranch && schedule.chi_nhanh_tap !== actorBranch) {
    return error(res, 'Bạn không có quyền xác nhận buổi tập thuộc chi nhánh khác.', 403);
  }

  if (schedule.trang_thai !== 'cho_tap') return error(res, `Buổi tập đang ở trạng thái: ${schedule.trang_thai}. Chỉ xác nhận được buổi "cho_tap".`, 400);

  const vai_tro = req.user.vai_tro;

  if (vai_tro === 'pt') {
    const hoSoPt = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (!hoSoPt || schedule.pt_id !== hoSoPt.id) {
      return error(res, 'Bạn chỉ có thể xác nhận buổi tập do chính mình phụ trách.', 403);
    }
    if (schedule.pt_xac_nhan === 1) {
      return error(res, 'Bạn đã xác nhận buổi tập này rồi.', 400);
    }
    db.prepare(`UPDATE lich_tap SET pt_xac_nhan = 1 WHERE id = ?`).run(id);
  } else if (vai_tro === 'hoi_vien') {
    const hoSoHv = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (!hoSoHv || schedule.hoi_vien_id !== hoSoHv.id) {
      return error(res, 'Bạn chỉ có thể xác nhận buổi tập của chính mình.', 403);
    }
    if (schedule.hv_xac_nhan === 1) {
      return error(res, 'Bạn đã xác nhận buổi tập này rồi.', 400);
    }
    db.prepare(`UPDATE lich_tap SET hv_xac_nhan = 1 WHERE id = ?`).run(id);
  } else {
    // Admin / lễ tân: xác nhận thay cho cả 2
    db.prepare(`UPDATE lich_tap SET pt_xac_nhan = 1, hv_xac_nhan = 1 WHERE id = ?`).run(id);
  }

  const updated = db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id);
  const bothConfirmed = updated.pt_xac_nhan === 1 && updated.hv_xac_nhan === 1;

  if (bothConfirmed) {
    // Trigger trg_xac_nhan_buoi_tap sẽ tự động tăng so_buoi_da_tap
    db.prepare(`
      UPDATE lich_tap SET trang_thai = 'da_tap', confirmed_by_id = ?, ngay_xac_nhan = datetime('now','localtime') WHERE id = ?
    `).run(req.user.id, id);

    const schedInfo = db.prepare(`
      SELECT hv.id AS hv_id, hv.ho_ten AS ten_hv, pt.id AS pt_id, pt.ho_ten AS ten_pt, lt.ngay_tap
      FROM lich_tap lt JOIN ho_so hv ON hv.id = lt.hoi_vien_id JOIN ho_so pt ON pt.id = lt.pt_id WHERE lt.id = ?
    `).get(id);
    if (schedInfo) {
      createUserNotification(schedInfo.hv_id, '✅ Buổi tập hoàn thành', `Buổi tập ngày ${schedInfo.ngay_tap} với HLV ${schedInfo.ten_pt} đã được xác nhận hoàn thành.`, 'thong_bao_chung');
      createUserNotification(schedInfo.pt_id, '✅ Buổi dạy hoàn thành', `Buổi dạy ngày ${schedInfo.ngay_tap} với học viên ${schedInfo.ten_hv} đã được xác nhận hoàn thành.`, 'thong_bao_chung');
    }
    ghi_audit_log(req, 'UPDATE', 'lich_tap', parseInt(id), { trang_thai: 'cho_tap' }, { trang_thai: 'da_tap' }, 'Xác nhận buổi tập (cả 2 bên)');
    try { getIO().emit('pt_schedule_changed', { action: 'confirm', id }); } catch (_) {}
    return success(res, { bothConfirmed: true, pt_xac_nhan: 1, hv_xac_nhan: 1 }, 'Cả hai đã xác nhận. Buổi tập hoàn thành!');
  }

  // Chỉ 1 bên xác nhận — thông báo bên kia
  const schedInfo = db.prepare(`
    SELECT hv.id AS hv_id, hv.ho_ten AS ten_hv, pt.id AS pt_id, pt.ho_ten AS ten_pt, lt.ngay_tap
    FROM lich_tap lt JOIN ho_so hv ON hv.id = lt.hoi_vien_id JOIN ho_so pt ON pt.id = lt.pt_id WHERE lt.id = ?
  `).get(id);
  if (schedInfo) {
    if (vai_tro === 'pt') {
      createUserNotification(schedInfo.hv_id, '⏳ Xác nhận buổi tập', `PT ${schedInfo.ten_pt} đã xác nhận buổi tập ngày ${schedInfo.ngay_tap}. Vui lòng xác nhận để hoàn thành.`, 'thong_bao_chung');
    } else if (vai_tro === 'hoi_vien') {
      createUserNotification(schedInfo.pt_id, '⏳ Xác nhận buổi tập', `Học viên ${schedInfo.ten_hv} đã xác nhận buổi tập ngày ${schedInfo.ngay_tap}. Vui lòng xác nhận để hoàn thành.`, 'thong_bao_chung');
    }
  }
  ghi_audit_log(req, 'UPDATE', 'lich_tap', parseInt(id), null, { pt_xac_nhan: updated.pt_xac_nhan, hv_xac_nhan: updated.hv_xac_nhan }, `Ghi nhận xác nhận từ ${vai_tro}`);
  try { getIO().emit('pt_schedule_changed', { action: 'confirm_partial', id }); } catch (_) {}
  return success(res, { bothConfirmed: false, pt_xac_nhan: updated.pt_xac_nhan, hv_xac_nhan: updated.hv_xac_nhan }, 'Đã ghi nhận xác nhận của bạn. Đang chờ bên còn lại xác nhận.');
};

export const getScheduleRating = (req, res) => {
  const { id } = req.params;
  const schedule = db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);

  const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ người dùng.', 404);

  if (req.user.vai_tro === 'hoi_vien' && schedule.hoi_vien_id !== hoSo.id) {
    return error(res, 'Bạn chỉ có thể xem đánh giá buổi tập của chính mình.', 403);
  }
  if (req.user.vai_tro === 'pt' && schedule.pt_id !== hoSo.id) {
    return error(res, 'Bạn chỉ có thể xem đánh giá buổi tập do mình phụ trách.', 403);
  }

  const rating = db.prepare(`SELECT * FROM danh_gia_pt WHERE lich_tap_id = ?`).get(id);
  if (!rating) return success(res, null);

  rating.tag_json = safeJson(rating.tag_json);
  rating.tieu_chi_json = safeJson(rating.tieu_chi_json, {});
  return success(res, rating);
};

export const upsertScheduleRating = (req, res) => {
  const { id } = req.params;
  const { so_sao, tieu_chi = {}, tags = [], noi_dung = '' } = req.body;
  const stars = Number(so_sao);

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return error(res, 'Số sao phải nằm trong khoảng 1-5.', 400);
  }

  const schedule = db.prepare(`
    SELECT lt.*, hv.ho_ten AS ten_hoi_vien, pt.ho_ten AS ten_pt
    FROM lich_tap lt
    JOIN ho_so hv ON hv.id = lt.hoi_vien_id
    JOIN ho_so pt ON pt.id = lt.pt_id
    WHERE lt.id = ?
  `).get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);
  if (schedule.trang_thai !== 'da_tap') return error(res, 'Chỉ đánh giá được buổi tập đã hoàn thành.', 400);

  const hoSo = db.prepare('SELECT id, ho_ten FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
  if (!hoSo || hoSo.id !== schedule.hoi_vien_id) {
    return error(res, 'Chỉ hội viên của buổi tập này mới được gửi đánh giá.', 403);
  }

  const old = db.prepare('SELECT * FROM danh_gia_pt WHERE lich_tap_id = ? AND hoi_vien_id = ?').get(id, hoSo.id);
  if (old) {
    db.prepare(`
      UPDATE danh_gia_pt SET
        so_sao = ?, tieu_chi_json = ?, tag_json = ?, noi_dung = ?,
        nguoi_cap_nhat_id = ?, ngay_cap_nhat = datetime('now','localtime')
      WHERE id = ?
    `).run(stars, toJson(tieu_chi), toJson(tags), noi_dung || null, req.user.id, old.id);
  } else {
    db.prepare(`
      INSERT INTO danh_gia_pt
        (lich_tap_id, pt_id, hoi_vien_id, so_sao, tieu_chi_json, tag_json, noi_dung, nguoi_tao_id, nguoi_cap_nhat_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, schedule.pt_id, schedule.hoi_vien_id, stars, toJson(tieu_chi), toJson(tags), noi_dung || null, req.user.id, req.user.id);
  }

  createUserNotification(
    schedule.pt_id,
    old ? 'Hội viên đã cập nhật đánh giá PT' : 'Hội viên vừa đánh giá buổi tập',
    `${schedule.ten_hoi_vien} đánh giá ${stars}/5 sao cho buổi tập ngày ${schedule.ngay_tap}.`,
    'thong_bao_chung'
  );

  if (stars < 3) {
    createNotification(
      'cap_nhat_buoi_tap',
      'Đánh giá PT cần xử lý',
      `${schedule.ten_hoi_vien} đánh giá ${stars}/5 sao cho PT ${schedule.ten_pt}. Nội dung: ${noi_dung || 'Chưa nhập lý do'}`,
      parseInt(id),
      'lich_tap',
      'admin'
    );
  }

  ghi_audit_log(req, old ? 'UPDATE' : 'CREATE', 'danh_gia_pt', parseInt(id), old || null, { so_sao: stars, tags, tieu_chi }, old ? 'Cập nhật đánh giá PT' : 'Tạo đánh giá PT');

  const saved = db.prepare('SELECT * FROM danh_gia_pt WHERE lich_tap_id = ? AND hoi_vien_id = ?').get(id, hoSo.id);
  saved.tag_json = safeJson(saved.tag_json);
  saved.tieu_chi_json = safeJson(saved.tieu_chi_json, {});
  return success(res, saved, old ? 'Đã cập nhật đánh giá' : 'Đã gửi đánh giá', old ? 200 : 201);
};

// ── PUT /api/pt/schedules/:id/cancel ─────────────────────
// Hủy buổi tập
export const cancelSchedule = (req, res) => {
  const { id } = req.params;
  const { ly_do } = req.body;
  const schedule = db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);

  const actorBranch = getActorBranch(req.user);
  if (actorBranch && schedule.chi_nhanh_tap !== actorBranch) {
    return error(res, 'Bạn không có quyền hủy buổi tập thuộc chi nhánh khác.', 403);
  }

  if (schedule.trang_thai === 'da_tap') return error(res, 'Không thể hủy buổi đã tập.', 400);
  if (schedule.trang_thai === 'da_huy') return error(res, 'Buổi tập đã bị hủy rồi.', 400);

  // Quy tắc 24h: Không được hủy trước < 24h (trừ Admin)
  if (req.user.vai_tro === 'pt' || req.user.vai_tro === 'hoi_vien') {
    const sessionDateTime = new Date(`${schedule.ngay_tap}T${schedule.gio_bat_dau}:00+07:00`);
    const hoursUntilSession = (sessionDateTime - new Date()) / (1000 * 60 * 60);
    if (hoursUntilSession < 24) {
      return error(res, 'Chỉ được hủy buổi tập trước ít nhất 24 giờ. Vui lòng liên hệ Admin để được hỗ trợ.', 400);
    }
  }

  // PT chỉ hủy lịch của chính mình
  if (req.user.vai_tro === 'pt') {
    const hoSoPt = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (!hoSoPt || schedule.pt_id !== hoSoPt.id) {
      return error(res, 'Bạn chỉ có thể hủy lịch tập do chính mình phụ trách.', 403);
    }
  }

  db.prepare(`
    UPDATE lich_tap SET trang_thai = 'da_huy', ly_do_huy = ?, nguoi_huy_id = ? WHERE id = ?
  `).run(ly_do || 'Không có lý do', req.user.id, id);

  // Sinh thông báo hủy buổi tập cho ca hai
  const schedInfo = db.prepare(`
    SELECT lt.gio_bat_dau, lt.ngay_tap,
           hv.ho_ten AS ho_ten_hoi_vien,
           pt.ho_ten AS ho_ten_pt
    FROM lich_tap lt
    JOIN ho_so hv ON hv.id = lt.hoi_vien_id
    JOIN ho_so pt ON pt.id = lt.pt_id
    WHERE lt.id = ?
  `).get(id);
  if (schedInfo) {
    createNotification(
      'huy_buoi_tap',
      'Buổi tập bị hủy',
      `Buổi ${schedInfo.gio_bat_dau} ngày ${schedInfo.ngay_tap} của ${schedInfo.ho_ten_hoi_vien} với PT ${schedInfo.ho_ten_pt} đã bị hủy`,
      parseInt(id),
      'lich_tap',
      'ca_hai'
    );

    // Tạo thông báo inbox cá nhân
    createUserNotification(
      schedule.hoi_vien_id,
      'Buổi tập bị hủy ❌',
      `Buổi tập lúc ${schedInfo.gio_bat_dau} ngày ${schedInfo.ngay_tap} với HLV ${schedInfo.ho_ten_pt} đã bị hủy. Lý do: ${ly_do || 'Không có lý do'}.`,
      'nhac_nho_gia_han'
    );
    createUserNotification(
      schedule.pt_id,
      'Buổi tập bị hủy ❌',
      `Buổi dạy lúc ${schedInfo.gio_bat_dau} ngày ${schedInfo.ngay_tap} với học viên ${schedInfo.ho_ten_hoi_vien} đã bị hủy. Lý do: ${ly_do || 'Không có lý do'}.`,
      'nhac_nho_gia_han'
    );
  }

  ghi_audit_log(req, 'UPDATE', 'lich_tap', parseInt(id), { trang_thai: schedule.trang_thai }, { trang_thai: 'da_huy', ly_do }, 'Hủy buổi tập');
  try { getIO().emit('pt_schedule_changed', { action: 'cancel', id }); } catch (_) {}
  return success(res, null, 'Đã hủy buổi tập');
};

// ── PATCH /api/pt/schedules/:id/hoan-tac ─────────────────
// Hoàn tác xác nhận buổi tập (chỉ áp dụng cho buổi do cron tự xác nhận)
export const revertSchedule = (req, res) => {
  const { id } = req.params;
  const { ly_do } = req.body;

  const schedule = db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);

  const actorBranch = getActorBranch(req.user);
  if (actorBranch && schedule.chi_nhanh_tap !== actorBranch) {
    return error(res, 'Bạn không có quyền hoàn tác buổi tập thuộc chi nhánh khác.', 403);
  }

  if (schedule.trang_thai !== 'da_tap') return error(res, 'Chỉ hoàn tác được buổi ở trạng thái "da_tap".', 400);

  // Chỉ cho hoàn tác buổi do cron tự xác nhận (confirmed_by_id NULL + ghi_chu = 'auto_cron')
  if (schedule.confirmed_by_id !== null || schedule.ghi_chu !== 'auto_cron') {
    return error(res, 'Chỉ có thể hoàn tác buổi do hệ thống tự xác nhận (cron job). Buổi do lễ tân xác nhận không thể hoàn tác tại đây.', 403);
  }

  // Chỉ hoàn tác trong vòng 1 ngày (tránh sửa dữ liệu cũ)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const ngayTapDate = new Date(schedule.ngay_tap);
  if (ngayTapDate < yesterday) {
    return error(res, 'Chỉ có thể hoàn tác buổi tập trong vòng 1 ngày.', 400);
  }

  // Dùng transaction để đảm bảo tính nhất quán
  const revert = db.transaction(() => {
    // Lấy dang_ky_pt để trừ lại so_buoi_da_tap
    const dkpt = db.prepare('SELECT * FROM dang_ky_pt WHERE id = ?').get(schedule.dang_ky_pt_id);

    // Đặt lại trạng thái buổi tập
    db.prepare(`
      UPDATE lich_tap SET
        trang_thai = 'cho_tap', confirmed_by_id = NULL,
        ngay_xac_nhan = NULL, da_checkin = 0,
        pt_xac_nhan = 0, hv_xac_nhan = 0,
        ghi_chu = ?
      WHERE id = ?
    `).run(ly_do ? `Hoàn tác: ${ly_do}` : 'Hoàn tác bởi admin', id);

    // Giảm so_buoi_da_tap trong dang_ky_pt (trigger đã tăng lúc confirm)
    if (dkpt && dkpt.so_buoi_da_tap > 0) {
      db.prepare(`UPDATE dang_ky_pt SET so_buoi_da_tap = so_buoi_da_tap - 1 WHERE id = ?`).run(schedule.dang_ky_pt_id);
    }
  });

  revert();
  ghi_audit_log(req, 'UPDATE', 'lich_tap', parseInt(id),
    { trang_thai: 'da_tap' }, { trang_thai: 'cho_tap' }, `Hoàn tác xác nhận buổi tập: ${ly_do || ''}`);

  // Sinh thông báo hoàn tác buổi tập cho admin
  const tenDangNhap = db.prepare('SELECT ten_dang_nhap FROM tai_khoan WHERE id = ?').get(req.user.id)?.ten_dang_nhap || `ID ${req.user.id}`;
  const hoantacInfo = db.prepare(`
    SELECT lt.ngay_tap, hv.ho_ten AS ho_ten_hoi_vien
    FROM lich_tap lt JOIN ho_so hv ON hv.id = lt.hoi_vien_id WHERE lt.id = ?
  `).get(id);
  if (hoantacInfo) {
    createNotification(
      'hoan_tac_buoi_tap',
      'Hoàn tác buổi tập',
      `${tenDangNhap} vừa hoàn tác buổi tập ${hoantacInfo.ngay_tap} của ${hoantacInfo.ho_ten_hoi_vien} — Lý do: ${ly_do || 'Không rõ'}`,
      parseInt(id),
      'lich_tap',
      'admin'
    );
  }

  try { getIO().emit('pt_schedule_changed', { action: 'revert', id }); } catch (_) {}
  return success(res, null, 'Hoàn tác buổi tập thành công');
};

// ── PUT /api/pt/schedules/:id ─────────────────────────────
// Cập nhật lịch (đổi ngày/giờ — chỉ cho buổi chưa tập)
export const updateSchedule = (req, res) => {
  const { id } = req.params;
  const { ngay_tap, gio_bat_dau, gio_ket_thuc, ghi_chu } = req.body;
  const schedule = db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);

  const actorBranch = getActorBranch(req.user);
  if (actorBranch && schedule.chi_nhanh_tap !== actorBranch) {
    return error(res, 'Bạn không có quyền sửa lịch tập thuộc chi nhánh khác.', 403);
  }

  if (schedule.trang_thai !== 'cho_tap') return error(res, 'Chỉ có thể sửa lịch đang ở trạng thái "cho_tap".', 400);

  // Chặn dời lịch sang ngày trong quá khứ hoặc giờ đã qua hôm nay
  const effectiveDate = ngay_tap || schedule.ngay_tap;
  const effectiveStart = gio_bat_dau || schedule.gio_bat_dau;
  if (ngay_tap || gio_bat_dau) {
    const todayStr = getTodayStrHoChiMinh();
    if (effectiveDate < todayStr) {
      return error(res, 'Không thể dời lịch tập sang ngày trong quá khứ.', 400);
    }
    if (effectiveDate === todayStr) {
      const nowTime = getNowTimeStrHoChiMinh();
      if (effectiveStart <= nowTime) {
        return error(res, 'Không thể dời lịch tập sang giờ đã qua trong ngày hôm nay.', 400);
      }
    }
  }

  // PT chỉ sửa lịch của chính mình
  if (req.user.vai_tro === 'pt') {
    const hoSoPt = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (!hoSoPt || schedule.pt_id !== hoSoPt.id) {
      return error(res, 'Bạn chỉ có thể sửa lịch tập do chính mình phụ trách.', 403);
    }
  }

  // Kiểm tra trùng lịch sau khi dời (bỏ qua chính buổi đang sửa)
  const checkDate = ngay_tap || schedule.ngay_tap;
  const checkStart = gio_bat_dau || schedule.gio_bat_dau;
  const checkEnd = gio_ket_thuc || schedule.gio_ket_thuc;

  const ptConflict = db.prepare(`
    SELECT id FROM lich_tap
    WHERE pt_id = ? AND ngay_tap = ? AND id != ? AND trang_thai != 'da_huy'
      AND NOT (gio_ket_thuc <= ? OR gio_bat_dau >= ?)
  `).get(schedule.pt_id, checkDate, id, checkStart, checkEnd);
  if (ptConflict) return error(res, 'PT đã có lịch dạy khác trong khung giờ mới này.', 409);

  const memberConflict = db.prepare(`
    SELECT id FROM lich_tap
    WHERE hoi_vien_id = ? AND ngay_tap = ? AND id != ? AND trang_thai != 'da_huy'
      AND NOT (gio_ket_thuc <= ? OR gio_bat_dau >= ?)
  `).get(schedule.hoi_vien_id, checkDate, id, checkStart, checkEnd);
  if (memberConflict) return error(res, 'Hội viên đã có lịch tập khác trong khung giờ mới này.', 409);

  db.prepare(`
    UPDATE lich_tap SET
      ngay_tap = COALESCE(?, ngay_tap),
      gio_bat_dau = COALESCE(?, gio_bat_dau),
      gio_ket_thuc = COALESCE(?, gio_ket_thuc),
      ghi_chu = COALESCE(?, ghi_chu)
    WHERE id = ?
  `).run(ngay_tap || null, gio_bat_dau || null, gio_ket_thuc || null, ghi_chu || null, id);

  ghi_audit_log(req, 'UPDATE', 'lich_tap', parseInt(id), schedule, req.body, 'Cập nhật lịch tập');

  // Sinh thông báo realtime cho hội viên và PT khi giờ/ngày tập bị thay đổi
  const updated = db.prepare(`
    SELECT lt.ngay_tap, lt.gio_bat_dau, lt.gio_ket_thuc,
           hv.ho_ten AS ho_ten_hoi_vien,
           pt.ho_ten AS ho_ten_pt
    FROM lich_tap lt
    JOIN ho_so hv ON hv.id = lt.hoi_vien_id
    JOIN ho_so pt ON pt.id = lt.pt_id
    WHERE lt.id = ?
  `).get(id);

  if (updated) {
    const noiDung = `Buổi tập của ${updated.ho_ten_hoi_vien} với PT ${updated.ho_ten_pt} đã được dời sang ${updated.ngay_tap} lúc ${updated.gio_bat_dau}–${updated.gio_ket_thuc}`;
    createNotification(
      'cap_nhat_buoi_tap',
      'Lịch tập đã thay đổi',
      noiDung,
      parseInt(id),
      'lich_tap',
      'ca_hai'
    );

    // Tạo thông báo inbox cá nhân
    createUserNotification(
      schedule.hoi_vien_id,
      'Lịch tập thay đổi 📅',
      `Lịch tập với HLV ${updated.ho_ten_pt} đã dời sang ngày ${updated.ngay_tap} lúc ${updated.gio_bat_dau}–${updated.gio_ket_thuc}.`,
      'thong_bao_chung'
    );
    createUserNotification(
      schedule.pt_id,
      'Lịch tập thay đổi 📅',
      `Lịch dạy với học viên ${updated.ho_ten_hoi_vien} đã dời sang ngày ${updated.ngay_tap} lúc ${updated.gio_bat_dau}–${updated.gio_ket_thuc}.`,
      'thong_bao_chung'
    );
  }

  try { getIO().emit('pt_schedule_changed', { action: 'update', id }); } catch (_) {}
  return success(res, db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id), 'Cập nhật lịch thành công');
};

// ── PATCH /api/pt/schedules/:id/note ─────────────────────
// Cập nhật ghi chú buổi tập — cho phép cả hội viên lẫn PT
export const updateNote = (req, res) => {
  const { id } = req.params;
  const { ghi_chu } = req.body;
  if (ghi_chu === undefined) return error(res, 'Thiếu trường ghi_chu.', 400);

  const schedule = db.prepare(`
    SELECT lt.id, lt.hoi_vien_id, lt.pt_id, lt.trang_thai
    FROM lich_tap lt WHERE lt.id = ?
  `).get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);

  // Chỉ hội viên chủ sở hữu hoặc PT phụ trách mới được ghi chú
  const u = req.user;
  const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(u.id);
  const hoSoId = hoSo ? hoSo.id : null;

  const isOwner = u.vai_tro === 'hoi_vien' && hoSoId === schedule.hoi_vien_id;
  const isPT    = u.vai_tro === 'pt'        && hoSoId === schedule.pt_id;
  const isStaff = u.vai_tro === 'admin'     || u.vai_tro === 'nhan_vien';
  if (!isOwner && !isPT && !isStaff) return error(res, 'Không có quyền cập nhật ghi chú.', 403);

  db.prepare(`UPDATE lich_tap SET ghi_chu = ? WHERE id = ?`).run(ghi_chu || null, id);

  return success(res, { id: parseInt(id), ghi_chu: ghi_chu || null }, 'Đã lưu ghi chú');
};

// ── GET /api/pt/my-members ────────────────────────────────
// PT xem danh sách học viên của mình (có đăng ký PT đang HĐ)
export const getMyMembers = (req, res) => {
  const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ PT.', 404);

  const rows = db.prepare(`
    SELECT
      dp.id AS dang_ky_id,
      dp.tu_ngay, dp.den_ngay, dp.so_buoi_dang_ky, dp.so_buoi_da_tap,
      dp.so_buoi_dang_ky - dp.so_buoi_da_tap AS buoi_con_lai,
      dp.trang_thai AS trang_thai_dk,
      hv.id AS hoi_vien_id, hv.ma_ho_so, hv.ho_ten, hv.so_dien_thoai,
      hv.gioi_tinh, hv.avatar_url,
      gpt.ten_goi AS ten_goi_pt,
      (SELECT lt.ngay_tap FROM lich_tap lt
       WHERE lt.dang_ky_pt_id = dp.id AND lt.trang_thai = 'cho_tap'
       ORDER BY lt.ngay_tap ASC LIMIT 1) AS buoi_tap_sap_toi
    FROM dang_ky_pt dp
    JOIN ho_so hv ON hv.id = dp.hoi_vien_id
    LEFT JOIN goi_pt gpt ON gpt.id = dp.goi_pt_id
    WHERE dp.pt_id = ? AND dp.trang_thai = 'dang_hoat_dong' AND hv.is_deleted = 0
      AND dp.id = (
        SELECT dp2.id FROM dang_ky_pt dp2
        WHERE dp2.hoi_vien_id = dp.hoi_vien_id AND dp2.pt_id = dp.pt_id
          AND dp2.trang_thai = 'dang_hoat_dong'
        ORDER BY dp2.id DESC LIMIT 1
      )
    ORDER BY hv.ho_ten ASC
  `).all(hoSo.id);

  return success(res, rows);
};
