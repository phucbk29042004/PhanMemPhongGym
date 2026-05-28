import Database from 'better-sqlite3';
const db = new Database('./database/paradise_gym.db');
console.log('--- Columns in ho_so table ---');
const info = db.prepare('PRAGMA table_info(ho_so)').all();
console.log(info);
db.close();
