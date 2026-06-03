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
  console.log('🚀 Đang khởi tạo dữ liệu test...');

  // 1. Tạo file Excel mẫu
  const headers = [['Họ và tên', 'Số điện thoại', 'Giới tính', 'Ngày sinh', 'Email', 'Địa chỉ', 'Ghi chú', 'Tên file ảnh']];
  const membersData = [
    ['Nguyễn Thị Lan', '0981112222', 'Nữ', '1998-10-20', 'lan.nguyen@gmail.com', 'Quận 1, TP.HCM', 'Học viên gói Gym 1 tháng', 'lan_xinh.jpg'],
    ['Trần Văn Hùng', '0983334444', 'Nam', '1995-02-15', 'hung.tran@gmail.com', 'Quận 3, TP.HCM', 'Học viên VIP', 'hung_dung.jpg'],
    ['Lê Minh Quốc', '0985556666', 'Nam', '2000-08-05', 'quoc.le@gmail.com', 'Bình Thạnh, TP.HCM', 'Đăng ký gói PT', 'quoc_dep_trai.jpg']
  ];

  const ws = xlsx.utils.aoa_to_sheet([...headers, ...membersData]);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Danh sách hội viên');
  
  const excelPath = path.join(ROOT_DIR, 'test-import-hoi-vien.xlsx');
  xlsx.writeFile(wb, excelPath);
  console.log(`✅ Đã tạo file Excel test tại: ${excelPath}`);

  // 2. Tải ảnh mẫu và tạo file ZIP
  const sampleUrls = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60', // Nữ
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=60', // Nam
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60'  // Nam 2
  ];

  const zip = new AdmZip();

  console.log('⏳ Đang tải ảnh mẫu chân dung từ internet...');
  try {
    const img1 = await downloadImage(sampleUrls[0]);
    zip.addFile('lan_xinh.jpg', img1);
    console.log('   - Đã tải ảnh cho Lan');

    const img2 = await downloadImage(sampleUrls[1]);
    zip.addFile('hung_dung.jpg', img2);
    console.log('   - Đã tải ảnh cho Hùng');

    const img3 = await downloadImage(sampleUrls[2]);
    zip.addFile('quoc_dep_trai.jpg', img3);
    console.log('   - Đã tải ảnh cho Quốc');

    const zipPath = path.join(ROOT_DIR, 'test-images.zip');
    zip.writeZip(zipPath);
    console.log(`✅ Đã tạo file ZIP ảnh test tại: ${zipPath}`);
    console.log('\n🎉 Chuẩn bị dữ liệu test hoàn tất!');
    console.log('👉 Bạn có thể kéo thả 2 file này vào Modal Import trên Web để kiểm tra tính năng!');
  } catch (err) {
    console.error('❌ Lỗi khi tạo file ZIP:', err.message);
  }
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
});
