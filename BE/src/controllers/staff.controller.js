/**
 * Staff Controller — Quản lý nhân viên lễ tân / nội bộ
 * Base route: /api/staff
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';
import { ghi_audit_log } from '../utils/audit.js';
import bcrypt from 'bcryptjs';
import { getActorBranch } from '../utils/branch.js';


// ── GET /api/staff ────────────────────────────────────────
export const getStaff = (req, res) => {
  const { search, vai_tro, chi_nhanh, gioi_tinh, trang_thai, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let filterBranch = chi_nhanh;
  if (req.user.vai_tro !== 'admin' && req.user.vai_tro !== 'chu_phong_gym') {
    const actor = db.prepare('SELECT chi_nhanh FROM ho_so WHERE tai_khoan_id = ? AND is_deleted = 0').get(req.user.id);
    filterBranch = actor?.chi_nhanh || 'KHONG_CO_CHI_NHANH';
  }

  let where = `WHERE h.loai_ho_so = 'nhan_vien' AND h.is_deleted = 0`;
  const params = [];

  if (filterBranch) {
    where += ' AND h.chi_nhanh = ?';
    params.push(filterBranch);
  }

  if (vai_tro) {
    where += ' AND vt.ma_vai_tro = ?';
    params.push(vai_tro);
  }
  if (gioi_tinh) {
    where += ' AND h.gioi_tinh = ?';
    params.push(gioi_tinh);
  }
  if (trang_thai) {
    if (trang_thai === 'khoa') {
      where += " AND tk.trang_thai = 'khoa'";
    } else if (trang_thai === 'hoat_dong') {
      where += " AND (tk.trang_thai IS NULL OR tk.trang_thai = 'hoat_dong')";
    }
  }
  if (search) {
    where += ` AND (h.ho_ten LIKE ? OR h.ma_ho_so LIKE ? OR h.so_dien_thoai LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const rows = db.prepare(`
    SELECT
      h.id, h.ma_ho_so, h.loai_ho_so, h.ho_ten, h.gioi_tinh, h.ngay_sinh,
      h.so_dien_thoai, h.email, h.avatar_url, h.chuc_vu, h.chi_nhanh, h.ngay_tao,
      tk.ten_dang_nhap, tk.trang_thai AS tk_trang_thai,
      vt.ma_vai_tro, vt.ten_hien_thi AS ten_vai_tro
    FROM ho_so h
    LEFT JOIN tai_khoan tk ON tk.id = h.tai_khoan_id
    LEFT JOIN vai_tro vt ON vt.id = tk.vai_tro_id
    ${where}
    ORDER BY h.ngay_tao DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) AS cnt FROM ho_so h LEFT JOIN tai_khoan tk ON tk.id = h.tai_khoan_id LEFT JOIN vai_tro vt ON vt.id = tk.vai_tro_id ${where}`).get(...params).cnt;

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

// ── GET /api/staff/:id ────────────────────────────────────
export const getStaffById = (req, res) => {
  const { id } = req.params;
  const staff = db.prepare(`
    SELECT h.*, tk.ten_dang_nhap, tk.trang_thai AS tk_trang_thai
    FROM ho_so h
    LEFT JOIN tai_khoan tk ON tk.id = h.tai_khoan_id
    WHERE h.id = ? AND h.loai_ho_so = 'nhan_vien' AND h.is_deleted = 0
  `).get(id);

  if (!staff) return error(res, 'Không tìm thấy nhân viên.', 404);

  const actorBranch = getActorBranch(req.user);
  if (actorBranch && staff.chi_nhanh !== actorBranch) {
    return error(res, 'Bạn không có quyền xem thông tin nhân viên thuộc chi nhánh khác.', 403);
  }

  delete staff.mat_khau_hash;
  return success(res, staff);
};

// ── POST /api/staff ───────────────────────────────────────
export const createStaff = async (req, res) => {
  const {
    ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, dia_chi_tam_tru,
    loai_ho_so = 'nhan_vien', chuc_vu, chi_nhanh, ghi_chu,
    ten_dang_nhap, mat_khau,
  } = req.body;

  if (!ho_ten) return error(res, 'Họ tên là bắt buộc.', 400);
  if (loai_ho_so !== 'nhan_vien') {
    return error(res, 'loai_ho_so phải là nhan_vien.', 400);
  }

  const actorBranch = getActorBranch(req.user);
  let finalBranch = chi_nhanh;
  if (actorBranch) {
    if (chi_nhanh && chi_nhanh !== actorBranch) {
      return error(res, `Bạn chỉ có thể tạo nhân viên thuộc chi nhánh của mình (${actorBranch}).`, 403);
    }
    finalBranch = actorBranch;
  } else {
    if (!chi_nhanh) {
      return error(res, 'Chi nhánh là bắt buộc đối với nhân viên.', 400);
    }
  }


  // Normalize gioi_tinh về chữ thường để khớp CHECK constraint DB
  const gioi_tinh_normalized = gioi_tinh ? gioi_tinh.toLowerCase() : null;

  let avatar_url = null;
  let cloudinary_public_id = null;
  if (req.file) {
    try {
      const result = await uploadImage(req.file.buffer, 'paradise-gym/staff');
      avatar_url = result.url;
      cloudinary_public_id = result.publicId;
    } catch (err) {
      return error(res, `Lỗi upload ảnh: ${err.message}`, 500);
    }
  }

  // Tạo mã nhân viên
  const prefix = 'NV';
  const last = db.prepare(`SELECT ma_ho_so FROM ho_so WHERE loai_ho_so = ? ORDER BY id DESC LIMIT 1`).get(loai_ho_so);
  let nextNum = '001';
  if (last?.ma_ho_so) {
    const m = last.ma_ho_so.match(/\d+/);
    if (m) nextNum = String(parseInt(m[0]) + 1).padStart(3, '0');
  }
  const ma_ho_so = `${prefix}${nextNum}`;

  // Tạo tài khoản nếu cung cấp thông tin đăng nhập
  let tai_khoan_id = null;
  if (ten_dang_nhap && mat_khau) {
    const exists = db.prepare('SELECT id FROM tai_khoan WHERE ten_dang_nhap = ?').get(ten_dang_nhap);
    if (exists) return error(res, 'Tên đăng nhập đã tồn tại.', 409);

    const vaiTro = db.prepare("SELECT id FROM vai_tro WHERE ma_vai_tro = ?").get('nhan_vien');
    const hash = bcrypt.hashSync(mat_khau, 12);
    const tkResult = db.prepare(`
      INSERT INTO tai_khoan (ten_dang_nhap, mat_khau_hash, vai_tro_id) VALUES (?, ?, ?)
    `).run(ten_dang_nhap, hash, vaiTro?.id || null);
    tai_khoan_id = tkResult.lastInsertRowid;
  }

  const result = db.prepare(`
    INSERT INTO ho_so (
      ma_ho_so, loai_ho_so, ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email,
      dia_chi_tam_tru, avatar_url, cloudinary_public_id, chuc_vu, chi_nhanh,
      ghi_chu, tai_khoan_id, nguoi_tao_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ma_ho_so, loai_ho_so, ho_ten,
    gioi_tinh_normalized,          // ← đã normalize
    ngay_sinh || null,
    so_dien_thoai || null, email || null, dia_chi_tam_tru || null,
    avatar_url, cloudinary_public_id, chuc_vu || null, finalBranch || null,
    ghi_chu || null, tai_khoan_id, req.user.id,
  );

  ghi_audit_log(req, 'CREATE', 'ho_so', result.lastInsertRowid, null,
    { ho_ten, loai_ho_so }, 'Thêm nhân viên mới');

  const newStaff = db.prepare('SELECT * FROM ho_so WHERE id = ?').get(result.lastInsertRowid);
  delete newStaff.mat_khau_hash;
  return success(res, newStaff, 'Thêm nhân viên thành công', 201);
};

// ── PUT /api/staff/:id ────────────────────────────────────
export const updateStaff = async (req, res) => {
  const { id } = req.params;
  const old = db.prepare(
    "SELECT * FROM ho_so WHERE id = ? AND loai_ho_so = 'nhan_vien' AND is_deleted = 0"
  ).get(id);
  if (!old) return error(res, 'Không tìm thấy nhân viên.', 404);

  const actorBranch = getActorBranch(req.user);
  if (actorBranch && old.chi_nhanh !== actorBranch) {
    return error(res, 'Bạn không có quyền chỉnh sửa nhân viên thuộc chi nhánh khác.', 403);
  }

  const {
    ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email,
    dia_chi_tam_tru, chuc_vu, chi_nhanh, ghi_chu, trang_thai,
    ten_dang_nhap, mat_khau,
  } = req.body;

  let finalBranch = chi_nhanh;
  if (actorBranch) {
    if (chi_nhanh && chi_nhanh !== actorBranch) {
      return error(res, `Bạn không có quyền chuyển nhân viên sang chi nhánh khác.`, 403);
    }
    finalBranch = actorBranch;
  }


  // Normalize gioi_tinh về chữ thường để khớp CHECK constraint DB
  const gioi_tinh_normalized = gioi_tinh ? gioi_tinh.toLowerCase() : null;

  // Upload ảnh mới nếu có file đính kèm
  let avatar_url = old.avatar_url;
  let cloudinary_public_id = old.cloudinary_public_id;

  if (req.file) {
    try {
      // Xóa ảnh cũ trên Cloudinary nếu có
      if (old.cloudinary_public_id) {
        await deleteImage(old.cloudinary_public_id);
      }
      const result = await uploadImage(req.file.buffer, 'paradise-gym/staff');
      avatar_url = result.url;
      cloudinary_public_id = result.publicId;
    } catch (err) {
      return error(res, `Lỗi upload ảnh: ${err.message}`, 500);
    }
  }

  // Xử lý tạo hoặc đổi tài khoản/mật khẩu
  let updated_tai_khoan_id = old.tai_khoan_id;
  try {
    if (ten_dang_nhap && mat_khau && !old.tai_khoan_id) {
      const exists = db.prepare('SELECT id FROM tai_khoan WHERE ten_dang_nhap = ?').get(ten_dang_nhap);
      if (exists) return error(res, 'Tên đăng nhập đã tồn tại.', 409);

      const vaiTro = db.prepare("SELECT id FROM vai_tro WHERE ma_vai_tro = ?").get('nhan_vien');
      const hash = bcrypt.hashSync(mat_khau, 12);
      const tkResult = db.prepare(`
        INSERT INTO tai_khoan (ten_dang_nhap, mat_khau_hash, vai_tro_id) VALUES (?, ?, ?)
      `).run(ten_dang_nhap, hash, vaiTro?.id || null);
      updated_tai_khoan_id = tkResult.lastInsertRowid;
    } else if (mat_khau && old.tai_khoan_id) {
      const hash = bcrypt.hashSync(mat_khau, 12);
      db.prepare(`UPDATE tai_khoan SET mat_khau_hash = ? WHERE id = ?`).run(hash, old.tai_khoan_id);
    }
  } catch (err) {
    return error(res, `Lỗi xử lý tài khoản: ${err.message}`, 500);
  }

  try {
    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE ho_so SET
          ho_ten               = COALESCE(?, ho_ten),
          gioi_tinh            = COALESCE(?, gioi_tinh),
          ngay_sinh            = COALESCE(?, ngay_sinh),
          so_dien_thoai        = COALESCE(?, so_dien_thoai),
          email                = COALESCE(?, email),
          dia_chi_tam_tru      = COALESCE(?, dia_chi_tam_tru),
          chuc_vu              = COALESCE(?, chuc_vu),
          chi_nhanh            = COALESCE(?, chi_nhanh),
          ghi_chu              = COALESCE(?, ghi_chu),
          avatar_url           = ?,
          cloudinary_public_id = ?,
          tai_khoan_id         = COALESCE(?, tai_khoan_id),
          nguoi_cap_nhat_id    = ?
        WHERE id = ?
      `).run(
        ho_ten || null,
        gioi_tinh_normalized,        // ← đã normalize
        ngay_sinh || null,
        so_dien_thoai || null,
        email || null,
        dia_chi_tam_tru || null,
        chuc_vu || null,
        finalBranch !== undefined ? finalBranch : null,
        ghi_chu || null,
        avatar_url,
        cloudinary_public_id,
        updated_tai_khoan_id,
        req.user.id,
        id,
      );

      if (trang_thai && updated_tai_khoan_id) {
        const tk_status = (
          trang_thai === 'hoat_dong' ||
          trang_thai === 'active' ||
          trang_thai === 'kich_hoat'
        ) ? 'hoat_dong' : 'khoa';
        db.prepare(`UPDATE tai_khoan SET trang_thai = ? WHERE id = ?`).run(tk_status, updated_tai_khoan_id);
      }
    });

    tx();
  } catch (err) {
    console.error('❌ Lỗi chi tiết tại updateStaff:', err);
    return error(res, `Lỗi cập nhật nhân viên: ${err.message}`, 500);
  }

  const updated = db.prepare('SELECT * FROM ho_so WHERE id = ?').get(id);
  ghi_audit_log(req, 'UPDATE', 'ho_so', parseInt(id), old, updated, 'Cập nhật thông tin nhân viên');
  delete updated.mat_khau_hash;
  return success(res, updated, 'Cập nhật nhân viên thành công');
};

// ── DELETE /api/staff/:id ─────────────────────────────────
export const deleteStaff = (req, res) => {
  const { id } = req.params;
  const { ly_do } = req.body;

  const staff = db.prepare(
    "SELECT * FROM ho_so WHERE id = ? AND loai_ho_so = 'nhan_vien' AND is_deleted = 0"
  ).get(id);
  if (!staff) return error(res, 'Không tìm thấy nhân viên.', 404);

  const actorBranch = getActorBranch(req.user);
  if (actorBranch && staff.chi_nhanh !== actorBranch) {
    return error(res, 'Bạn không có quyền xóa nhân viên thuộc chi nhánh khác.', 403);
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE ho_so SET
        is_deleted   = 1,
        ngay_xoa     = datetime('now','localtime'),
        nguoi_xoa_id = ?,
        ly_do_xoa    = ?
      WHERE id = ?
    `).run(req.user.id, ly_do || 'Không có lý do', id);

    if (staff.tai_khoan_id) {
      db.prepare("UPDATE tai_khoan SET trang_thai = 'khoa' WHERE id = ?").run(staff.tai_khoan_id);
    }
  });

  tx();

  ghi_audit_log(req, 'DELETE', 'ho_so', parseInt(id), staff, null, ly_do || 'Xóa hồ sơ nhân viên');
  return success(res, null, 'Đã xóa nhân viên (Soft Delete)');
};

// ── GET /api/staff/accounts (Lấy danh sách tài khoản) ────────────────────────
export const getAccounts = (req, res) => {
  const { search, vai_tro, trang_thai } = req.query;
  let where = 'WHERE tk.id IS NOT NULL';
  const params = [];

  if (vai_tro) {
    where += ' AND vt.ma_vai_tro = ?';
    params.push(vai_tro);
  }
  if (trang_thai) {
    where += ' AND tk.trang_thai = ?';
    params.push(trang_thai);
  }
  if (search) {
    where += ' AND (tk.ten_dang_nhap LIKE ? OR hs.ho_ten LIKE ? OR hs.ma_ho_so LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const rows = db.prepare(`
    SELECT 
      tk.id, tk.ten_dang_nhap, tk.trang_thai, tk.ngay_tao,
      vt.ma_vai_tro, vt.ten_hien_thi AS ten_vai_tro,
      hs.ho_ten, hs.ma_ho_so, hs.loai_ho_so, hs.id AS ho_so_id
    FROM tai_khoan tk
    LEFT JOIN vai_tro vt ON vt.id = tk.vai_tro_id
    LEFT JOIN ho_so hs ON hs.tai_khoan_id = tk.id AND hs.is_deleted = 0
    ${where}
    ORDER BY tk.ngay_tao DESC
  `).all(...params);

  return success(res, rows);
};

// ── PUT /api/staff/accounts/:id (Cập nhật tài khoản) ─────────────────────────
export const updateAccount = (req, res) => {
  const { id } = req.params;
  const { ten_dang_nhap, mat_khau, vai_tro, trang_thai } = req.body;

  const account = db.prepare('SELECT * FROM tai_khoan WHERE id = ?').get(id);
  if (!account) return error(res, 'Không tìm thấy tài khoản.', 404);

  // Lấy vai trò hiện tại của tài khoản đang sửa
  const currentRole = db.prepare('SELECT ma_vai_tro FROM vai_tro WHERE id = ?').get(account.vai_tro_id);

  // Bảo vệ quyền admin: Chỉ admin hoặc chu_phong_gym mới được nâng lên admin hoặc chỉnh sửa tài khoản admin
  const isUpdatingToAdmin = vai_tro === 'admin';
  const isCurrentlyAdmin = currentRole?.ma_vai_tro === 'admin';
  const isActorAllowed = ['admin', 'chu_phong_gym'].includes(req.user.vai_tro);

  if ((isUpdatingToAdmin || isCurrentlyAdmin) && !isActorAllowed) {
    return error(res, 'Chỉ Quản trị viên hoặc Chủ phòng gym mới có quyền cấp hoặc chỉnh sửa tài khoản Quản trị viên.', 403);
  }

  let hash = account.mat_khau_hash;
  if (mat_khau) {
    hash = bcrypt.hashSync(mat_khau, 12);
  }

  let vai_tro_id = account.vai_tro_id;
  if (vai_tro) {
    const vt = db.prepare('SELECT id FROM vai_tro WHERE ma_vai_tro = ?').get(vai_tro);
    if (vt) vai_tro_id = vt.id;
  }

  if (ten_dang_nhap && ten_dang_nhap !== account.ten_dang_nhap) {
    const exists = db.prepare('SELECT id FROM tai_khoan WHERE ten_dang_nhap = ? AND id != ?').get(ten_dang_nhap, id);
    if (exists) return error(res, 'Tên đăng nhập đã tồn tại.', 409);
  }

  db.prepare(`
    UPDATE tai_khoan SET
      ten_dang_nhap = COALESCE(?, ten_dang_nhap),
      mat_khau_hash = ?,
      vai_tro_id = ?,
      trang_thai = COALESCE(?, trang_thai)
    WHERE id = ?
  `).run(ten_dang_nhap || null, hash, vai_tro_id, trang_thai || null, id);

  ghi_audit_log(req, 'UPDATE', 'tai_khoan', parseInt(id), { ten_dang_nhap: account.ten_dang_nhap }, { ten_dang_nhap }, 'Cập nhật tài khoản hệ thống');
  return success(res, null, 'Cập nhật tài khoản thành công');
};

// ── DELETE /api/staff/accounts/:id (Xóa tài khoản) ────────────────────────────
export const deleteAccount = (req, res) => {
  const { id } = req.params;
  const account = db.prepare('SELECT * FROM tai_khoan WHERE id = ?').get(id);
  if (!account) return error(res, 'Không tìm thấy tài khoản.', 404);

  if (parseInt(id) === req.user.id) {
    return error(res, 'Bạn không thể tự xóa tài khoản của chính mình!', 400);
  }

  const tx = db.transaction(() => {
    // Gỡ bỏ liên kết khóa ngoại ở bảng ho_so trước
    db.prepare('UPDATE ho_so SET tai_khoan_id = NULL WHERE tai_khoan_id = ?').run(id);
    db.prepare('DELETE FROM tai_khoan WHERE id = ?').run(id);
  });

  tx();

  ghi_audit_log(req, 'DELETE', 'tai_khoan', parseInt(id), account, null, 'Xóa tài khoản hệ thống');
  return success(res, null, 'Xóa tài khoản thành công');
};