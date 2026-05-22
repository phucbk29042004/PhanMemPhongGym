import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'database', 'paradise_gym.db');
const db = new Database(dbPath);

console.log('Database Path:', dbPath);

// Table info
const info = db.prepare("PRAGMA table_info(dang_ky_goi_tap)").all();
console.log('Table columns:');
info.forEach(col => {
  console.log(` - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : 'NULL'} DEFAULT ${col.dflt_value}`);
});

// Table SQL schema definition
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='dang_ky_goi_tap'").get();
console.log('\nTable SQL definition:\n', schema.sql);

// Check configuration table
try {
  const configs = db.prepare("SELECT * FROM cau_hinh").all();
  console.log('\nConfigurations:', configs);
} catch (e) {
  console.log('\nNo cau_hinh table or error:', e.message);
}
