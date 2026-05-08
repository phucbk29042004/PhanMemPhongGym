/**
 * Routes cho Đăng Ký PT
 * Base: /api/pt/registrations
 */

import { Router } from 'express';
import {
  getRegistrations, getRegistrationById,
  createRegistration, updateRegistration, cancelRegistration,
} from '../controllers/pt-registrations.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

router.get('/',    requireRole('admin', 'le_tan', 'pt'), getRegistrations);
router.get('/:id', requireRole('admin', 'le_tan', 'pt'), getRegistrationById);
router.post('/',   requireRole('admin', 'le_tan'), createRegistration);
router.put('/:id', requireRole('admin', 'le_tan'), updateRegistration);
router.put('/:id/cancel', requireRole('admin', 'le_tan'), cancelRegistration);

export default router;
