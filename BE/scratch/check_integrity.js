import Database from 'better-sqlite3';
try {
  const db = new Database('c:/PhanMemPhongGym/BE/database/paradise_gym.db');
  const res = db.prepare("PRAGMA integrity_check").get();
  console.log("INTEGRITY RESULT:", res);
} catch (e) {
  console.error("FAILED TO OPEN OR CHECK:", e);
}
