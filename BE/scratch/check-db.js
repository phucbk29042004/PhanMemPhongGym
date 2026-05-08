import Database from 'better-sqlite3';
const db = new Database('database/paradise_gym.db');
const accounts = db.prepare('SELECT id, ten_dang_nhap, trang_thai FROM tai_khoan').all();
console.log(JSON.stringify(accounts, null, 2));
db.close();
