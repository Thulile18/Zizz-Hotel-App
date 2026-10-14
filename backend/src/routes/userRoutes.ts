import { Router } from 'express';
import { requireLogin } from '../middleware/auth';
import { getMe, updateMe } from '../controllers/userController';

const router = Router();

// Both need a logged-in user
router.use(requireLogin);

router.get('/me', getMe);
router.put('/me', updateMe);

export default router;