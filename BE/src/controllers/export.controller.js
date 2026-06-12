/**
 * Export Controller — Xuất báo cáo XLSX
 * Sử dụng thư viện xlsx để tạo file Excel chuẩn có AutoFilter
 */

import XLSX from 'xlsx';
import db from '../config/db.js';
import { error } from '../utils/response.js';

function sendXlsx(res, headers, rows, labelMap, filename) {
  // Chuyển đổi các dòng thành mảng đối tượng với nhãn cột tiếng Việt tương ứng
  const data = rows.map(row => {
    const obj = {};
    headers.forEach(h => {
      const label = labelMap[h] || h;
      let val = row[h];
      if (val == null) val = '';
      obj[label] = val;
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Tự động căn chỉnh độ rộng các cột dữ liệu
  const maxLens = {};
  headers.forEach(h => {
    const label = labelMap[h] || h;
    maxLens[label] = label.length;
  });
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      const val = row[key] ? String(row[key]) : '';
      if (val.length > maxLens[key]) {
        maxLens[key] = val.length;
      }
    });
  });
  worksheet['!cols'] = Object.keys(maxLens).map(key => ({
    wch: Math.min(Math.max(maxLens[key] + 3, 10), 50)
  }));

  // Bật tính năng AutoFilter trong Excel cho vùng dữ liệu
  if (data.length > 0) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sach');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  return res.end(buffer);
}

// ──────────────────────────────────────────────────────────
// Helpers định dạng dữ liệu cho Excel thân thiện
// ──────────────────────────────────────────────────────────
function formatVND(amount) {
  if (amount == null || amount === '') return '';
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat('vi-VN').format(num) + ' VNĐ';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  // Định dạng YYYY-MM-DD -> DD/MM/YYYY
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return dateStr;
}

function formatPhone(phoneStr) {
  if (!phoneStr) return '';
  return phoneStr;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr;
}

function translateGender(g) {
  if (g === 'nam') return 'Nam';
  if (g === 'nu') return 'Nữ';
  if (g === 'khac') return 'Khác';
  return g || '';
}

// ── GET /api/export/members ───────────────────────────────
// Export danh sách hội viên/PT XLSX
export const exportMembers = (req, res) => {
  const { loai_ho_so = 'hoi_vien', status, search, chi_nhanh } = req.query;

  let where = `WHERE h.loai_ho_so = ? AND h.is_deleted = 0`;
  const params = [loai_ho_so];

  if (chi_nhanh) {
    where += ` AND h.chi_nhanh = ?`;
    params.push(chi_nhanh);
  }

  if (search) {
    where += ` AND (h.ho_ten LIKE ? OR h.so_dien_thoai LIKE ? OR h.ma_ho_so LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const rows = db.prepare(`
    SELECT
      h.ma_ho_so, h.ho_ten, h.gioi_tinh, h.ngay_sinh,
      h.so_dien_thoai, h.email, h.chi_nhanh,
      (SELECT gt.ten_goi FROM dang_ky_goi_tap dk JOIN goi_tap gt ON gt.id = dk.goi_tap_id
       WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong'
       ORDER BY dk.den_ngay DESC LIMIT 1) AS ten_goi_tap,
      (SELECT dk.den_ngay FROM dang_ky_goi_tap dk
       WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong'
       ORDER BY dk.den_ngay DESC LIMIT 1) AS het_han_goi_tap,
      (SELECT pt.ho_ten FROM dang_ky_pt dp JOIN ho_so pt ON pt.id = dp.pt_id
       WHERE dp.hoi_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong'
       ORDER BY dp.id DESC LIMIT 1) AS ten_pt,
      h.ngay_tao
    FROM ho_so h
    ${where}
    ORDER BY h.ho_ten ASC
  `).all(...params);

  const formattedRows = rows.map(r => ({
    ...r,
    gioi_tinh: translateGender(r.gioi_tinh),
    ngay_sinh: formatDate(r.ngay_sinh),
    so_dien_thoai: formatPhone(r.so_dien_thoai),
    het_han_goi_tap: formatDate(r.het_han_goi_tap),
    ngay_tao: r.ngay_tao ? formatDate(r.ngay_tao.slice(0, 10)) : ''
  }));

  const headers = ['ma_ho_so','ho_ten','gioi_tinh','ngay_sinh','so_dien_thoai','email','chi_nhanh','ten_goi_tap','het_han_goi_tap','ten_pt','ngay_tao'];
  const labelMap = {
    ma_ho_so: 'Mã hồ sơ', ho_ten: 'Họ tên', gioi_tinh: 'Giới tính',
    ngay_sinh: 'Ngày sinh', so_dien_thoai: 'SĐT', email: 'Email',
    chi_nhanh: 'Chi nhánh', ten_goi_tap: 'Gói tập', het_han_goi_tap: 'HH gói',
    ten_pt: 'PT phụ trách', ngay_tao: 'Ngày gia nhập',
  };

  const prefix = loai_ho_so === 'pt' ? 'pt' : 'hoi-vien';
  const filename = `${prefix}-${new Date().toISOString().slice(0,10)}.xlsx`;
  return sendXlsx(res, headers, formattedRows, labelMap, filename);
};

// ── GET /api/export/revenue ───────────────────────────────
// Export doanh thu XLSX
export const exportRevenue = (req, res) => {
  const { days = 30, tu_ngay, den_ngay, chi_nhanh } = req.query;

  let rows = [];
  if (chi_nhanh) {
    // Nếu lọc chi nhánh, tính trực tiếp từ dang_ky_goi_tap và dang_ky_pt thuộc chi nhánh đó
    let whereGoiTap = '';
    let whereGoiPt = '';
    let params = [];

    if (tu_ngay && den_ngay) {
      whereGoiTap = `COALESCE(date(dk.ngay_thanh_toan), date(dk.ngay_tao)) >= ? AND COALESCE(date(dk.ngay_thanh_toan), date(dk.ngay_tao)) <= ?`;
      whereGoiPt = `COALESCE(date(dp.ngay_thanh_toan), date(dp.ngay_tao)) >= ? AND COALESCE(date(dp.ngay_thanh_toan), date(dp.ngay_tao)) <= ?`;
      params.push(tu_ngay, den_ngay, chi_nhanh, tu_ngay, den_ngay, chi_nhanh);
    } else {
      whereGoiTap = `COALESCE(date(dk.ngay_thanh_toan), date(dk.ngay_tao)) >= date('now','localtime','-' || ? || ' days')`;
      whereGoiPt = `COALESCE(date(dp.ngay_thanh_toan), date(dp.ngay_tao)) >= date('now','localtime','-' || ? || ' days')`;
      const dVal = parseInt(days);
      params.push(dVal, chi_nhanh, dVal, chi_nhanh);
    }

    rows = db.prepare(`
      SELECT ngay, SUM(tong) as tong_tien, SUM(cnt) as tong_don, SUM(gt_tien) as tien_goi_tap, SUM(pt_tien) as tien_goi_pt FROM (
        SELECT COALESCE(date(dk.ngay_thanh_toan), date(dk.ngay_tao)) as ngay, SUM(dk.so_tien_da_thu) as tong, COUNT(dk.id) as cnt, SUM(dk.so_tien_da_thu) as gt_tien, 0 as pt_tien
        FROM dang_ky_goi_tap dk
        JOIN ho_so h ON h.id = dk.ho_so_id
        WHERE ${whereGoiTap}
          AND dk.trang_thai IN ('dang_hoat_dong', 'het_han', 'cho_kich_hoat')
          AND h.chi_nhanh = ?
        GROUP BY ngay
        UNION ALL
        SELECT COALESCE(date(dp.ngay_thanh_toan), date(dp.ngay_tao)) as ngay, SUM(dp.gia_thuc_te) as tong, COUNT(dp.id) as cnt, 0 as gt_tien, SUM(dp.gia_thuc_te) as pt_tien
        FROM dang_ky_pt dp
        WHERE ${whereGoiPt}
          AND dp.trang_thai IN ('dang_hoat_dong', 'hoan_thanh', 'cho_kich_hoat')
          AND dp.chi_nhanh_dang_ky = ?
        GROUP BY ngay
      ) GROUP BY ngay ORDER BY ngay ASC
    `).all(...params);
  } else {
    let where;
    let params;
    if (tu_ngay && den_ngay) {
      where = `WHERE d.ngay >= ? AND d.ngay <= ?`;
      params = [tu_ngay, den_ngay];
    } else {
      where = `WHERE d.ngay >= date('now','localtime','-' || ? || ' days')`;
      params = [parseInt(days)];
    }

    rows = db.prepare(`
      SELECT d.ngay, d.tong_tien, d.tong_don, d.tien_goi_tap, d.tien_goi_pt
      FROM doanh_thu d
      ${where}
      ORDER BY d.ngay ASC
    `).all(...params);
  }

  const formattedRows = rows.map(r => ({
    ...r,
    ngay: formatDate(r.ngay),
    tong_tien: formatVND(r.tong_tien),
    tong_don: r.tong_don,
    tien_goi_tap: formatVND(r.tien_goi_tap),
    tien_goi_pt: formatVND(r.tien_goi_pt)
  }));

  const headers = ['ngay','tong_don','tong_tien','tien_goi_tap','tien_goi_pt'];
  const labelMap = {
    ngay: 'Ngày', tong_don: 'Số giao dịch',
    tong_tien: 'Tổng doanh thu', tien_goi_tap: 'Gói Gym', tien_goi_pt: 'Gói PT',
  };

  const filename = `doanh-thu-${new Date().toISOString().slice(0,10)}.xlsx`;
  return sendXlsx(res, headers, formattedRows, labelMap, filename);
};

// ── GET /api/export/pt-schedules ─────────────────────────
// Export lịch tập PT XLSX
export const exportPTSchedules = (req, res) => {
  const { tu_ngay, den_ngay, pt_id, chi_nhanh } = req.query;

  let where = `WHERE 1=1`;
  const params = [];
  if (tu_ngay) { where += ` AND lt.ngay_tap >= ?`; params.push(tu_ngay); }
  if (den_ngay) { where += ` AND lt.ngay_tap <= ?`; params.push(den_ngay); }
  if (pt_id) { where += ` AND lt.pt_id = ?`; params.push(pt_id); }
  if (chi_nhanh) { where += ` AND lt.chi_nhanh_tap = ?`; params.push(chi_nhanh); }

  const rows = db.prepare(`
    SELECT
      lt.id,
      lt.ngay_tap AS ngay,
      lt.gio_bat_dau AS gio_bat_dau,
      lt.gio_ket_thuc AS gio_ket_thuc,
      hv.ho_ten AS ten_hoi_vien, hv.ma_ho_so AS ma_hv,
      pt.ho_ten AS ten_pt, pt.ma_ho_so AS ma_pt,
      lt.trang_thai, lt.loai_buoi, lt.ghi_chu
    FROM lich_tap lt
    JOIN ho_so hv ON hv.id = lt.hoi_vien_id
    JOIN ho_so pt ON pt.id = lt.pt_id
    ${where}
    ORDER BY lt.ngay_tap ASC, lt.gio_bat_dau ASC
  `).all(...params);

  const formattedRows = rows.map(r => {
    let trangThaiText = r.trang_thai;
    if (r.trang_thai === 'cho_tap' || r.trang_thai === 'pending') trangThaiText = 'Chờ tập';
    else if (r.trang_thai === 'da_tap' || r.trang_thai === 'confirmed') trangThaiText = 'Đã tập';
    else if (r.trang_thai === 'da_huy' || r.trang_thai === 'cancelled') trangThaiText = 'Đã hủy';

    let loaiBuoiText = r.loai_buoi;
    if (r.loai_buoi === 'ca_nhan') loaiBuoiText = 'Cá nhân';
    else if (r.loai_buoi === 'nhom') loaiBuoiText = 'Nhóm';

    return {
      ...r,
      ngay: formatDate(r.ngay),
      gio_bat_dau: formatTime(r.gio_bat_dau),
      gio_ket_thuc: formatTime(r.gio_ket_thuc),
      trang_thai: trangThaiText,
      loai_buoi: loaiBuoiText
    };
  });

  const headers = ['id','ngay','gio_bat_dau','gio_ket_thuc','ten_hoi_vien','ma_hv','ten_pt','ma_pt','trang_thai','loai_buoi','ghi_chu'];
  const labelMap = {
    id: 'Mã lịch', ngay: 'Ngày', gio_bat_dau: 'Giờ bắt đầu', gio_ket_thuc: 'Giờ kết thúc',
    ten_hoi_vien: 'Hội viên', ma_hv: 'Mã HV', ten_pt: 'Huấn luyện viên', ma_pt: 'Mã PT',
    trang_thai: 'Trạng thái', loai_buoi: 'Loại buổi', ghi_chu: 'Ghi chú',
  };

  const filename = `lich-pt-${new Date().toISOString().slice(0,10)}.xlsx`;
  return sendXlsx(res, headers, formattedRows, labelMap, filename);
};
