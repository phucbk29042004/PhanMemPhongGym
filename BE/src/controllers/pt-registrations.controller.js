/**
 * PT Registrations Controller — Quản lý đăng ký gói PT
 * Base route: /api/pt/registrations
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { ghi_audit_log } from '../utils/audit.js';
import { createNotification } from '../utils/notifications.js';

// ── GET /api/pt/registrations ─────────────────────────────
// Danh sách đăng ký PT (admin/lễ tân xem tất cả, PT xem lịch của mình)
export const getRegistrations = (req, res) => {
  const { hoi_vien_id, pt_id, trang_thai, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE 1=1';
  const params = [];

  // PT chỉ xem đăng ký của mình
  if (req.user.vai_tro === 'pt') {
    const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (hoSo) { where += ' AND dp.pt_id = ?'; params.push(hoSo.id); }
  } else {
    if (pt_id) { where += ' AND dp.pt_id = ?'; params.push(pt_id); }
  }

  if (hoi_vien_id) { where += ' AND dp.hoi_vien_id = ?'; params.push(hoi_vien_id); }
  if (trang_thai)  { where += ' AND dp.trang_thai = ?'; params.push(trang_thai); }

  const rows = db.prepare(`
    SELECT
      dp.id, dp.so_buoi_dang_ky, dp.so_buoi_da_tap, dp.tu_ngay, dp.den_ngay,
      dp.gia_thuc_te, dp.trang_thai, dp.ghi_chu_tt, dp.ngay_tao,
      hv.id AS hoi_vien_id, hv.ho_ten AS ten_hoi_vien, hv.avatar_url AS avatar_hoi_vien,
      hv.so_dien_thoai AS sdt_hoi_vien,
      pt.id AS pt_id, pt.ho_ten AS ten_pt, pt.avatar_url AS avatar_pt,
      pt.chuyen_mon,
      gp.ten_goi AS ten_goi_pt, gp.so_buoi
    FROM dang_ky_pt dp
    JOIN ho_so hv ON hv.id = dp.hoi_vien_id
    JOIN ho_so pt ON pt.id = dp.pt_id
    LEFT JOIN goi_tap gp ON gp.id = dp.goi_pt_id
    ${where}
    ORDER BY dp.ngay_tao DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM dang_ky_pt dp
    ${where}
  `).get(...params).cnt;

  return success(res, {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
};

// ── GET /api/pt/registrations/:id ────────────────────────
export const getRegistrationById = (req, res) => {
  const { id } = req.params;

  const reg = db.prepare(`
    SELECT
      dp.*,
      hv.ho_ten AS ten_hoi_vien, hv.avatar_url AS avatar_hoi_vien,
      hv.so_dien_thoai AS sdt_hoi_vien, hv.email AS email_hoi_vien,
      pt.ho_ten AS ten_pt, pt.avatar_url AS avatar_pt, pt.chuyen_mon,
      gp.ten_goi AS ten_goi_pt, gp.so_buoi
    FROM dang_ky_pt dp
    JOIN ho_so hv ON hv.id = dp.hoi_vien_id
    JOIN ho_so pt ON pt.id = dp.pt_id
    LEFT JOIN goi_tap gp ON gp.id = dp.goi_pt_id
    WHERE dp.id = ?
  `).get(id);

  if (!reg) return error(res, 'Không tìm thấy đăng ký PT.', 404);

  // Lấy danh sách buổi tập đã đặt
  reg.lich_tap = db.prepare(`
    SELECT lt.id, lt.ngay_tap, lt.gio_bat_dau, lt.gio_ket_thuc, lt.trang_thai, lt.ghi_chu
    FROM lich_tap lt
    WHERE lt.dang_ky_pt_id = ?
    ORDER BY lt.ngay_tap ASC, lt.gio_bat_dau ASC
  `).all(id);

  return success(res, reg);
};

// ── POST /api/pt/registrations ────────────────────────────
// Đăng ký gói PT cho hội viên
export const createRegistration = (req, res) => {
  const {
    hoi_vien_id, pt_id, goi_pt_id,
    so_buoi_dang_ky, tu_ngay, den_ngay,
    gia_thuc_te, phuong_thuc_tt = 'tien_mat',
    ma_giao_dich, ghi_chu_tt,
  } = req.body;

  if (!hoi_vien_id || !pt_id || !goi_pt_id || !tu_ngay || gia_thuc_te === undefined) {
    return error(res, 'Thiếu: hoi_vien_id, pt_id, goi_pt_id, tu_ngay, gia_thuc_te', 400);
  }

  const validTT = ['tien_mat','chuyen_khoan','the','momo','zalopay','khac'];
  if (!validTT.includes(phuong_thuc_tt)) {
    return error(res, `phuong_thuc_tt phải là: ${validTT.join(', ')}`, 400);
  }

  // Kiểm tra hội viên tồn tại
  const hv = db.prepare("SELECT id FROM ho_so WHERE id = ? AND loai_ho_so = 'hoi_vien' AND is_deleted = 0").get(hoi_vien_id);
  if (!hv) return error(res, 'Không tìm thấy hội viên.', 404);

  // Kiểm tra PT tồn tại
  const pt = db.prepare("SELECT id FROM ho_so WHERE id = ? AND loai_ho_so = 'pt' AND is_deleted = 0").get(pt_id);
  if (!pt) return error(res, 'Không tìm thấy PT.', 404);

  // Kiểm tra gói PT tồn tại
  const goiPt = db.prepare('SELECT * FROM goi_pt WHERE id = ?').get(goi_pt_id);
  if (!goiPt) return error(res, 'Không tìm thấy gói PT.', 404);

  // Tự điền so_buoi_dang_ky từ gói nếu không truyền
  const soBuoi = so_buoi_dang_ky ? parseInt(so_buoi_dang_ky) : (goiPt.so_buoi || null);

  const result = db.prepare(`
    INSERT INTO dang_ky_pt
      (hoi_vien_id, pt_id, goi_pt_id, so_buoi_dang_ky, so_buoi_da_tap,
       tu_ngay, den_ngay, gia_thuc_te, phuong_thuc_tt, ma_giao_dich, ghi_chu_tt, nguoi_tao_id)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    hoi_vien_id, pt_id, goi_pt_id,
    soBuoi, tu_ngay, den_ngay || null,
    parseFloat(gia_thuc_te), phuong_thuc_tt,
    ma_giao_dich || null, ghi_chu_tt || null, req.user.id,
  );

  ghi_audit_log(req, 'CREATE', 'dang_ky_pt', result.lastInsertRowid, null,
    { hoi_vien_id, pt_id, so_buoi_dang_ky }, 'Đăng ký gói PT');

  // Sinh thông báo đăng ký gói PT mới cho admin
  const hvInfo = db.prepare('SELECT ho_ten FROM ho_so WHERE id = ?').get(hoi_vien_id);
  const ptInfo = db.prepare('SELECT ho_ten FROM ho_so WHERE id = ?').get(pt_id);
  createNotification(
    'dang_ky_goi_pt_moi',
    'Đăng ký gói PT mới',
    `${hvInfo?.ho_ten || `HV-${hoi_vien_id}`} vừa đăng ký ${goiPt.ten_goi} với PT ${ptInfo?.ho_ten || `PT-${pt_id}`} — ${Number(gia_thuc_te).toLocaleString('vi-VN')}đ`,
    result.lastInsertRowid,
    'dang_ky_pt',
    'admin'
  );

  return success(res, db.prepare('SELECT * FROM dang_ky_pt WHERE id = ?').get(result.lastInsertRowid),
    'Đăng ký PT thành công', 201);
};

// ── PUT /api/pt/registrations/:id ────────────────────────
// Cập nhật đăng ký (đổi PT, buổi, ngày)
export const updateRegistration = (req, res) => {
  const { id } = req.params;
  const old = db.prepare('SELECT * FROM dang_ky_pt WHERE id = ?').get(id);
  if (!old) return error(res, 'Không tìm thấy đăng ký PT.', 404);
  if (old.trang_thai === 'da_huy') return error(res, 'Không thể sửa đăng ký đã hủy.', 400);

  const { pt_id, goi_pt_id, so_buoi_dang_ky, tu_ngay, den_ngay, gia_thuc_te, ghi_chu } = req.body;

  // Nếu đổi PT, kiểm tra PT mới tồn tại
  if (pt_id && pt_id !== old.pt_id) {
    const pt = db.prepare("SELECT id FROM ho_so WHERE id = ? AND loai_ho_so = 'pt' AND is_deleted = 0").get(pt_id);
    if (!pt) return error(res, 'Không tìm thấy PT mới.', 404);
  }

  db.prepare(`
    UPDATE dang_ky_pt SET
      pt_id          = COALESCE(?, pt_id),
      goi_pt_id      = COALESCE(?, goi_pt_id),
      so_buoi_dang_ky= COALESCE(?, so_buoi_dang_ky),
      tu_ngay        = COALESCE(?, tu_ngay),
      den_ngay       = COALESCE(?, den_ngay),
      gia_thuc_te    = COALESCE(?, gia_thuc_te),
      ghi_chu        = COALESCE(?, ghi_chu)
    WHERE id = ?
  `).run(
    pt_id || null, goi_pt_id || null, so_buoi_dang_ky ? parseInt(so_buoi_dang_ky) : null,
    tu_ngay || null, den_ngay || null, gia_thuc_te !== undefined ? parseFloat(gia_thuc_te) : null,
    ghi_chu || null, id,
  );

  const updated = db.prepare('SELECT * FROM dang_ky_pt WHERE id = ?').get(id);
  ghi_audit_log(req, 'UPDATE', 'dang_ky_pt', parseInt(id), old, updated, 'Cập nhật đăng ký PT');
  return success(res, updated, 'Cập nhật đăng ký PT thành công');
};

// ── PUT /api/pt/registrations/:id/cancel ─────────────────
// Hủy đăng ký PT
export const cancelRegistration = (req, res) => {
  const { id } = req.params;
  const { ly_do } = req.body;

  const reg = db.prepare('SELECT * FROM dang_ky_pt WHERE id = ?').get(id);
  if (!reg) return error(res, 'Không tìm thấy đăng ký PT.', 404);
  if (reg.trang_thai === 'da_huy') return error(res, 'Đăng ký đã bị hủy rồi.', 400);

  db.prepare(`
    UPDATE dang_ky_pt SET trang_thai = 'da_huy', ghi_chu_tt = COALESCE(?, ghi_chu_tt) WHERE id = ?
  `).run(ly_do ? `[HỦY] ${ly_do}` : null, id);

  // Hủy luôn tất cả buổi tập chưa tập
  db.prepare(`
    UPDATE lich_tap SET trang_thai = 'da_huy', ly_do_huy = 'Hủy đăng ký PT'
    WHERE dang_ky_pt_id = ? AND trang_thai = 'cho_tap'
  `).run(id);

  ghi_audit_log(req, 'UPDATE', 'dang_ky_pt', parseInt(id), { trang_thai: reg.trang_thai },
    { trang_thai: 'da_huy', ly_do }, 'Hủy đăng ký PT');
  return success(res, null, 'Đã hủy đăng ký PT');
};
