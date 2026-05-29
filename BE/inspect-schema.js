import Database from 'better-sqlite3';
const db = new Database('./database/paradise_gym.db');
console.log('--- schema dang_ky_pt ---');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='dang_ky_pt'").get());
db.close();
