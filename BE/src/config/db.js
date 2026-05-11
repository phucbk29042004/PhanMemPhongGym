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

// Tạo bảng thong_bao nếu chưa có
db.exec(`
  CREATE TABLE IF NOT EXISTS thong_bao (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    loai          TEXT NOT NULL CHECK (loai IN (
                      'sap_het_han_goi_tap','het_han_goi_tap','check_in',
                      'chua_check_in_truoc_buoi_pt','cron_tu_xac_nhan',
                      'sap_het_buoi_pt','ho_so_moi'
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

export default db;
