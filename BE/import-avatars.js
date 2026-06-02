/**
 * Script Tiện Ích — Import Ảnh Đại Diện Hàng Loạt cho Hội Viên
 * Luồng hoạt động:
 * 1. Đọc thư mục BE/temp_photos/ lấy danh sách file ảnh.
 * 2. Tên file ảnh (không bao gồm đuôi file) phải khớp với Số điện thoại của hội viên trong DB (Ví dụ: 0912345678.jpg).
 * 3. Tự động upload ảnh lên Cloudinary và cập nhật đường dẫn vào database SQLite.
 * 
 * Cách chạy:
 * Chạy lệnh sau tại thư mục BE:
 * node import-avatars.js
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './src/config/db.js';
import { uploadImage, deleteImage, isCloudinaryReady } from './src/utils/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thư mục chứa ảnh tạm
const PHOTOS_DIR = path.join(__dirname, 'temp_photos');

async function main() {
  console.log('🏁 Bắt đầu tiến trình import ảnh đại diện hàng loạt...');

  // 1. Kiểm tra cấu hình Cloudinary
  if (!isCloudinaryReady) {
    console.error('❌ Thất bại: Cloudinary chưa được cấu hình trong file .env.');
    console.error('Vui lòng kiểm tra các khoá CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
    process.exit(1);
  }

  // 2. Tạo thư mục tạm nếu chưa có
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
    console.log(`📁 Đã tạo thư mục trống tại: ${PHOTOS_DIR}`);
    console.log('👉 Vui lòng copy 500 ảnh của hội viên (đặt tên file là Số điện thoại, vd: 0912345678.jpg) vào thư mục này rồi chạy lại script.');
    return;
  }

  // 3. Đọc danh sách file
  const files = fs.readdirSync(PHOTOS_DIR);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const photoFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext);
  });

  if (photoFiles.length === 0) {
    console.log(`⚠️ Thư mục ${PHOTOS_DIR} đang trống hoặc không có file ảnh hợp lệ (${imageExtensions.join(', ')}).`);
    console.log('👉 Vui lòng đặt ảnh vào thư mục và chạy lại script.');
    return;
  }

  console.log(`🔍 Tìm thấy ${photoFiles.length} file ảnh. Đang tiến hành phân tích và đối chiếu...`);

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const filename of photoFiles) {
    const filePath = path.join(PHOTOS_DIR, filename);
    const phone = path.parse(filename).name.trim(); // Lấy tên file làm số điện thoại

    // Kiểm tra định dạng số điện thoại sơ bộ (chỉ chứa số, độ dài 9-11 ký tự)
    if (!/^[0-9]+$/.test(phone) || phone.length < 9 || phone.length > 11) {
      console.warn(`⚠️ Bỏ qua file "${filename}": Tên file không phải là số điện thoại hợp lệ.`);
      continue;
    }

    try {
      // Tìm hội viên tương ứng trong SQLite
      const member = db.prepare(`
        SELECT id, ho_ten, ma_ho_so, cloudinary_public_id, avatar_url 
        FROM ho_so 
        WHERE so_dien_thoai = ? AND is_deleted = 0
      `).get(phone);

      if (!member) {
        console.warn(`❌ Không tìm thấy hội viên nào có số điện thoại: ${phone} (File: ${filename})`);
        notFoundCount++;
        continue;
      }

      console.log(`📸 Đang xử lý: ${member.ho_ten} (${member.ma_ho_so}) | SĐT: ${phone} | File: ${filename}`);

      // Đọc file ảnh thành buffer
      const buffer = fs.readFileSync(filePath);

      // Xoá ảnh cũ trên Cloudinary nếu có để giải phóng dung lượng
      if (member.cloudinary_public_id) {
        console.log(`   - Đang xoá ảnh cũ: ${member.cloudinary_public_id}`);
        await deleteImage(member.cloudinary_public_id);
      }

      // Upload ảnh mới lên Cloudinary
      const uploadRes = await uploadImage(buffer, 'paradise-gym/profiles', member.ma_ho_so);

      // Cập nhật Database SQLite
      db.prepare(`
        UPDATE ho_so 
        SET avatar_url = ?, cloudinary_public_id = ? 
        WHERE id = ?
      `).run(uploadRes.url, uploadRes.publicId, member.id);

      console.log(`   ✅ Thành công! Link ảnh: ${uploadRes.url}`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Lỗi khi xử lý file ${filename}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n📊 ════════════ TỔNG KẾT TIẾN TRÌNH ════════════');
  console.log(`📈 Tổng số file ảnh tìm thấy:   ${photoFiles.length}`);
  console.log(`✅ Upload & Đồng bộ thành công: ${successCount}`);
  console.log(`🔍 Không tìm thấy hội viên:     ${notFoundCount}`);
  console.log(`❌ Gặp lỗi khi upload/lưu:      ${errorCount}`);
  console.log('═══════════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ Lỗi hệ thống khi chạy script:', err);
});
