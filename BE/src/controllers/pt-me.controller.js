import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { createUserNotification } from '../utils/notifications.js';
import { ghi_audit_log } from '../utils/audit.js';

const getCurrentProfile = (userId) => db.prepare(`
  SELECT id, ho_ten, loai_ho_so FROM ho_so
  WHERE tai_khoan_id = ? AND is_deleted = 0
`).get(userId);

const getActivePairForMember = (memberId) => db.prepare(`
  SELECT dp.hoi_vien_id, dp.pt_id, hv.ho_ten AS ten_hoi_vien, pt.ho_ten AS ten_pt
  FROM dang_ky_pt dp
  JOIN ho_so hv ON hv.id = dp.hoi_vien_id
  JOIN ho_so pt ON pt.id = dp.pt_id
  WHERE dp.hoi_vien_id = ? AND dp.trang_thai = 'dang_hoat_dong'
  ORDER BY dp.ngay_tao DESC
  LIMIT 1
`).get(memberId);

const getActivePairForPt = (ptId, memberId) => db.prepare(`
  SELECT dp.hoi_vien_id, dp.pt_id, hv.ho_ten AS ten_hoi_vien, pt.ho_ten AS ten_pt
  FROM dang_ky_pt dp
  JOIN ho_so hv ON hv.id = dp.hoi_vien_id
  JOIN ho_so pt ON pt.id = dp.pt_id
  WHERE dp.pt_id = ? AND dp.hoi_vien_id = ? AND dp.trang_thai = 'dang_hoat_dong'
  ORDER BY dp.ngay_tao DESC
  LIMIT 1
`).get(ptId, memberId);

const resolvePair = (req, memberIdFromRequest) => {
  const me = getCurrentProfile(req.user.id);
  if (!me) return { errorMessage: 'Không tìm thấy hồ sơ người dùng.', status: 404 };

  if (me.loai_ho_so === 'hoi_vien') {
    const pair = getActivePairForMember(me.id);
    if (!pair) return { me, pair: null };
    return { me, pair };
  }

  if (me.loai_ho_so === 'pt') {
    const memberId = Number(memberIdFromRequest);
    if (!memberId) return { errorMessage: 'PT cần chọn hội viên để xem luồng PT & Tôi.', status: 400 };
    const pair = getActivePairForPt(me.id, memberId);
    if (!pair) return { errorMessage: 'Hội viên này không thuộc danh sách đang phụ trách của bạn.', status: 403 };
    return { me, pair };
  }

  return { errorMessage: 'Chức năng PT & Tôi chỉ dành cho hội viên và PT.', status: 403 };
};

export const getPTMeThread = (req, res) => {
  const resolved = resolvePair(req, req.query.hoi_vien_id);
  if (resolved.errorMessage) return error(res, resolved.errorMessage, resolved.status);
  if (!resolved.pair) return success(res, { pair: null, entries: [] });

  const { pair } = resolved;
  const entries = db.prepare(`
    SELECT nk.*, hs.ho_ten AS ten_nguoi_gui, hs.avatar_url AS avatar_nguoi_gui
    FROM pt_toi_nhat_ky nk
    JOIN ho_so hs ON hs.id = nk.nguoi_gui_id
    WHERE nk.hoi_vien_id = ? AND nk.pt_id = ?
    ORDER BY nk.ngay_tao DESC, nk.id DESC
    LIMIT 100
  `).all(pair.hoi_vien_id, pair.pt_id);

  return success(res, { pair, entries });
};

export const getPTMeOverview = (req, res) => {
  const me = getCurrentProfile(req.user.id);
  if (!me) return error(res, 'Không tìm thấy hồ sơ người dùng.', 404);

  if (me.loai_ho_so === 'hoi_vien') {
    const pair = getActivePairForMember(me.id);
    if (!pair) return success(res, { pair: null, latest: [] });
    const latest = db.prepare(`
      SELECT nk.*, hs.ho_ten AS ten_nguoi_gui
      FROM pt_toi_nhat_ky nk
      JOIN ho_so hs ON hs.id = nk.nguoi_gui_id
      WHERE nk.hoi_vien_id = ? AND nk.pt_id = ?
      ORDER BY nk.ngay_tao DESC, nk.id DESC
      LIMIT 3
    `).all(pair.hoi_vien_id, pair.pt_id);
    return success(res, { pair, latest });
  }

  if (me.loai_ho_so === 'pt') {
    const latest = db.prepare(`
      SELECT nk.*, hv.ho_ten AS ten_hoi_vien, hv.avatar_url AS avatar_hoi_vien,
             hs.ho_ten AS ten_nguoi_gui
      FROM pt_toi_nhat_ky nk
      JOIN ho_so hv ON hv.id = nk.hoi_vien_id
      JOIN ho_so hs ON hs.id = nk.nguoi_gui_id
      WHERE nk.pt_id = ?
      ORDER BY nk.ngay_tao DESC, nk.id DESC
      LIMIT 12
    `).all(me.id);
    return success(res, { latest });
  }

  return error(res, 'Chức năng PT & Tôi chỉ dành cho hội viên và PT.', 403);
};

export const createPTMeEntry = (req, res) => {
  const resolved = resolvePair(req, req.body.hoi_vien_id);
  if (resolved.errorMessage) return error(res, resolved.errorMessage, resolved.status);
  if (!resolved.pair) return error(res, 'Bạn chưa có PT đang hoạt động.', 400);

  const { me, pair } = resolved;
  const {
    cam_nhan_tap, khau_phan_an, so_phut_tap, noi_dung_tap, loi_dan, ghi_chu
  } = req.body;
  const minutes = so_phut_tap == null || so_phut_tap === '' ? null : Number(so_phut_tap);
  if (minutes !== null && (!Number.isInteger(minutes) || minutes < 0 || minutes > 600)) {
    return error(res, 'Số phút tập phải nằm trong khoảng 0-600.', 400);
  }

  const role = me.loai_ho_so === 'pt' ? 'pt' : 'hoi_vien';
  const loai = role === 'pt' ? 'pt_dan_do' : 'hoi_vien_cap_nhat';
  const result = db.prepare(`
    INSERT INTO pt_toi_nhat_ky
      (hoi_vien_id, pt_id, nguoi_gui_id, vai_tro_gui, loai_nhat_ky, cam_nhan_tap, khau_phan_an, so_phut_tap, noi_dung_tap, loi_dan, ghi_chu)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    pair.hoi_vien_id, pair.pt_id, me.id, role, loai,
    cam_nhan_tap || null, khau_phan_an || null, minutes,
    noi_dung_tap || null, loi_dan || null, ghi_chu || null
  );

  const targetId = role === 'pt' ? pair.hoi_vien_id : pair.pt_id;
  createUserNotification(
    targetId,
    role === 'pt' ? 'PT vừa gửi lời dặn mới' : 'Hội viên vừa cập nhật nhật ký',
    role === 'pt'
      ? `${pair.ten_pt} đã gửi lời dặn mới trong mục PT & Tôi.`
      : `${pair.ten_hoi_vien} vừa cập nhật tập luyện/ăn uống hôm nay.`,
    'chat_pt_me',
    { nguoi_gui_id: me.id }
  );

  ghi_audit_log(req, 'CREATE', 'pt_toi_nhat_ky', result.lastInsertRowid, null, req.body, 'Tạo cập nhật PT & Tôi');
  return success(res, { id: result.lastInsertRowid }, 'Đã gửi cập nhật PT & Tôi', 201);
};

export const updatePTMeEntry = (req, res) => {
  const { id } = req.params;
  const me = getCurrentProfile(req.user.id);
  if (!me) return error(res, 'Không tìm thấy hồ sơ người dùng.', 404);

  const old = db.prepare('SELECT * FROM pt_toi_nhat_ky WHERE id = ?').get(id);
  if (!old) return error(res, 'Không tìm thấy nội dung PT & Tôi.', 404);
  if (old.nguoi_gui_id !== me.id) return error(res, 'Bạn chỉ có thể sửa nội dung do chính mình gửi.', 403);

  const { cam_nhan_tap, khau_phan_an, so_phut_tap, noi_dung_tap, loi_dan, ghi_chu } = req.body;
  const minutes = so_phut_tap == null || so_phut_tap === '' ? null : Number(so_phut_tap);
  if (minutes !== null && (!Number.isInteger(minutes) || minutes < 0 || minutes > 600)) {
    return error(res, 'Số phút tập phải nằm trong khoảng 0-600.', 400);
  }

  db.prepare(`
    UPDATE pt_toi_nhat_ky SET
      cam_nhan_tap = ?, khau_phan_an = ?, so_phut_tap = ?, noi_dung_tap = ?,
      loi_dan = ?, ghi_chu = ?, da_chinh_sua = 1, ngay_cap_nhat = datetime('now','localtime')
    WHERE id = ?
  `).run(
    cam_nhan_tap || null, khau_phan_an || null, minutes,
    noi_dung_tap || null, loi_dan || null, ghi_chu || null, id
  );

  const targetId = old.vai_tro_gui === 'pt' ? old.hoi_vien_id : old.pt_id;
  createUserNotification(
    targetId,
    'Nội dung PT & Tôi vừa được chỉnh sửa',
    `${me.ho_ten} vừa chỉnh sửa một cập nhật trong mục PT & Tôi.`,
    'chat_pt_me',
    { nguoi_gui_id: me.id }
  );

  ghi_audit_log(req, 'UPDATE', 'pt_toi_nhat_ky', parseInt(id), old, req.body, 'Chỉnh sửa cập nhật PT & Tôi');
  return success(res, null, 'Đã cập nhật nội dung PT & Tôi');
};
