import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../database/paradise_gym.db'));

console.log('--- Checking table columns for dang_ky_goi_tap ---');
const tableInfo = db.prepare('PRAGMA table_info(dang_ky_goi_tap)').all();
const cols = tableInfo.map(c => `${c.name} (${c.type})`);
console.log(cols.join(', '));

// Verify if the PayOS columns exist
const hasPayosOrderCode = tableInfo.some(c => c.name === 'payos_order_code');
const hasPayosStatus = tableInfo.some(c => c.name === 'payos_status');
const hasChiNhanhMua = tableInfo.some(c => c.name === 'chi_nhanh_mua');

if (hasPayosOrderCode && hasPayosStatus && hasChiNhanhMua) {
  console.log('✅ PayOS and Branch columns exist in dang_ky_goi_tap!');
} else {
  console.error('❌ Missing columns in dang_ky_goi_tap!');
}

console.log('\n--- Checking if there are any active package records to test sequential activation ---');
const activePackages = db.prepare(`
  SELECT id, ho_so_id, tu_ngay, den_ngay, trang_thai
  FROM dang_ky_goi_tap
  WHERE trang_thai = 'dang_hoat_dong'
  LIMIT 5
`).all();
console.log('Active packages in DB:', activePackages);

// Let\'s find a member who has an active package
const testMember = db.prepare(`
  SELECT h.id, h.ho_ten, dk.den_ngay
  FROM ho_so h
  JOIN dang_ky_goi_tap dk ON dk.ho_so_id = h.id
  WHERE h.loai_ho_so = 'hoi_vien' AND dk.trang_thai = 'dang_hoat_dong'
  ORDER BY dk.den_ngay DESC LIMIT 1
`).get();

if (testMember) {
  console.log(`\nTest Member Found: ID=${testMember.id}, Name=${testMember.ho_ten}, Active package ends on: ${testMember.den_ngay}`);
  
  // Calculate next start date (den_ngay + 1 day)
  const nextStart = db.prepare("SELECT date(?, '+1 day') AS next_day").get(testMember.den_ngay).next_day;
  console.log(`Calculated sequential start date should be: ${nextStart}`);
  
  // We can insert a mock future package in 'cho_duyet' with status PAID to test cron job activation
  // Let\'s use a mock goi_tap
  const goiTap = db.prepare('SELECT id, ten_goi, gia FROM goi_tap WHERE is_deleted = 0 LIMIT 1').get();
  if (goiTap) {
    console.log(`Using mock package: ${goiTap.ten_goi} (ID: ${goiTap.id})`);
    
    // Begin transaction
    db.transaction(() => {
      // Insert mock future paid package
      const res = db.prepare(`
        INSERT INTO dang_ky_goi_tap
        (ho_so_id, goi_tap_id, tu_ngay, den_ngay, gia_thuc_te, trang_thai, phuong_thuc_tt, payos_status, chi_nhanh_mua, ghi_chu_gia)
        VALUES (?, ?, ?, date(?, '+1 month'), ?, 'cho_duyet', 'chuyen_khoan', 'PAID', 'Chi nhánh Gò Vấp', 'Test future package auto-activation')
      `).run(testMember.id, goiTap.id, nextStart, nextStart, goiTap.gia);
      
      const mockId = res.lastInsertRowid;
      console.log(`Inserted mock package ID: ${mockId} with tu_ngay: ${nextStart}, payos_status: PAID, trang_thai: cho_duyet`);
      
      // Let\'s test if getPackageRequests properly EXCLUDES this paid package
      const requests = db.prepare(`
        SELECT id, payos_status, trang_thai
        FROM dang_ky_goi_tap
        WHERE trang_thai = 'cho_duyet'
          AND (payos_status IS NULL OR payos_status = 'PENDING')
          AND ngay_thanh_toan IS NULL
      `).all();
      
      const isExcluded = !requests.some(r => r.id === mockId);
      console.log(`Is the PAID future package excluded from receptionist requests? ${isExcluded ? '✅ YES' : '❌ NO'}`);
      
      // Let\'s test the cron job activation logic.
      // We will temporarily update the tu_ngay of this mock package to today or yesterday, and see if the daily cron query picks it up.
      db.prepare(`
        UPDATE dang_ky_goi_tap
        SET tu_ngay = date('now', 'localtime')
        WHERE id = ?
      `).run(mockId);
      
      // Query like in cron-daily:
      const newlyActivated = db.prepare(`
        SELECT dk.id, dk.ho_so_id, gt.ten_goi, h.ho_ten
        FROM dang_ky_goi_tap dk
        JOIN ho_so h ON h.id = dk.ho_so_id
        JOIN goi_tap gt ON gt.id = dk.goi_tap_id
        WHERE dk.trang_thai = 'cho_duyet'
          AND (dk.payos_status = 'PAID' OR (dk.phuong_thuc_tt IS NOT NULL AND dk.ngay_thanh_toan IS NOT NULL))
          AND dk.tu_ngay <= date('now','localtime')
      `).all();
      
      console.log('Cron daily query found newly activated packages:', newlyActivated);
      const foundMock = newlyActivated.some(row => row.id === mockId);
      console.log(`Did the cron query find our mock package? ${foundMock ? '✅ YES' : '❌ NO'}`);
      
      if (foundMock) {
        // Run update like in cron-daily:
        db.prepare(`
          UPDATE dang_ky_goi_tap
          SET trang_thai = 'dang_hoat_dong'
          WHERE id = ?
        `).run(mockId);
        
        const updatedPackage = db.prepare('SELECT trang_thai FROM dang_ky_goi_tap WHERE id = ?').get(mockId);
        console.log(`Updated status after cron: ${updatedPackage.trang_thai} (Expected: dang_hoat_dong) -> ${updatedPackage.trang_thai === 'dang_hoat_dong' ? '✅ SUCCESS' : '❌ FAILED'}`);
      }
      
      // Rollback to keep database clean
      throw new Error('ROLLBACK');
    })();
  }
} else {
  console.log('No test member with active packages found in the DB. Skip sequential registration test.');
}

db.close();
