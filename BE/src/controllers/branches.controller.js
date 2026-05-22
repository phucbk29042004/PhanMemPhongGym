import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Đọc dữ liệu chi nhánh từ file JSON dùng chung
const BRANCHES_PATH = path.join(__dirname, '../../../FE/assets/data/branches.json');

let _branchesCache = null;

function getBranches() {
  if (!_branchesCache) {
    try {
      const raw = readFileSync(BRANCHES_PATH, 'utf-8');
      _branchesCache = JSON.parse(raw);
    } catch (err) {
      console.error('[branches] Không đọc được branches.json:', err.message);
      _branchesCache = [];
    }
  }
  return _branchesCache;
}

// GET /api/branches — trả về danh sách chi nhánh (công khai, không cần auth)
export const listBranches = (req, res) => {
  const branches = getBranches();
  return res.json({ success: true, data: branches });
};
