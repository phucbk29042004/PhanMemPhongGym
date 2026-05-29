const Database = require('better-sqlite3');
const db = new Database('c:/PhanMemPhongGym/BE/database/paradise_gym.db');

try {
  const checkLichTap = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='lich_tap'").get();
  if (checkLichTap && checkLichTap.sql.includes('dang_ky_pt_old_v18')) {
    console.log('[DB] 🛠️ Sửa thủ công bảng lich_tap...');
    
    // Tắt foreign keys để sửa thoải mái
    db.pragma('foreign_keys = OFF');
    
    // Tránh việc đổi tên lich_tap làm thay đổi danh_gia_pt, ta lấy schema của danh_gia_pt
    const schemaDanhGiaPt = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='danh_gia_pt'").get();
    
    db.transaction(() => {
      // DROP broken views and triggers FIRST to prevent SQLite compilation errors
      db.exec(`DROP VIEW IF EXISTS v_lich_tap_hom_nay;`);
      db.exec(`DROP TRIGGER IF EXISTS trg_xac_nhan_buoi_tap;`);
      db.exec(`DROP TRIGGER IF EXISTS trg_chong_xoa_goi_pt;`);
      db.exec(`DROP VIEW IF EXISTS v_trang_thai_hoi_vien;`);

      // 1. Rename lich_tap
      db.exec(`ALTER TABLE lich_tap RENAME TO lich_tap_old_broken;`);
      
      // 2. Create correct lich_tap
      db.exec(`
        CREATE TABLE lich_tap (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          dang_ky_pt_id   INTEGER NOT NULL REFERENCES dang_ky_pt(id) ON DELETE CASCADE,
          pt_id           INTEGER NOT NULL REFERENCES ho_so(id),
          hoi_vien_id     INTEGER NOT NULL REFERENCES ho_so(id),
          ngay_tap        DATE    NOT NULL,
          gio_bat_dau     TIME    NOT NULL,
          gio_ket_thuc    TIME    NOT NULL,
          loai_buoi       TEXT    NOT NULL DEFAULT 'ca_nhan'
                                  CHECK (loai_buoi IN ('ca_nhan','nhom')),
          trang_thai      TEXT    NOT NULL DEFAULT 'cho_tap'
                                  CHECK (trang_thai IN ('cho_tap','da_tap','da_huy','vang')),
          confirmed_by_id INTEGER REFERENCES tai_khoan(id),
          ngay_xac_nhan   DATETIME,
          ly_do_huy       TEXT,
          nguoi_huy_id    INTEGER REFERENCES tai_khoan(id),
          ngay_huy        DATETIME,
          ghi_chu         TEXT,
          nguoi_tao_id    INTEGER REFERENCES tai_khoan(id),
          ngay_tao        DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
          ngay_cap_nhat   DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
          da_checkin      INTEGER NOT NULL DEFAULT 0 CHECK (da_checkin IN (0,1)),
          pt_xac_nhan     INTEGER NOT NULL DEFAULT 0,
          hv_xac_nhan     INTEGER NOT NULL DEFAULT 0,
          CHECK (gio_ket_thuc > gio_bat_dau),
          CHECK (pt_id != hoi_vien_id)
        );
      `);
      
      db.exec(`INSERT INTO lich_tap SELECT * FROM lich_tap_old_broken;`);
      db.exec(`DROP TABLE lich_tap_old_broken;`);

      // 3. Sửa danh_gia_pt bị kéo theo do RENAME lich_tap
      if (schemaDanhGiaPt) {
         db.exec(`ALTER TABLE danh_gia_pt RENAME TO danh_gia_pt_old_broken;`);
         db.exec(`
            CREATE TABLE danh_gia_pt (
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
         `);
         db.exec(`INSERT INTO danh_gia_pt SELECT * FROM danh_gia_pt_old_broken;`);
         db.exec(`DROP TABLE danh_gia_pt_old_broken;`);
         
         db.exec(`CREATE INDEX IF NOT EXISTS idx_dgpt_pt ON danh_gia_pt(pt_id);`);
         db.exec(`CREATE INDEX IF NOT EXISTS idx_dgpt_lich_tap ON danh_gia_pt(lich_tap_id);`);
      }

      // 4. Sửa view v_lich_tap_hom_nay
      db.exec(`DROP VIEW IF EXISTS v_lich_tap_hom_nay;`);
      db.exec(`
        CREATE VIEW v_lich_tap_hom_nay AS
        SELECT
            lt.id, lt.ngay_tap, lt.gio_bat_dau, lt.gio_ket_thuc, lt.loai_buoi, lt.trang_thai, lt.ghi_chu,
            hv.id AS hoi_vien_id, hv.ho_ten AS ten_hoi_vien, hv.avatar_url AS avatar_hoi_vien,
            pt.id AS pt_id, pt.ho_ten AS ten_pt, pt.avatar_url AS avatar_pt,
            (dk.so_buoi_dang_ky - dk.so_buoi_da_tap) AS buoi_con_lai
        FROM lich_tap lt
        JOIN ho_so hv ON hv.id = lt.hoi_vien_id
        JOIN ho_so pt ON pt.id = lt.pt_id
        JOIN dang_ky_pt dk ON dk.id = lt.dang_ky_pt_id
        WHERE lt.ngay_tap = date('now','localtime')
        ORDER BY lt.gio_bat_dau;
      `);

      // 5. Sửa trigger trg_xac_nhan_buoi_tap
      db.exec(`DROP TRIGGER IF EXISTS trg_xac_nhan_buoi_tap;`);
      db.exec(`
        CREATE TRIGGER trg_xac_nhan_buoi_tap
            AFTER UPDATE OF trang_thai ON lich_tap
            WHEN NEW.trang_thai = 'da_tap' AND OLD.trang_thai != 'da_tap' BEGIN
            UPDATE dang_ky_pt
            SET so_buoi_da_tap = so_buoi_da_tap + 1
            WHERE id = NEW.dang_ky_pt_id;

            UPDATE lich_tap
            SET ngay_xac_nhan = datetime('now','localtime')
            WHERE id = NEW.id;
        END;
      `);

      // 6. Sửa trigger trg_chong_xoa_goi_pt
      db.exec(`DROP TRIGGER IF EXISTS trg_chong_xoa_goi_pt;`);
      db.exec(`
        CREATE TRIGGER trg_chong_xoa_goi_pt
            BEFORE DELETE ON goi_pt BEGIN
            SELECT CASE
                WHEN EXISTS (SELECT 1 FROM dang_ky_pt WHERE goi_pt_id = OLD.id)
                THEN RAISE(ABORT, 'KHÔNG THỂ XÓA: Gói PT đã có người đăng ký. Hãy dùng Soft Delete (is_deleted=1).')
            END;
        END;
      `);
      
      // 7. Sửa v_trang_thai_hoi_vien
      db.exec(`DROP VIEW IF EXISTS v_trang_thai_hoi_vien;`);
      db.exec(`
        CREATE VIEW v_trang_thai_hoi_vien AS
        SELECT
            h.id, h.ma_ho_so, h.ho_ten, h.so_dien_thoai, h.email, h.avatar_url, h.is_deleted,
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
            (SELECT COUNT(*) FROM dang_ky_pt dp WHERE dp.hoi_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS so_goi_pt_dang_tap,
            (SELECT COUNT(*) FROM dang_ky_goi_tap dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong') AS so_goi_tap_hien_tai
        FROM ho_so h
        WHERE h.loai_ho_so = 'hoi_vien'
          AND h.is_deleted = 0
      `);
    })();
    db.pragma('foreign_keys = ON');
    console.log('[DB] ✅ Done fix dang_ky_pt_old_v18.');
  } else {
    console.log('No broken references found.');
  }
} catch (err) {
  console.error('[DB] ❌ Lỗi:', err);
}
