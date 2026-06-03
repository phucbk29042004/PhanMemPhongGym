import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  console.log('🚀 Đang khởi tạo dữ liệu test 1.000 hội viên...');

  const count = 1000;

  // 1. Tạo file Excel mẫu 1.000 dòng
  const headers = [['Họ và tên', 'Số điện thoại', 'Giới tính', 'Ngày sinh', 'Email', 'Địa chỉ', 'Ghi chú', 'Tên file ảnh']];
  const membersData = [];

  // Tạo số điện thoại bắt đầu từ 0900000001 đến 0900001000 để tránh trùng lặp số thật trong DB
  for (let i = 1; i <= count; i++) {
    const hoTen = `Hội Viên Test ${i}`;
    const soDienThoai = `090${String(i).padStart(7, '0')}`;
    const gioiTinh = i % 2 === 0 ? 'Nam' : 'Nữ';
    const ngaySinh = `199${i % 10}-05-15`;
    const email = `test.member.${i}@gmail.com`;
    const diaChi = `Quận ${1 + (i % 12)}, TP.HCM`;
    const ghiChu = `Hội viên nhập hàng loạt đợt lớn ${i}`;
    const tenFileAnh = `test_img_${i}.jpg`;
    
    membersData.push([hoTen, soDienThoai, gioiTinh, ngaySinh, email, diaChi, ghiChu, tenFileAnh]);
  }

  const ws = xlsx.utils.aoa_to_sheet([...headers, ...membersData]);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Danh sách 1000 hội viên');
  
  const excelPath = path.join(ROOT_DIR, 'test-import-1000.xlsx');
  xlsx.writeFile(wb, excelPath);
  console.log(`✅ Đã tạo file Excel test tại: ${excelPath}`);

  // 2. Tải 3 ảnh mẫu làm phông
  const sampleUrls = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=40', // Nữ
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=40', // Nam
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=40'  // Nam 2
  ];

  const zip = new AdmZip();

  console.log('⏳ Đang tải 3 ảnh mẫu làm phông nền...');
  try {
    const buffers = await Promise.all([
      downloadImage(sampleUrls[0]),
      downloadImage(sampleUrls[1]),
      downloadImage(sampleUrls[2])
    ]);
    console.log('   - Tải ảnh phông nền thành công.');

    console.log('⏳ Đang nhân bản 1.000 file ảnh vào bộ nhớ nén ZIP...');
    for (let i = 1; i <= count; i++) {
      const imgBuffer = buffers[(i - 1) % buffers.length];
      zip.addFile(`test_img_${i}.jpg`, imgBuffer);
    }

    const zipPath = path.join(ROOT_DIR, 'test-images-1000.zip');
    console.log('⏳ Đang nén và ghi file ZIP ra ổ đĩa (việc này có thể mất vài giây)...');
    zip.writeZip(zipPath);
    console.log(`✅ Đã tạo file ZIP ảnh test tại: ${zipPath}`);
    console.log('\n🎉 Khởi tạo dữ liệu test 1.000 hội viên hoàn tất!');
    console.log('👉 Bây giờ bạn có thể kéo thả 2 file "test-import-1000.xlsx" và "test-images-1000.zip" vào Modal Import để thử nghiệm!');
  } catch (err) {
    console.error('❌ Lỗi khi tải/nén file ZIP:', err.message);
  }
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
});
