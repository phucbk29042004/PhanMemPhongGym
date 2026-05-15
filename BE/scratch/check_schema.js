import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../database/paradise_gym.db'));

const schema = db.prepare("SELECT sql FROM sqlite_master WHERE name='dang_ky_goi_tap'").get();
console.log(schema.sql);
