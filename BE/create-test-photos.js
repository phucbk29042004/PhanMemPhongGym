import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PHOTOS_DIR = path.join(__dirname, 'temp_photos');

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
}

async function main() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  }

  // Lấy 3 hội viên có số điện thoại thực tế trong Database để test
  const members = db.prepare(`
    SELECT ho_ten, so_dien_thoai FROM ho_so 
    WHERE loai_ho_so = 'hoi_vien' AND is_deleted = 0 AND so_dien_thoai IS NOT NULL AND so_dien_thoai != ''
    LIMIT 3
  `).all();

  if (members.length === 0) {
    console.log('⚠️ Không tìm thấy hội viên nào có Số điện thoại trong Database để tạo ảnh mẫu.');
    console.log('👉 Vui lòng tạo ít nhất 1 hội viên trên giao diện web trước.');
    return;
  }

  // Các link ảnh chân dung mẫu miễn phí từ Unsplash
  const sampleUrls = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80', // Nam 1
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80', // Nữ 1
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=250&auto=format&fit=crop&q=80'  // Nam 2
  ];

  console.log(`🚀 Đang tự động chuẩn bị ảnh mẫu chân dung cho ${members.length} hội viên...`);

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const cleanPhone = m.so_dien_thoai.trim();
    const destPath = path.join(PHOTOS_DIR, `${cleanPhone}.jpg`);
    const url = sampleUrls[i % sampleUrls.length];

    console.log(`   - Đang tải ảnh mẫu cho hội viên "${m.ho_ten}" (SĐT: ${cleanPhone})`);
    try {
      await downloadImage(url, destPath);
      console.log(`     ✅ Đã tạo file: BE/temp_photos/${cleanPhone}.jpg`);
    } catch (err) {
      console.error(`     ❌ Lỗi tải ảnh mẫu: ${err.message}`);
    }
  }
  console.log('\n🎉 Đã chuẩn bị xong thư mục ảnh mẫu test tại: BE/temp_photos/');
  console.log('👉 Bây giờ bạn có thể mở Terminal chạy lệnh: node import-avatars.js để thử nghiệm!');
}

main().catch(err => {
  console.error('❌ Lỗi tiến trình:', err);
});
