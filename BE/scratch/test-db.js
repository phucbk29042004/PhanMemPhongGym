import db from '../src/config/db.js';

try {
  const users = db.prepare('SELECT id, ten_dang_nhap, vai_tro_id FROM tai_khoan').all();
  console.log('TAI KHOAN:', users);
  
  const hoSo = db.prepare('SELECT id, ho_ten, tai_khoan_id, loai_ho_so FROM ho_so').all();
  console.log('HO SO:', hoSo);
  
  const goiTap = db.prepare('SELECT id, ten_goi, gia FROM goi_tap').all();
  console.log('GOI TAP:', goiTap);
} catch (e) {
  console.error(e);
}
