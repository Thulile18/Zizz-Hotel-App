import { Router } from 'express';
import { requireLogin, requireAdmin } from '../middleware/auth';
import { getReservations, updateReservation, createPromotion } from '../controllers/adminController';

const router = Router();

// Everything here needs a logged-in admin: first the login check, then the admin check
router.use(requireLogin, requireAdmin);

router.get('/bookings', getReservations);
router.patch('/bookings/:id', updateReservation);
router.post('/promotions', createPromotion);

export default router;