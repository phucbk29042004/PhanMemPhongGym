import { Router } from 'express';
import { getPackages, getPackageById, createPackage, updatePackage, deletePackage, getPTPackages } from '../controllers/packages.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

router.get('/pt', getPTPackages);                                      // GET /api/packages/pt
router.get('/',   getPackages);                                        // GET /api/packages
router.get('/:id', getPackageById);                                    // GET /api/packages/:id
router.post('/',   requireRole('admin'), createPackage);               // POST /api/packages
router.put('/:id', requireRole('admin'), updatePackage);               // PUT /api/packages/:id
router.delete('/:id', requireRole('admin'), deletePackage);            // DELETE /api/packages/:id

export default router;
