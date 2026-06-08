import { Router } from 'express';
import { getRevenue, getRevenueToday, getRevenueYesterday, getDashboard, getCompareMonths } from '../controllers/revenue.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken, requireRole('admin', 'nhan_vien'));

router.get('/dashboard', getDashboard);   // GET /api/revenue/dashboard
router.get('/today',     getRevenueToday); // GET /api/revenue/today
router.get('/yesterday', getRevenueYesterday); // GET /api/revenue/yesterday
router.get('/compare-months', getCompareMonths); // GET /api/revenue/compare-months
router.get('/',          getRevenue);      // GET /api/revenue

export default router;
