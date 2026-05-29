const Database = require('better-sqlite3');
const db = new Database('c:/PhanMemPhongGym/BE/database/paradise_gym.db');
const rows = db.prepare("SELECT name, type, sql FROM sqlite_master WHERE sql LIKE '%dang_ky_pt_old_v18%'").all();
console.log(JSON.stringify(rows, null, 2));
