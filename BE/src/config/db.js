/**
 * Kết nối database SQLite (singleton)
 * Sử dụng better-sqlite3 — đồng bộ, hiệu năng cao
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../../database/paradise_gym.db');

// Kiểm tra file DB có tồn tại không
if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ Database không tồn tại tại: ${DB_PATH}`);
  console.error('👉 Hãy chạy: npm run init-db');
  process.exit(1);
}

// Kết nối DB với các pragma tối ưu
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

// ── Migration tự động khi khởi động ───────────────────────
try {
  db.exec(`ALTER TABLE lich_tap ADD COLUMN da_checkin INTEGER NOT NULL DEFAULT 0 CHECK (da_checkin IN (0,1));`);
} catch (_) { /* cột đã tồn tại — bỏ qua */ }

// Tạo bảng cau_hinh nếu chưa có
db.exec(`
  CREATE TABLE IF NOT EXISTS cau_hinh (
    khoa         TEXT PRIMARY KEY,
    gia_tri      TEXT NOT NULL,
    mo_ta        TEXT,
    ngay_cap_nhat DATETIME DEFAULT (datetime('now','localtime'))
  );
`);

// Chèn cấu hình mặc định (bỏ qua nếu đã tồn tại)
db.prepare(`INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, mo_ta) VALUES (?, ?, ?)`).run('gio_dong_cua', '22:00', 'Giờ cron job trừ buổi PT chạy');
db.prepare(`INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, mo_ta) VALUES (?, ?, ?)`).run('qr_token_ttl_phut', '5', 'Thời gian hiệu lực QR Code (phút)');

// ── Migration v2: Tạo / nâng cấp bảng thong_bao lên 15 loại ──────
// Dùng flag trong cau_hinh để chỉ chạy migration 1 lần duy nhất
const migrated = db.prepare(`SELECT gia_tri FROM cau_hinh WHERE khoa = 'db_migration_thongbao_v2'`).get();

if (!migrated) {
  // Nếu bảng cũ đã tồn tại → rename để giữ dữ liệu
  const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='thong_bao'`).get();

  db.transaction(() => {
    if (tableExists) {
      db.exec(`ALTER TABLE thong_bao RENAME TO thong_bao_old;`);
    }

    // Tạo bảng mới với đầy đủ 15 loại
    db.exec(`
      CREATE TABLE thong_bao (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        loai          TEXT NOT NULL CHECK (loai IN (
                          'sap_het_han_goi_tap', 'het_han_goi_tap',
                          'check_in', 'chua_check_in_truoc_buoi_pt',
                          'cron_tu_xac_nhan', 'sap_het_buoi_pt',
                          'ho_so_moi', 'gia_han_goi_tap',
                          'dang_ky_goi_pt_moi', 'huy_buoi_tap',
                          'hoan_tac_buoi_tap', 'tai_khoan_bi_khoa',
                          'tai_khoan_moi', 'tom_tat_buoi_sang',
                          'het_han_goi_pt_thang'
                      )),
        tieu_de       TEXT NOT NULL,
        noi_dung      TEXT NOT NULL,
        doi_tuong_id  INTEGER,
        doi_tuong     TEXT,
        danh_cho      TEXT NOT NULL CHECK (danh_cho IN ('admin','le_tan','ca_hai')),
        da_doc        INTEGER NOT NULL DEFAULT 0 CHECK (da_doc IN (0,1)),
        doc_boi_id    INTEGER REFERENCES tai_khoan(id),
        ngay_doc      DATETIME,
        ngay_tao      DATETIME NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_thongbao_danh_cho ON thong_bao(danh_cho, da_doc);
      CREATE INDEX IF NOT EXISTS idx_thongbao_ngay ON thong_bao(ngay_tao);
    `);

    // Copy dữ liệu cũ sang (nếu có)
    if (tableExists) {
      db.exec(`INSERT INTO thong_bao SELECT * FROM thong_bao_old;`);
      db.exec(`DROP TABLE thong_bao_old;`);
    }

    // Lưu ý: flag migration được đặt bên ngoài transaction (tránh nested prepare)
  })();

  // Gọi riêng bên ngoài transaction để tránh bị lock
  db.prepare(`INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, mo_ta) VALUES ('db_migration_thongbao_v2', '1', 'Migration bảng thong_bao lên 15 loại')`).run();
  console.log('[DB] ✅ Migration thong_bao v2 hoàn thành — 15 loại thông báo.');
} else {
  // Bảng đã tồn tại và đúng phiên bản — đảm bảo index vẫn có
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_thongbao_danh_cho ON thong_bao(danh_cho, da_doc);
    CREATE INDEX IF NOT EXISTS idx_thongbao_ngay ON thong_bao(ngay_tao);
  `);
}

// ── Migration v3: Cập nhật View v_trang_thai_hoi_vien để bao gồm cả gói PT ──────
const migratedV3 = db.prepare(`SELECT gia_tri FROM cau_hinh WHERE khoa = 'db_migration_view_member_status_v3'`).get();
if (!migratedV3) {
  db.transaction(() => {
    db.exec(`DROP VIEW IF EXISTS v_trang_thai_hoi_vien;`);
    db.exec(`
      CREATE VIEW v_trang_thai_hoi_vien AS
      SELECT
          h.id,
          h.ma_ho_so,
          h.ho_ten,
          h.so_dien_thoai,
          h.email,
          h.avatar_url,
          h.is_deleted,
          (SELECT MAX(d_ngay) FROM (
             SELECT den_ngay as d_ngay FROM dang_ky_goi_tap WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong'
             UNION ALL
             SELECT den_ngay as d_ngay FROM dang_ky_pt WHERE hoi_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
          )) AS den_ngay_xa_nhat,
          CASE
              WHEN NOT EXISTS (SELECT 1 FROM dang_ky_goi_tap dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong')
                   AND NOT EXISTS (SELECT 1 FROM dang_ky_pt dp WHERE dp.hoi_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong')
                  THEN 'chua_dang_ky'
              WHEN (SELECT MAX(d_ngay) FROM (
                      SELECT den_ngay as d_ngay FROM dang_ky_goi_tap WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong'
                      UNION ALL
                      SELECT den_ngay as d_ngay FROM dang_ky_pt WHERE hoi_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
                   )) < date('now','localtime')
                  THEN 'het_han'
              WHEN (SELECT MAX(d_ngay) FROM (
                      SELECT den_ngay as d_ngay FROM dang_ky_goi_tap WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong'
                      UNION ALL
                      SELECT den_ngay as d_ngay FROM dang_ky_pt WHERE hoi_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
                   )) <= date('now','localtime','+7 days')
                  THEN 'sap_het_han'
              ELSE 'con_han'
          END AS trang_thai_mau,
          (SELECT COUNT(*) FROM dang_ky_pt dp
           WHERE dp.hoi_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS so_goi_pt_dang_tap,
          (SELECT COUNT(*) FROM dang_ky_goi_tap dk
           WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong') AS so_goi_tap_hien_tai
      FROM ho_so h
      WHERE h.loai_ho_so = 'hoi_vien'
        AND h.is_deleted = 0;
    `);
  })();
  db.prepare(`INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, mo_ta) VALUES ('db_migration_view_member_status_v3', '1', 'Cập nhật View trạng thái hội viên bao gồm cả PT')`).run();
  console.log('[DB] ✅ Migration v_trang_thai_hoi_vien v3 hoàn thành.');
}

// ── Migration v4: Mở rộng bảng thong_bao lên 16 loại (thêm cap_nhat_buoi_tap) ──
const migratedV4 = db.prepare(`SELECT gia_tri FROM cau_hinh WHERE khoa = 'db_migration_thongbao_v4'`).get();

if (!migratedV4) {
  db.transaction(() => {
    // Đổi tên bảng cũ để giữ toàn bộ dữ liệu
    db.exec(`ALTER TABLE thong_bao RENAME TO thong_bao_v3_backup;`);

    // Tạo bảng mới với 16 loại (bổ sung 'cap_nhat_buoi_tap')
    db.exec(`
      CREATE TABLE thong_bao (
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
        danh_cho      TEXT NOT NULL CHECK (danh_cho IN ('admin','le_tan','ca_hai')),
        da_doc        INTEGER NOT NULL DEFAULT 0 CHECK (da_doc IN (0,1)),
        doc_boi_id    INTEGER REFERENCES tai_khoan(id),
        ngay_doc      DATETIME,
        ngay_tao      DATETIME NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_thongbao_danh_cho ON thong_bao(danh_cho, da_doc);
      CREATE INDEX IF NOT EXISTS idx_thongbao_ngay ON thong_bao(ngay_tao);
    `);

    // Copy toàn bộ dữ liệu thông báo cũ sang bảng mới
    db.exec(`INSERT INTO thong_bao SELECT * FROM thong_bao_v3_backup;`);

    // Xóa bảng backup
    db.exec(`DROP TABLE thong_bao_v3_backup;`);
  })();

  // Lưu flag migration ngoài transaction để tránh nested prepare lock
  db.prepare(`INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, mo_ta) VALUES ('db_migration_thongbao_v4', '1', 'Mở rộng bảng thong_bao lên 16 loại: thêm cap_nhat_buoi_tap')`).run();
  console.log('[DB] ✅ Migration thong_bao v4 hoàn thành — 16 loại thông báo (bổ sung cap_nhat_buoi_tap).');
}

export default db;

