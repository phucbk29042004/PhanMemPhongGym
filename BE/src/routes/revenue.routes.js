import { Router } from 'express';
import { getRevenue, getRevenueToday, getDashboard } from '../controllers/revenue.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken, requireRole('admin'));

router.get('/dashboard', getDashboard);   // GET /api/revenue/dashboard
router.get('/today',     getRevenueToday); // GET /api/revenue/today
router.get('/',          getRevenue);      // GET /api/revenue

export default router;
