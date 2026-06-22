import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Đường dẫn file JSON chi nhánh ở Backend (dùng cho Docker)
const BACKEND_BRANCHES_PATH = path.join(__dirname, '../data/branches.json');
// Đường dẫn file JSON dùng chung ở Frontend (fallback cho dev local thông thường)
const FRONTEND_BRANCHES_PATH = path.join(__dirname, '../../../FE/assets/data/branches.json');

let _branchesCache = null;

function getBranches() {
  if (!_branchesCache) {
    let pathToRead = BACKEND_BRANCHES_PATH;
    if (!existsSync(pathToRead)) {
      pathToRead = FRONTEND_BRANCHES_PATH;
    }
    try {
      const raw = readFileSync(pathToRead, 'utf-8');
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
