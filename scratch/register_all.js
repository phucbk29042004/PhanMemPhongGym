const Database = require('../BE/node_modules/better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../BE/database/paradise_gym.db');
const db = new Database(dbPath);

console.log('Connecting to database at:', dbPath);

// 1. Đọc danh sách chi nhánh mẫu từ file branches.json
const branchesPath = path.resolve(__dirname, '../FE/assets/data/branches.json');
let branches = ['Chi nhánh Gò Vấp', 'Chi nhánh Bình Thạnh', 'Chi nhánh Tân Bình', 'Chi nhánh Phú Nhuận', 'Chi nhánh Quận 1', 'Chi nhánh Quận 3', 'Chi nhánh Quận 5', 'Chi nhánh Quận 7', 'Chi nhánh Quận 10', 'Chi nhánh Bình Tân', 'Chi nhánh Thủ Đức', 'Chi nhánh Nhà Bè'];

try {
  const branchesData = JSON.parse(fs.readFileSync(branchesPath, 'utf8'));
  branches = branchesData.map(b => b.ten);
  console.log(`Đã nạp ${branches.length} chi nhánh từ file branches.json`);
} catch (e) {
  console.log('Không thể đọc branches.json, sử dụng danh sách mặc định. Lỗi:', e.message);
}

// 2. Lấy một gói tập và một gói PT có sẵn
const goiTap = db.prepare("SELECT * FROM goi_tap WHERE is_deleted = 0 LIMIT 1").get();
const goiPT = db.prepare("SELECT * FROM goi_pt WHERE is_deleted = 0 LIMIT 1").get();
const ptUser = db.prepare("SELECT * FROM ho_so WHERE loai_ho_so = 'pt' AND is_deleted = 0 LIMIT 1").get();

if (!goiTap) {
  console.error('Không tìm thấy gói tập Gym nào trong hệ thống!');
  process.exit(1);
}
if (!goiPT) {
  console.error('Không tìm thấy gói PT nào trong hệ thống!');
  process.exit(1);
}
if (!ptUser) {
  console.error('Không tìm thấy huấn luyện viên (PT) nào trong hệ thống!');
  process.exit(1);
}

console.log(`Sử dụng gói Gym: ${goiTap.ten_goi} (ID: ${goiTap.id}, Giá: ${goiTap.gia})`);
console.log(`Sử dụng gói PT: ${goiPT.ten_goi} (ID: ${goiPT.id}, Giá: ${goiPT.gia})`);
console.log(`Sử dụng PT dạy: ${ptUser.ho_ten} (ID: ${ptUser.id})`);

// 3. Lấy danh sách hội viên
const members = db.prepare("SELECT * FROM ho_so WHERE loai_ho_so = 'hoi_vien' AND is_deleted = 0").all();
console.log(`Tổng số hội viên: ${members.length}`);

db.transaction(() => {
  let countGym = 0;
  let countPT = 0;
  let countBranch = 0;

  for (const m of members) {
    // Gán chi nhánh ngẫu nhiên nếu hội viên chưa có chi nhánh
    let branch = m.chi_nhanh;
    if (!branch) {
      branch = branches[Math.floor(Math.random() * branches.length)];
      db.prepare("UPDATE ho_so SET chi_nhanh = ? WHERE id = ?").run(branch, m.id);
      m.chi_nhanh = branch;
      countBranch++;
    }

    // Kiểm tra xem đã có gói Gym hoạt động chưa
    const hasGym = db.prepare(
      "SELECT 1 FROM dang_ky_goi_tap WHERE ho_so_id = ? AND trang_thai = 'dang_hoat_dong'"
    ).get(m.id);

    if (!hasGym) {
      // Đăng ký gói Gym 1 tháng (từ hôm nay đến 1 tháng sau)
      const today = new Date();
      const tu_ngay = today.toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
      today.setMonth(today.getMonth() + 1);
      const den_ngay = today.toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];

      db.prepare(`
        INSERT INTO dang_ky_goi_tap (
          ho_so_id, goi_tap_id, tu_ngay, den_ngay, gia_thuc_te, trang_thai, 
          phuong_thuc_tt, so_tien_da_thu, chi_nhanh_mua, ngay_tao
        ) VALUES (?, ?, ?, ?, ?, 'dang_hoat_dong', 'tien_mat', ?, ?, datetime('now', 'localtime'))
      `).run(m.id, goiTap.id, tu_ngay, den_ngay, goiTap.gia, goiTap.gia, branch);

      countGym++;
    }

    // Kiểm tra xem đã có gói PT hoạt động chưa
    const hasPT = db.prepare(
      "SELECT 1 FROM dang_ky_pt WHERE hoi_vien_id = ? AND trang_thai = 'dang_hoat_dong'"
    ).get(m.id);

    if (!hasPT) {
      // Đăng ký gói PT
      const today = new Date();
      const tu_ngay = today.toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
      today.setMonth(today.getMonth() + 1);
      const den_ngay = today.toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];

      db.prepare(`
        INSERT INTO dang_ky_pt (
          hoi_vien_id, goi_pt_id, pt_id, so_buoi_dang_ky, so_buoi_da_tap, tu_ngay, den_ngay, gia_thuc_te, 
          trang_thai, phuong_thuc_tt, chi_nhanh_dang_ky
        ) VALUES (?, ?, ?, 10, 0, ?, ?, ?, 'dang_hoat_dong', 'tien_mat', ?)
      `).run(m.id, goiPT.id, ptUser.id, tu_ngay, den_ngay, goiPT.gia, branch);

      countPT++;
    }
  }

  console.log(`Đã gán chi nhánh mới cho ${countBranch} hội viên.`);
  console.log(`Đã đăng ký gói Gym mới cho ${countGym} hội viên.`);
  console.log(`Đã đăng ký gói PT mới cho ${countPT} hội viên.`);
})();

db.close();
console.log('Done!');
