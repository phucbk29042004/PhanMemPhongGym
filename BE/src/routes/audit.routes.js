import { Router } from 'express';
import { getAuditLogs, getAuditActions } from '../controllers/audit.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/',        getAuditLogs);    // GET /api/audit
router.get('/actions', getAuditActions); // GET /api/audit/actions

export default router;
