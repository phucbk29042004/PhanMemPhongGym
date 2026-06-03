const Database = require('../BE/node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../BE/database/paradise_gym.db');
const db = new Database(dbPath);

console.log('inspecting dang_ky_goi_tap:');
try {
  const info = db.prepare("PRAGMA table_info(dang_ky_goi_tap)").all();
  console.log(info.map(c => `${c.name} (${c.type})`));
} catch (e) {
  console.error(e);
}

console.log('\ninspecting dang_ky_pt:');
try {
  const info = db.prepare("PRAGMA table_info(dang_ky_pt)").all();
  console.log(info.map(c => `${c.name} (${c.type})`));
} catch (e) {
  console.error(e);
}
