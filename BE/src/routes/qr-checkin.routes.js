/**
 * Routes QR Check-in
 * Base: /api/checkin
 */

import { Router } from 'express';
import { getMyQr, scanQr } from '../controllers/qr-checkin.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

// Hội viên và PT lấy QR của mình
router.get('/my-qr', requireRole('hoi_vien', 'pt'), getMyQr);

// Lễ tân / admin quét QR
router.post('/scan', requireRole('admin', 'le_tan'), scanQr);

export default router;
