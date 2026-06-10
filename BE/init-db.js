/**
 * Script khởi tạo database SQLite từ file SQL schema
 * Chạy: node init-db.js
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Đường dẫn tới file database và SQL schema
const DB_DIR = path.join(__dirname, 'database');
const DB_PATH = path.join(DB_DIR, 'paradise_gym.db');
const SQL_PATH = path.join(__dirname, '..', 'paradise_gym_v2.sql');

// Tạo thư mục database nếu chưa có
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log('Đã tạo thư mục database/');
}

// Kiểm tra file SQL tồn tại
if (!fs.existsSync(SQL_PATH)) {
  console.error(`❌ Không tìm thấy file SQL tại: ${SQL_PATH}`);
  process.exit(1);
}

// Khởi tạo DB
console.log('🔄 Đang khởi tạo database...');
const db = new Database(DB_PATH);

try {
  // Đọc và thực thi SQL schema (bỏ qua các INSERT seed vì sẽ tạo lại với bcrypt thật)
  const sqlContent = fs.readFileSync(SQL_PATH, 'utf8');

  // Tách phần schema (CREATE TABLE, INDEX, VIEW, TRIGGER) ra khỏi phần SEED DATA
  // để chúng ta có thể tạo password hash thật bằng bcrypt
  const schemaParts = sqlContent.split(/-- ============================================================\r?\n-- DỮ LIỆU MẪU \(SEED\)/);
  const schemaSql = schemaParts[0];

  // Thực thi schema
  db.exec(schemaSql);
  console.log('Đã tạo xong bảng, view, trigger, index từ file SQL');


  // Tạo các bảng bổ sung chỉ có trong migration của db.js
  db.exec(`
    CREATE TABLE IF NOT EXISTS cau_hinh (
      khoa         TEXT PRIMARY KEY,
      gia_tri      TEXT NOT NULL,
      mo_ta        TEXT,
      ngay_cap_nhat DATETIME DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS thong_bao (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      loai          TEXT NOT NULL CHECK (loai IN (
                        'sap_het_han_goi_tap', 'het_han_goi_tap',
                        'check_in', 'chua_check_in_truoc_buoi_pt',
                        'cron_tu_xac_nhan', 'sap_het_buoi_pt',
                        'ho_so_moi', 'gia_han_goi_tap',
                        'dang_ky_goi_pt_moi', 'huy_buoi_tap',
                        'hoan_tac_buoi_tap', 'tai_khoan_bi_khoa',
                        'tai_khoan_moi', 'tom_tat_buoi_sang',
                        'het_han_goi_pt_thang', 'cap_nhat_buoi_tap'
                    )),
      tieu_de       TEXT NOT NULL,
      noi_dung      TEXT NOT NULL,
      doi_tuong_id  INTEGER,
      doi_tuong     TEXT,
      danh_cho      TEXT NOT NULL CHECK (danh_cho IN ('admin','nhan_vien','ca_hai')),
      da_doc        INTEGER NOT NULL DEFAULT 0 CHECK (da_doc IN (0,1)),
      doc_boi_id    INTEGER REFERENCES tai_khoan(id),
      ngay_doc      DATETIME,
      ngay_tao      DATETIME NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS thong_bao_user (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      ho_so_id      INTEGER REFERENCES ho_so(id),
      loai          TEXT DEFAULT 'thong_bao_chung',
      tieu_de       TEXT NOT NULL,
      noi_dung      TEXT NOT NULL,
      da_doc        INTEGER NOT NULL DEFAULT 0 CHECK (da_doc IN (0,1)),
      ngay_tao      DATETIME NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS noi_quy (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      tieu_de      TEXT NOT NULL,
      noi_dung     TEXT NOT NULL,
      thu_tu       INTEGER NOT NULL DEFAULT 0,
      ap_dung_cho  TEXT NOT NULL DEFAULT 'tat_ca' CHECK (ap_dung_cho IN ('tat_ca','hoi_vien','pt','nhan_vien')),
      is_active    INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
      nguoi_tao_id INTEGER REFERENCES tai_khoan(id),
      ngay_cap_nhat DATETIME DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS pt_toi_nhat_ky (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      hoi_vien_id     INTEGER NOT NULL REFERENCES ho_so(id),
      pt_id           INTEGER NOT NULL REFERENCES ho_so(id),
      nguoi_gui_id    INTEGER NOT NULL REFERENCES ho_so(id),
      vai_tro_gui     TEXT NOT NULL CHECK (vai_tro_gui IN ('hoi_vien','pt')),
      loai_nhat_ky    TEXT NOT NULL DEFAULT 'cap_nhat'
                      CHECK (loai_nhat_ky IN ('hoi_vien_cap_nhat','pt_dan_do','cap_nhat')),
      cam_nhan_tap    TEXT,
      khau_phan_an    TEXT,
      so_phut_tap     INTEGER,
      noi_dung_tap    TEXT,
      loi_dan         TEXT,
      ghi_chu         TEXT,
      da_chinh_sua    INTEGER NOT NULL DEFAULT 0 CHECK (da_chinh_sua IN (0,1)),
      ngay_tao        DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
      ngay_cap_nhat   DATETIME NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS yeu_cau_goi_tap (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      ho_so_id     INTEGER NOT NULL REFERENCES ho_so(id),
      dang_ky_id   INTEGER REFERENCES dang_ky_goi_tap(id),
      loai_yeu_cau TEXT NOT NULL DEFAULT 'gia_han'
                   CHECK (loai_yeu_cau IN ('gia_han','tam_dung','huy')),
      ly_do        TEXT,
      trang_thai   TEXT NOT NULL DEFAULT 'cho_duyet'
                   CHECK (trang_thai IN ('cho_duyet','da_duyet','tu_choi')),
      nguoi_duyet_id INTEGER REFERENCES tai_khoan(id),
      ghi_chu_duyet  TEXT,
      ngay_tao     DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
      ngay_duyet   DATETIME
    );
  `);
  console.log('Đã tạo xong các bảng mở rộng');

  // Tạo bcrypt hash thật cho mật khẩu "123456"
  const password = '123456';
  const hash = bcrypt.hashSync(password, 12);

  // ---- INSERT SEED DATA với bcrypt hash thật ----

  // Tài khoản
  const insertTaiKhoan = db.prepare(`
    INSERT OR IGNORE INTO tai_khoan (id, ten_dang_nhap, mat_khau_hash, vai_tro_id) VALUES (?, ?, ?, ?)
  `);
  const accounts = [
    [1, 'admin', hash, 1],
    [2, 'letan01', hash, 2],
    [3, 'pt01', hash, 3],
    [4, 'pt02', hash, 3],
    [5, 'hoivien01', hash, 4],
    [6, 'hoivien02', hash, 4],
    [7, 'hoivien03', hash, 4],
  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insertTaiKhoan.run(...row);
  });
  insertMany(accounts);
  console.log('✅ Đã tạo 7 tài khoản mặc định (mật khẩu: 123456)');

  // Hồ sơ
  db.exec(`
    INSERT OR IGNORE INTO ho_so (id, tai_khoan_id, ma_ho_so, loai_ho_so, ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, avatar_url, nguoi_tao_id) VALUES
    (1, 1, 'AD001', 'nhan_vien', 'Nguyễn Văn Admin',  'nam', '1990-01-15', '0901000001', 'admin@paradise.gym',   'https://i.pravatar.cc/150?img=11', 1),
    (2, 2, 'LT001', 'le_tan',   'Trần Thị Lễ Tân',   'nu',  '1998-05-20', '0901000002', 'letan01@paradise.gym', 'https://i.pravatar.cc/150?img=5',  1),
    (3, 3, 'PT001', 'pt',       'Lê Văn Tuấn',        'nam', '1995-03-10', '0901000003', 'pt01@paradise.gym',    'https://i.pravatar.cc/150?img=67', 1),
    (4, 4, 'PT002', 'pt',       'Phạm Thị Lan',       'nu',  '1996-07-22', '0901000004', 'pt02@paradise.gym',    'https://i.pravatar.cc/150?img=56', 1),
    (5, 5, 'HV001', 'hoi_vien', 'Võ Văn Minh',        'nam', '2000-09-05', '0901000005', 'hv01@gmail.com',       'https://i.pravatar.cc/150?img=12', 2),
    (6, 6, 'HV002', 'hoi_vien', 'Ngô Thị Hoa',        'nu',  '1999-12-18', '0901000006', 'hv02@gmail.com',       'https://i.pravatar.cc/150?img=47', 2),
    (7, 7, 'HV003', 'hoi_vien', 'Đặng Văn Khoa',      'nam', '2001-04-30', '0901000007', 'hv03@gmail.com',       NULL,                               2);
  `);
  console.log('✅ Đã tạo hồ sơ mẫu');

  // Gói tập & Gói PT
  db.exec(`
    INSERT OR IGNORE INTO goi_tap (id, ten_goi, so_thang, so_ngay_them, gia, mo_ta, nguoi_tao_id) VALUES
    (1, 'Gói 1 tháng',          1,  0,  500000, 'Tập không giới hạn trong 1 tháng', 1),
    (2, 'Gói 3 tháng',          3,  0, 1350000, 'Tiết kiệm 10% so với gói 1 tháng', 1),
    (3, 'Gói 6 tháng',          6,  0, 2400000, 'Tiết kiệm 20% so với gói 1 tháng', 1),
    (4, 'Gói 12 tháng',        12,  0, 4200000, 'Tiết kiệm 30% — Gói năm tốt nhất', 1),
    (5, 'Gói 1 tháng + 5 ngày', 1,  5,  550000, 'Tháng + thêm 5 ngày khuyến mãi',  1);

    INSERT OR IGNORE INTO goi_pt (id, ten_goi, loai_goi, so_buoi, so_thang, gia, nguoi_tao_id) VALUES
    (1, 'PT 10 buổi',      'theo_buoi',  10, NULL, 1500000, 1),
    (2, 'PT 20 buổi',      'theo_buoi',  20, NULL, 2800000, 1),
    (3, 'PT 1 tháng',      'theo_thang', NULL, 1,  2000000, 1),
    (4, 'PT 3 tháng',      'theo_thang', NULL, 3,  5500000, 1),
    (5, 'PT Nhóm 10 buổi', 'theo_buoi',  10, NULL,  800000, 1);
  `);
  console.log('✅ Đã tạo gói tập và gói PT mẫu');

  // Đăng ký gói tập
  db.exec(`
    INSERT OR IGNORE INTO dang_ky_goi_tap (ho_so_id, goi_tap_id, tu_ngay, den_ngay, gia_thuc_te, trang_thai, phuong_thuc_tt, nguoi_thu_id, nguoi_tao_id) VALUES
    (5, 2, date('now','-60 days'), date('now','30 days'),  1350000, 'dang_hoat_dong', 'tien_mat',     2, 2),
    (6, 1, date('now','-25 days'), date('now','5 days'),    500000, 'dang_hoat_dong', 'chuyen_khoan', 2, 2),
    (6, 3, date('now'),            date('now','180 days'), 2400000, 'dang_hoat_dong', 'tien_mat',     2, 2),
    (7, 1, date('now','-90 days'), date('now','-60 days'),  500000, 'het_han',        'tien_mat',     2, 2);
  `);
  console.log('✅ Đã tạo dữ liệu đăng ký gói tập');

  // Đăng ký PT
  db.exec(`
    INSERT OR IGNORE INTO dang_ky_pt (hoi_vien_id, pt_id, goi_pt_id, so_buoi_dang_ky, so_buoi_da_tap, tu_ngay, gia_thuc_te, trang_thai, phuong_thuc_tt, nguoi_thu_id, nguoi_tao_id) VALUES
    (5, 3, 1, 10, 3, date('now','-14 days'), 1500000, 'dang_hoat_dong', 'tien_mat',     2, 2),
    (6, 4, 3, NULL, 8, date('now','-14 days'), 2000000, 'dang_hoat_dong', 'chuyen_khoan', 2, 2),
    (5, 3, 5, 10, 2, date('now','-7 days'),   800000,  'dang_hoat_dong', 'tien_mat',     2, 2),
    (6, 3, 5, 10, 2, date('now','-7 days'),   800000,  'dang_hoat_dong', 'tien_mat',     2, 2);
  `);
  console.log('✅ Đã tạo dữ liệu đăng ký PT');

  // Lịch tập
  db.exec(`
    INSERT OR IGNORE INTO lich_tap (dang_ky_pt_id, pt_id, hoi_vien_id, ngay_tap, gio_bat_dau, gio_ket_thuc, loai_buoi, trang_thai, confirmed_by_id, ngay_xac_nhan, nguoi_tao_id) VALUES
    (1, 3, 5, date('now','-10 days'), '07:00','08:00', 'ca_nhan', 'da_tap', 1, datetime('now','-10 days','+8 hours'), 2),
    (1, 3, 5, date('now','-8 days'),  '07:00','08:00', 'ca_nhan', 'da_tap', 1, datetime('now','-8 days','+8 hours'),  2),
    (1, 3, 5, date('now','-6 days'),  '07:00','08:00', 'ca_nhan', 'da_tap', 2, datetime('now','-6 days','+8 hours'),  2),
    (1, 3, 5, date('now'),            '07:00','08:00', 'ca_nhan', 'cho_tap', NULL, NULL, 2),
    (1, 3, 5, date('now','2 days'),   '07:00','08:00', 'ca_nhan', 'cho_tap', NULL, NULL, 2),
    (2, 4, 6, date('now'),            '09:00','10:00', 'ca_nhan', 'cho_tap', NULL, NULL, 2),
    (2, 4, 6, date('now','1 days'),   '09:00','10:00', 'ca_nhan', 'cho_tap', NULL, NULL, 2),
    (3, 3, 5, date('now'),            '17:00','18:00', 'nhom',    'cho_tap', NULL, NULL, 2),
    (4, 3, 6, date('now'),            '17:00','18:00', 'nhom',    'cho_tap', NULL, NULL, 2);
  `);
  console.log('✅ Đã tạo lịch tập mẫu');

  // Lượt vào/ra
  db.exec(`
    INSERT OR IGNORE INTO luot_vao_ra (ho_so_id, thoi_diem, loai, phuong_thuc) VALUES
    (5, datetime('now','-3 hours'),                  'vao', 'the_tu'),
    (6, datetime('now','-2 hours'),                  'vao', 'the_tu'),
    (7, datetime('now','-2 hours','+15 minutes'),    'vao', 'qr_code'),
    (5, datetime('now','-1 hours'),                  'ra',  'the_tu'),
    (7, datetime('now','-30 minutes'),               'ra',  'qr_code');
  `);
  console.log('✅ Đã tạo dữ liệu vào/ra phòng tập');

  // Dữ liệu doanh thu lịch sử
  db.exec(`
    INSERT OR IGNORE INTO doanh_thu (ngay, tong_tien, tong_don, tien_goi_tap, tien_goi_pt) VALUES
    (date('now','-6 days'), 3500000, 4, 2000000, 1500000),
    (date('now','-5 days'), 2800000, 3, 1800000, 1000000),
    (date('now','-4 days'), 4200000, 5, 2700000, 1500000),
    (date('now','-3 days'), 1500000, 2,  500000, 1000000),
    (date('now','-2 days'), 5500000, 6, 3500000, 2000000),
    (date('now','-1 days'), 3200000, 4, 2200000, 1000000);
  `);
  console.log('✅ Đã tạo dữ liệu doanh thu lịch sử');

  // Audit log mẫu
  db.exec(`
    INSERT OR IGNORE INTO audit_log (tai_khoan_id, ten_dang_nhap, vai_tro, hanh_dong, doi_tuong, doi_tuong_id, gia_tri_moi, ip_address, ghi_chu) VALUES
    (1, 'admin',   'admin',  'CREATE', 'goi_tap', 1, '{"ten_goi":"Gói 1 tháng","gia":500000}', '127.0.0.1', 'Khởi tạo hệ thống'),
    (2, 'letan01', 'le_tan', 'CREATE', 'ho_so',   5, '{"ho_ten":"Võ Văn Minh","loai":"hoi_vien"}', '192.168.1.10', 'Tạo hồ sơ ban đầu');
  `);
  console.log('✅   Đã tạo audit log mẫu');

  // Khởi tạo các cờ migration để tránh db.js chạy lại các migration cũ
  db.exec(`
    CREATE TABLE IF NOT EXISTS cau_hinh (
      khoa         TEXT PRIMARY KEY,
      gia_tri      TEXT NOT NULL,
      mo_ta        TEXT,
      ngay_cap_nhat DATETIME DEFAULT (datetime('now','localtime'))
    );

    INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, mo_ta) VALUES
    ('db_migration_thongbao_v2', '1', 'Migration bảng thong_bao lên 15 loại'),
    ('db_migration_view_member_status_v3', '1', 'Cập nhật View trạng thái hội viên bao gồm cả PT'),
    ('db_migration_thongbao_v4', '1', 'Mở rộng bảng thong_bao lên 16 loại: thêm cap_nhat_buoi_tap'),
    ('db_migration_thongbao_user_v5', '1', 'Tạo bảng thong_bao_user cho hội viên/PT'),
    ('db_migration_package_reg_v6', '1', 'Nâng cấp bảng dang_ky_goi_tap cho App request'),
    ('db_migration_triggers_revenue_v10', '1', 'Sửa 4 triggers doanh thu: hỗ trợ duyệt từ App và trừ khi hủy gói'),
    ('db_migration_payos_v11', '1', 'Thêm cột PayOS order code, status và chi nhánh mua vào dang_ky_goi_tap'),
    ('db_migration_triggers_revenue_v12', '1', 'Cập nhật lại trigger doanh thu gói tập để trừ theo so_tien_hoan thực tế'),
    ('db_migration_triggers_revenue_v14', '1', 'Tạo trigger tự động cập nhật doanh thu khi thay đổi gia_thuc_te'),
    ('db_migration_triggers_revenue_v16', '1', 'Sửa trigger price_update: thêm INSERT OR IGNORE để đảm bảo row doanh_thu tồn tại trước khi UPDATE');
  `);
  console.log('✅ Đã nạp cấu hình cờ migration');

  console.log('\n🎉 Database đã được khởi tạo thành công tại:', DB_PATH);
  console.log('📋 Tài khoản mặc định:');
  console.log('   admin    / 123456 (Quản trị viên)');
  console.log('   letan01  / 123456 (Lễ tân)');
  console.log('   pt01     / 123456 (PT - Lê Văn Tuấn)');
  console.log('   hoivien01/ 123456 (Hội viên)');

} catch (err) {
  console.error('❌ Lỗi khi khởi tạo database:', err.message);
  process.exit(1);
} finally {
  db.close();
}
