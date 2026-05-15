const Database = require('better-sqlite3');
const db = new Database('BE/gym_database.db');
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='dang_ky_goi_tap'").get();
console.log(schema.sql);
db.close();
