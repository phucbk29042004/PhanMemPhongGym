import express from 'express';
import { listBranches } from '../controllers/branches.controller.js';

const router = express.Router();

// GET /api/branches — công khai, không cần auth
router.get('/', listBranches);

export default router;
