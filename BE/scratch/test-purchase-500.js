import db from '../src/config/db.js';
import { requestPackageRenewal } from '../src/controllers/members.controller.js';

// Mock response object
const res = {
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.jsonData = data;
    console.log('Response Status:', this.statusCode || 200);
    console.log('Response Body:', JSON.stringify(data, null, 2));
    return this;
  }
};

async function test() {
  const userId = 58;
  const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(userId);
  if (hoSo) {
    console.log('Cleaning up pending requests for ho_so_id:', hoSo.id);
    db.prepare("DELETE FROM dang_ky_goi_tap WHERE ho_so_id = ?").run(hoSo.id);
  }

  const req = {
    user: { id: userId }, // tai_khoan_id = 58
    body: {
      goi_tap_id: 1,
      tu_ngay: '2026-05-22',
      phuong_thuc_tt: 'chuyen_khoan',
      chi_nhanh_mua: 'Chi nhánh Gò Vấp'
    }
  };

  console.log('Running test for requestPackageRenewal...');
  await requestPackageRenewal(req, res);
}

test().catch(console.error);
