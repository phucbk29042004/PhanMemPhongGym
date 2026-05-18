import { Router } from 'express';
import { exportMembers, exportRevenue, exportPTSchedules } from '../controllers/export.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);
router.use(requireRole('admin', 'le_tan'));

router.get('/members',      exportMembers);       // GET /api/export/members
router.get('/revenue',      requireRole('admin'), exportRevenue);       // GET /api/export/revenue
router.get('/pt-schedules', exportPTSchedules);   // GET /api/export/pt-schedules

export default router;
