import Database from 'better-sqlite3';
const db = new Database('./database/paradise_gym.db');

console.log('--- VIEWS AND TRIGGERS IN DATABASE ---');
const objects = db.prepare("SELECT type, name, sql FROM sqlite_master WHERE sql LIKE '%dang_ky_goi_tap_old_v17%'").all();
console.log(objects);

db.close();
