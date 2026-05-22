import db from '../src/config/db.js';

try {
  const info = db.prepare('PRAGMA table_info(dang_ky_goi_tap)').all();
  console.log('TABLE INFO FOR dang_ky_goi_tap:');
  console.log(info.map(c => `${c.name}: ${c.type} (${c.notnull ? 'NOT NULL' : 'NULL'})` ).join('\n'));
} catch (e) {
  console.error(e);
}
