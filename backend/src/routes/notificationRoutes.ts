import { Router } from 'express';
import { requireLogin } from '../middleware/auth';
import { getNotifications } from '../controllers/notificationController';

const router = Router();

// Notifications belong to one user, so you must be logged in
router.get('/', requireLogin, getNotifications);

export default router;