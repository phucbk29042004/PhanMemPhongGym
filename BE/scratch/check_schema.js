import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../database/paradise_gym.db'));

try {
  console.log('--- Running fixed export members query ---');
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
    WHERE h.loai_ho_so = 'hoi_vien' AND h.is_deleted = 0
    ORDER BY h.ho_ten ASC
  `).all();
  console.log('Query succeeded! Rows count:', rows.length);
} catch (err) {
  console.error('Error running test:', err);
}

db.close();
