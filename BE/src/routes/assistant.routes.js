import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { handleChat } from '../controllers/assistant.controller.js';

const router = Router();

router.use(verifyToken);

router.post('/chat', handleChat);

export default router;
