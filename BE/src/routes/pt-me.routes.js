import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import { getPTMeOverview, getPTMeThread, createPTMeEntry, updatePTMeEntry } from '../controllers/pt-me.controller.js';

const router = Router();
router.use(verifyToken);
router.use(requireRole('hoi_vien', 'pt'));

router.get('/overview', getPTMeOverview);
router.get('/thread', getPTMeThread);
router.post('/thread', createPTMeEntry);
router.put('/thread/:id', updatePTMeEntry);

export default router;
