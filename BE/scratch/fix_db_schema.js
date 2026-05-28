import Database from 'better-sqlite3';
const db = new Database('./database/paradise_gym.db');

try {
  console.log('Starting DB fix for yeu_cau_goi_tap...');
  db.transaction(() => {
    // 1. Rename the old table
    db.exec(`ALTER TABLE yeu_cau_goi_tap RENAME TO yeu_cau_goi_tap_old;`);

    // 2. Create new table referencing dang_ky_goi_tap
    db.exec(`
      CREATE TABLE yeu_cau_goi_tap (
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

    // 3. Copy data
    db.exec(`
      INSERT INTO yeu_cau_goi_tap (
        id, ho_so_id, dang_ky_id, loai_yeu_cau, ly_do, trang_thai,
        nguoi_duyet_id, ghi_chu_duyet, ngay_tao, ngay_duyet
      )
      SELECT 
        id, ho_so_id, dang_ky_id, loai_yeu_cau, ly_do, trang_thai,
        nguoi_duyet_id, ghi_chu_duyet, ngay_tao, ngay_duyet
      FROM yeu_cau_goi_tap_old;
    `);

    // 4. Drop the old table
    db.exec(`DROP TABLE yeu_cau_goi_tap_old;`);
  })();
  console.log('✅ DB fix for yeu_cau_goi_tap completed successfully!');
} catch (e) {
  console.error('❌ Error fixing DB:', e.message);
} finally {
  db.close();
}
