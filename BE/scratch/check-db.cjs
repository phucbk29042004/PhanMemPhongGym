const Database = require('better-sqlite3');
const path = require('path');
const DB_PATH = path.join(__dirname, '../database/paradise_gym.db');
const db = new Database(DB_PATH);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

try {
    const config = db.prepare("SELECT * FROM cau_hinh WHERE khoa = 'db_migration_package_reg_v6'").get();
    console.log('Migration v6 config:', config);
} catch (e) {
    console.log('Error reading config:', e.message);
}

try {
    const columns = db.prepare("PRAGMA table_info(dang_ky_goi_tap)").all();
    console.log('Columns in dang_ky_goi_tap:', columns.map(c => c.name));
} catch (e) {
    console.log('Error reading dang_ky_goi_tap:', e.message);
}

db.close();
