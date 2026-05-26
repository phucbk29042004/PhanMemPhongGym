import { Router } from 'express';
import { getRevenue, getRevenueToday, getRevenueYesterday, getDashboard } from '../controllers/revenue.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken, requireRole('admin', 'le_tan'));

router.get('/dashboard', getDashboard);   // GET /api/revenue/dashboard
router.get('/today',     getRevenueToday); // GET /api/revenue/today
router.get('/yesterday', getRevenueYesterday); // GET /api/revenue/yesterday
router.get('/',          getRevenue);      // GET /api/revenue

export default router;
