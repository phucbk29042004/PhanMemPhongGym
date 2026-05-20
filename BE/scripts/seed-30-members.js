import db from '../src/config/db.js';
import bcrypt from 'bcryptjs';

const seedMembers = async () => {
  console.log('Bắt đầu sinh 30 hội viên mẫu...');

  try {
    const admin = db.prepare("SELECT id FROM tai_khoan WHERE ten_dang_nhap = 'admin' LIMIT 1").get();
    const adminId = admin ? admin.id : 1;

    const goiTap = db.prepare("SELECT * FROM goi_tap WHERE is_deleted = 0 LIMIT 1").get();
    if (!goiTap) {
      console.log('Vui lòng tạo ít nhất 1 gói tập trong hệ thống trước khi seed hội viên.');
      process.exit(1);
    }

    const matKhauHash = bcrypt.hashSync('123456', 10);
    const today = new Date();
    const tuNgay = today.toISOString().split('T')[0];
    const denNgayStr = db.prepare(`SELECT date(?, '+' || ? || ' months', '+' || ? || ' days') AS den_ngay`)
      .get(tuNgay, goiTap.so_thang || 1, goiTap.so_ngay_them || 0).den_ngay;

    const vaiTro = db.prepare("SELECT id FROM vai_tro WHERE ma_vai_tro = 'hoi_vien' LIMIT 1").get();
    const vaiTroId = vaiTro ? vaiTro.id : 4; // Mặc định 4 là hội viên nếu không tìm thấy

    const insertTaiKhoan = db.prepare(`
      INSERT INTO tai_khoan (ten_dang_nhap, mat_khau_hash, vai_tro_id, trang_thai, nguoi_tao_id)
      VALUES (?, ?, ?, 'hoat_dong', ?)
    `);

    const insertHoSo = db.prepare(`
      INSERT INTO ho_so (tai_khoan_id, ma_ho_so, loai_ho_so, ho_ten, so_dien_thoai, nguoi_tao_id)
      VALUES (?, ?, 'hoi_vien', ?, ?, ?)
    `);

    const insertDangKy = db.prepare(`
      INSERT INTO dang_ky_goi_tap
        (ho_so_id, goi_tap_id, tu_ngay, den_ngay, gia_thuc_te, phuong_thuc_tt, nguoi_thu_id, trang_thai, nguoi_tao_id, nguoi_cap_nhat_id, ngay_thanh_toan)
      VALUES (?, ?, ?, ?, ?, 'tien_mat', ?, 'dang_hoat_dong', ?, ?, ?)
    `);

    let lastHoSo = db.prepare(`SELECT ma_ho_so FROM ho_so WHERE loai_ho_so = 'hoi_vien' ORDER BY id DESC LIMIT 1`).get();
    let nextNum = 1;
    if (lastHoSo && lastHoSo.ma_ho_so) {
      const match = lastHoSo.ma_ho_so.match(/\d+/);
      if (match) nextNum = parseInt(match[0]) + 1;
    }

    const tx = db.transaction(() => {
      for (let i = 0; i < 30; i++) {
        const index = String(nextNum + i).padStart(3, '0');
        const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
        const name = `Hội Viên Test ${index}`;
        const maHoSo = `HV${index}`;

        // 1. Tạo tài khoản
        const tkRes = insertTaiKhoan.run(phone, matKhauHash, vaiTroId, adminId);
        const taiKhoanId = tkRes.lastInsertRowid;

        // 2. Tạo hồ sơ
        const hsRes = insertHoSo.run(taiKhoanId, maHoSo, name, phone, adminId);
        const hoSoId = hsRes.lastInsertRowid;

        // 3. Đăng ký gói tập
        insertDangKy.run(hoSoId, goiTap.id, tuNgay, denNgayStr, goiTap.gia, adminId, adminId, adminId, tuNgay);
      }
    });

    tx();
    console.log('✅ Đã tạo thành công 30 hội viên với gói tập và tài khoản đăng nhập (SĐT / 123456).');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình seed:', error);
  }
};

seedMembers();
