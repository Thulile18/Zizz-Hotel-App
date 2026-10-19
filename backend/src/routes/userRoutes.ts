import { Router } from 'express';
import { requireLogin } from '../middleware/auth';
import { getMe, updateMe, exportMe, deleteMe } from '../controllers/userController';

const router = Router();

// All of these need a logged-in user
router.use(requireLogin);

router.get('/me', getMe);
router.put('/me', updateMe);
router.get('/me/export', exportMe);
router.delete('/me', deleteMe);

export default router;