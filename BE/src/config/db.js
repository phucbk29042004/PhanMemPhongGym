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

try { db.exec(`ALTER TABLE ho_so ADD COLUMN chieu_cao_cm REAL;`); } catch (_) {}
try { db.exec(`ALTER TABLE ho_so ADD COLUMN can_nang_kg REAL;`); } catch (_) {}
try { db.exec(`ALTER TABLE dang_ky_pt ADD COLUMN ngay_tao DATETIME DEFAULT (datetime('now','localtime'));`); } catch (_) {}
try { db.exec(`ALTER TABLE dang_ky_goi_tap ADD COLUMN so_tien_da_thu REAL DEFAULT 0;`); } catch (_) {}

// ── Migration tự động khi khởi động ───────────────────────
try {
  db.exec(`ALTER TABLE lich_tap ADD COLUMN da_checkin INTEGER NOT NULL DEFAULT 0 CHECK (da_checkin IN (0,1));`);
} catch (_) { /* cột đã tồn tại — bỏ qua */ }

try {
  db.exec(`ALTER TABLE ho_so ADD COLUMN kinh_nghiem INTEGER DEFAULT 0;`);
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

// ── Migration v5: Tạo bảng thong_bao_user cho hội viên/PT (thông báo cá nhân) ──
const migratedV5 = db.prepare(`SELECT gia_tri FROM cau_hinh WHERE khoa = 'db_migration_thongbao_user_v5'`).get();
if (!migratedV5) {
  db.exec(`
    CREATE TABLE thong_bao_user (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      ho_so_id      INTEGER REFERENCES ho_so(id),
      loai          TEXT DEFAULT 'thong_bao_chung',
      tieu_de       TEXT NOT NULL,
      noi_dung      TEXT NOT NULL,
      da_doc        INTEGER NOT NULL DEFAULT 0 CHECK (da_doc IN (0,1)),
      ngay_tao      DATETIME NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_tbu_hoso ON thong_bao_user(ho_so_id, da_doc);
  `);
  db.prepare(`INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, mo_ta) VALUES ('db_migration_thongbao_user_v5', '1', 'Tạo bảng thong_bao_user cho hội viên/PT')`).run();
  console.log('[DB] ✅ Migration thong_bao_user v5 hoàn thành.');
}

// ── Migration v6: Nâng cấp bảng dang_ky_goi_tap (thêm cho_duyet, audit) ────
// Kiểm tra xem đã migrate chưa thông qua config hoặc cấu trúc bảng
const migratedV6 = db.prepare(`SELECT gia_tri FROM cau_hinh WHERE khoa = 'db_migration_package_reg_v6'`).get();
const hasAuditCol = db.prepare(`PRAGMA table_info(dang_ky_goi_tap)`).all().some(c => c.name === 'nguoi_cap_nhat_id');

if (!migratedV6 || !hasAuditCol) {
  try {
    db.transaction(() => {
      // Kiểm tra nếu bảng old đã tồn tại từ lần trước lỗi thì xóa đi
      db.exec(`DROP TABLE IF EXISTS dang_ky_goi_tap_old;`);
      
      // 1. Backup dữ liệu cũ (chỉ rename nếu bảng hiện tại chưa có audit col)
      if (!hasAuditCol) {
        db.exec(`ALTER TABLE dang_ky_goi_tap RENAME TO dang_ky_goi_tap_old;`);
      } else {
        // Nếu đã có audit col nhưng chưa có config, có thể do lần trước lỗi ở bước cuối
        // Ta rename bảng hiện tại (đã mới) để copy lại cho chắc hoặc skip
        // Ở đây để an toàn ta cứ rename để migrate lại từ đầu nếu có 'old'
        // Nhưng nếu 'old' không có thì ta không thể migrate.
        // Thực tế: Nếu đã có audit col thì bảng đã mới rồi.
        console.log('[DB] Table dang_ky_goi_tap already has new schema.');
      }

      // 2. Tạo bảng mới (nếu chưa tồn tại - trường hợp đã rename)
      db.exec(`
        CREATE TABLE IF NOT EXISTS dang_ky_goi_tap (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          ho_so_id        INTEGER NOT NULL REFERENCES ho_so(id),
          goi_tap_id      INTEGER NOT NULL REFERENCES goi_tap(id),
          tu_ngay         DATE    NOT NULL,
          den_ngay        DATE    NOT NULL,
          gia_thuc_te     DECIMAL(15,2) NOT NULL,
          ghi_chu_gia     TEXT,
          trang_thai      TEXT    NOT NULL DEFAULT 'dang_hoat_dong'
                                  CHECK (trang_thai IN ('cho_duyet','dang_hoat_dong','het_han','huy','tam_dung')),
          phuong_thuc_tt  TEXT    CHECK (phuong_thuc_tt IN ('tien_mat','chuyen_khoan','the','momo','zalopay','khac')),
          nguoi_thu_id    INTEGER REFERENCES ho_so(id),
          ma_giao_dich    TEXT,
          ghi_chu_tt      TEXT,
          ngay_thanh_toan DATETIME,
          so_tien_da_thu REAL DEFAULT 0,
          nguoi_tao_id    INTEGER REFERENCES tai_khoan(id),
          nguoi_cap_nhat_id INTEGER REFERENCES tai_khoan(id),
          ngay_tao        DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
          ngay_cap_nhat   DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
          CHECK (den_ngay > tu_ngay)
        );
      `);

      // 3. Nếu có bảng old thì mới copy dữ liệu
      const hasOldTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='dang_ky_goi_tap_old'").get();
      if (hasOldTable) {
        db.exec(`
          INSERT INTO dang_ky_goi_tap (
            id, ho_so_id, goi_tap_id, tu_ngay, den_ngay, gia_thuc_te, ghi_chu_gia,
            trang_thai, phuong_thuc_tt, nguoi_thu_id, ma_giao_dich, ghi_chu_tt,
            ngay_thanh_toan, nguoi_tao_id, nguoi_cap_nhat_id, ngay_tao, ngay_cap_nhat
          )
          SELECT 
            id, ho_so_id, goi_tap_id, tu_ngay, den_ngay, gia_thuc_te, ghi_chu_gia,
            trang_thai, phuong_thuc_tt, nguoi_thu_id, ma_giao_dich, ghi_chu_tt,
            ngay_thanh_toan, nguoi_tao_id, nguoi_tao_id, ngay_tao, ngay_cap_nhat
          FROM dang_ky_goi_tap_old;
        `);
        // 4. Xóa backup
        db.exec(`DROP TABLE dang_ky_goi_tap_old;`);
      }

      // 5. Cập nhật config trong cùng transaction
      db.prepare(`INSERT OR REPLACE INTO cau_hinh (khoa, gia_tri, mo_ta) VALUES ('db_migration_package_reg_v6', '1', 'Nâng cấp bảng dang_ky_goi_tap cho App request')`).run();
    })();
    console.log('[DB] ✅ Migration dang_ky_goi_tap v6 hoàn thành.');
  } catch (err) {
    console.error('[DB] ❌ Migration v6 thất bại:', err.message);
    // Nếu lỗi "no such table ... old" thì có thể do bảng đã được migrate rồi nhưng config chưa lưu
    if (err.message.includes('no such table') && err.message.includes('old') && hasAuditCol) {
       console.log('[DB] Table already migrated, updating config...');
       db.prepare(`INSERT OR REPLACE INTO cau_hinh (khoa, gia_tri, mo_ta) VALUES ('db_migration_package_reg_v6', '1', 'Nâng cấp bảng dang_ky_goi_tap cho App request')`).run();
    } else {
       throw err; // Re-throw if it's a real issue
    }
  }
}

// ── Migration v7: Thêm cột ly_do_huy + so_tien_hoan vào dang_ky_goi_tap ──────
try { db.exec(`ALTER TABLE dang_ky_goi_tap ADD COLUMN ly_do_huy TEXT;`); } catch (_) {}
try { db.exec(`ALTER TABLE dang_ky_goi_tap ADD COLUMN so_tien_hoan REAL DEFAULT 0;`); } catch (_) {}
try { db.exec(`ALTER TABLE dang_ky_goi_tap ADD COLUMN ngay_huy DATETIME;`); } catch (_) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS danh_gia_pt (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    lich_tap_id     INTEGER NOT NULL REFERENCES lich_tap(id) ON DELETE CASCADE,
    pt_id           INTEGER NOT NULL REFERENCES ho_so(id),
    hoi_vien_id     INTEGER NOT NULL REFERENCES ho_so(id),
    so_sao          INTEGER NOT NULL CHECK (so_sao BETWEEN 1 AND 5),
    tieu_chi_json   TEXT,
    tag_json        TEXT,
    noi_dung        TEXT,
    nguoi_tao_id    INTEGER REFERENCES tai_khoan(id),
    nguoi_cap_nhat_id INTEGER REFERENCES tai_khoan(id),
    ngay_tao        DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    ngay_cap_nhat   DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(lich_tap_id, hoi_vien_id)
  );
  CREATE INDEX IF NOT EXISTS idx_dgpt_pt ON danh_gia_pt(pt_id);
  CREATE INDEX IF NOT EXISTS idx_dgpt_lich_tap ON danh_gia_pt(lich_tap_id);
`);

db.exec(`
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
  CREATE INDEX IF NOT EXISTS idx_pttoi_pair ON pt_toi_nhat_ky(hoi_vien_id, pt_id, ngay_tao);
  CREATE INDEX IF NOT EXISTS idx_pttoi_pt ON pt_toi_nhat_ky(pt_id, ngay_tao);
`);

// ── Sửa lỗi View bị hỏng sau khi migrate (SQLite tự động đổi tên ref sang _old) ──
const checkView = db.prepare("SELECT sql FROM sqlite_master WHERE type='view' AND name='v_trang_thai_hoi_vien'").get();
if (checkView && checkView.sql.includes('dang_ky_goi_tap_old')) {
  console.log('[DB] 🛠️ Phát hiện View v_trang_thai_hoi_vien bị hỏng (ref sang _old), đang tái tạo...');
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
  console.log('[DB] ✅ Tái tạo View v_trang_thai_hoi_vien thành công.');
}

// ── Migration v8: Tạo bảng noi_quy (nội quy phòng tập) ───────────────────────
db.exec(`
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
`);

// Seed nội quy mẫu nếu bảng trống
const soNoiQuy = db.prepare(`SELECT COUNT(*) as cnt FROM noi_quy`).get()?.cnt ?? 0;
if (soNoiQuy === 0) {
  const insNQ = db.prepare(`INSERT INTO noi_quy (tieu_de, noi_dung, thu_tu, ap_dung_cho) VALUES (?, ?, ?, ?)`);
  db.transaction(() => {
    insNQ.run('Giờ hoạt động', 'Phòng tập mở cửa từ 05:30 đến 22:00 các ngày trong tuần. Thứ 7 và Chủ nhật từ 06:00 đến 21:00.', 1, 'tat_ca');
    insNQ.run('Trang phục tập luyện', 'Hội viên phải mặc trang phục thể thao phù hợp: áo có cổ hoặc áo thể thao, quần short/quần dài thể thao. Không mặc jeans, dép lê khi tập.', 2, 'hoi_vien');
    insNQ.run('Vệ sinh thiết bị', 'Lau sạch thiết bị sau khi sử dụng. Đặt tạ và dụng cụ về đúng vị trí sau khi dùng xong.', 3, 'tat_ca');
    insNQ.run('Điện thoại và tiếng ồn', 'Hạn chế nghe điện thoại trong phòng tập. Không phát nhạc lớn khi không có tai nghe.', 4, 'tat_ca');
    insNQ.run('Quy định về thẻ thành viên', 'Thẻ thành viên chỉ dành cho cá nhân đã đăng ký. Không được cho mượn, chuyển nhượng thẻ cho người khác.', 5, 'hoi_vien');
    insNQ.run('Trách nhiệm của PT', 'PT có trách nhiệm hướng dẫn đúng kỹ thuật, đảm bảo an toàn cho học viên. Phải có mặt đúng giờ và thông báo khi cần hủy lịch trước ít nhất 2 tiếng.', 6, 'pt');
    insNQ.run('Quy định thanh toán', 'Phí tập phải được thanh toán đầy đủ trước khi bắt đầu sử dụng dịch vụ. Không hoàn tiền đối với gói tập đã kích hoạt, trừ trường hợp đặc biệt do ban quản lý xét duyệt.', 7, 'hoi_vien');
    insNQ.run('An toàn và bảo mật', 'Phòng tập không chịu trách nhiệm về mất mát tài sản cá nhân. Hội viên tự bảo quản đồ dùng cá nhân trong tủ khóa được cung cấp.', 8, 'tat_ca');
  })();
  console.log('[DB] ✅ Seed nội quy mẫu hoàn thành (8 quy tắc).');
}

// ── Migration v9: Tạo bảng yeu_cau_goi_tap (HV yêu cầu tạm dừng / gia hạn) ─────
db.exec(`
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

// ── Migration v10: Sửa Trigger doanh thu — hỗ trợ duyệt từ App & trừ khi hủy ─────
const migratedV10 = db.prepare(`SELECT gia_tri FROM cau_hinh WHERE khoa = 'db_migration_triggers_revenue_v10'`).get();
if (!migratedV10) {
  db.exec(`DROP TRIGGER IF EXISTS trg_doanh_thu_goi_tap;`);
  db.exec(`DROP TRIGGER IF EXISTS trg_doanh_thu_goi_pt;`);
  db.exec(`DROP TRIGGER IF EXISTS trg_doanh_thu_goi_tap_update;`);
  db.exec(`DROP TRIGGER IF EXISTS trg_doanh_thu_goi_pt_update;`);

  // Trigger INSERT: chỉ cộng doanh thu khi đăng ký thẳng (không qua phê duyệt)
  db.exec(`
    CREATE TRIGGER trg_doanh_thu_goi_tap
    AFTER INSERT ON dang_ky_goi_tap
    WHEN NEW.trang_thai IN ('dang_hoat_dong', 'het_han')
    BEGIN
      INSERT INTO doanh_thu (ngay, tong_tien, tong_don, tien_goi_tap, tien_goi_pt)
      VALUES (date('now','localtime'), NEW.gia_thuc_te, 1, NEW.gia_thuc_te, 0)
      ON CONFLICT(ngay) DO UPDATE SET
        tong_tien    = tong_tien + NEW.gia_thuc_te,
        tong_don     = tong_don + 1,
        tien_goi_tap = tien_goi_tap + NEW.gia_thuc_te,
        ngay_cap_nhat = datetime('now','localtime');
    END;
  `);
  db.exec(`
    CREATE TRIGGER trg_doanh_thu_goi_pt
    AFTER INSERT ON dang_ky_pt
    WHEN NEW.trang_thai IN ('dang_hoat_dong', 'hoan_thanh')
    BEGIN
      INSERT INTO doanh_thu (ngay, tong_tien, tong_don, tien_goi_tap, tien_goi_pt)
      VALUES (date('now','localtime'), NEW.gia_thuc_te, 1, 0, NEW.gia_thuc_te)
      ON CONFLICT(ngay) DO UPDATE SET
        tong_tien   = tong_tien + NEW.gia_thuc_te,
        tong_don    = tong_don + 1,
        tien_goi_pt = tien_goi_pt + NEW.gia_thuc_te,
        ngay_cap_nhat = datetime('now','localtime');
    END;
  `);

  // Trigger UPDATE goi_tap: cộng khi duyệt, trừ khi hủy
  db.exec(`
    CREATE TRIGGER trg_doanh_thu_goi_tap_update
    AFTER UPDATE OF trang_thai ON dang_ky_goi_tap
    BEGIN
      INSERT INTO doanh_thu (ngay, tong_tien, tong_don, tien_goi_tap, tien_goi_pt)
      SELECT date('now','localtime'), NEW.gia_thuc_te, 1, NEW.gia_thuc_te, 0
      WHERE NEW.trang_thai IN ('dang_hoat_dong', 'het_han')
        AND OLD.trang_thai NOT IN ('dang_hoat_dong', 'het_han')
      ON CONFLICT(ngay) DO UPDATE SET
        tong_tien    = tong_tien + NEW.gia_thuc_te,
        tong_don     = tong_don + 1,
        tien_goi_tap = tien_goi_tap + NEW.gia_thuc_te,
        ngay_cap_nhat = datetime('now','localtime');

      UPDATE doanh_thu SET
        tong_tien    = MAX(0, tong_tien - OLD.gia_thuc_te),
        tong_don     = MAX(0, tong_don - 1),
        tien_goi_tap = MAX(0, tien_goi_tap - OLD.gia_thuc_te),
        ngay_cap_nhat = datetime('now','localtime')
      WHERE ngay = date(OLD.ngay_tao)
        AND OLD.trang_thai IN ('dang_hoat_dong', 'het_han')
        AND NEW.trang_thai NOT IN ('dang_hoat_dong', 'het_han');
    END;
  `);

  // Trigger UPDATE goi_pt: cộng khi duyệt, trừ khi hủy
  db.exec(`
    CREATE TRIGGER trg_doanh_thu_goi_pt_update
    AFTER UPDATE OF trang_thai ON dang_ky_pt
    BEGIN
      INSERT INTO doanh_thu (ngay, tong_tien, tong_don, tien_goi_tap, tien_goi_pt)
      SELECT date('now','localtime'), NEW.gia_thuc_te, 1, 0, NEW.gia_thuc_te
      WHERE NEW.trang_thai IN ('dang_hoat_dong', 'hoan_thanh')
        AND OLD.trang_thai NOT IN ('dang_hoat_dong', 'hoan_thanh')
      ON CONFLICT(ngay) DO UPDATE SET
        tong_tien   = tong_tien + NEW.gia_thuc_te,
        tong_don    = tong_don + 1,
        tien_goi_pt = tien_goi_pt + NEW.gia_thuc_te,
        ngay_cap_nhat = datetime('now','localtime');

      UPDATE doanh_thu SET
        tong_tien   = MAX(0, tong_tien - OLD.gia_thuc_te),
        tong_don    = MAX(0, tong_don - 1),
        tien_goi_pt = MAX(0, tien_goi_pt - OLD.gia_thuc_te),
        ngay_cap_nhat = datetime('now','localtime')
      WHERE ngay = date(OLD.ngay_tao)
        AND OLD.trang_thai IN ('dang_hoat_dong', 'hoan_thanh')
        AND NEW.trang_thai NOT IN ('dang_hoat_dong', 'hoan_thanh');
    END;
  `);

  db.prepare(`INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, mo_ta) VALUES ('db_migration_triggers_revenue_v10', '1', 'Sửa 4 triggers doanh thu: hỗ trợ duyệt từ App và trừ khi hủy gói')`).run();
  console.log('[DB] ✅ Migration triggers doanh thu v10 hoàn thành.');
}

// ── Migration v11: Thêm cột cho thanh toán PayOS và Chi nhánh mua ─────
const migratedV11 = db.prepare(`SELECT gia_tri FROM cau_hinh WHERE khoa = 'db_migration_payos_v11'`).get();
if (!migratedV11) {
  try {
    db.exec(`ALTER TABLE dang_ky_goi_tap ADD COLUMN payos_order_code INTEGER;`);
  } catch (e) {
    console.log('[DB] payos_order_code already exists or error:', e.message);
  }
  try {
    db.exec(`ALTER TABLE dang_ky_goi_tap ADD COLUMN payos_status TEXT DEFAULT 'PENDING';`);
  } catch (e) {
    console.log('[DB] payos_status already exists or error:', e.message);
  }
  try {
    db.exec(`ALTER TABLE dang_ky_goi_tap ADD COLUMN chi_nhanh_mua TEXT;`);
  } catch (e) {
    console.log('[DB] chi_nhanh_mua already exists or error:', e.message);
  }
  db.prepare(`INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, mo_ta) VALUES ('db_migration_payos_v11', '1', 'Thêm cột PayOS order code, status và chi nhánh mua vào dang_ky_goi_tap')`).run();
  console.log('[DB] ✅ Migration v11 hoàn thành.');
}

export default db;
