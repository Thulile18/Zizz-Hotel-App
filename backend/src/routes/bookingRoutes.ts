import { Router } from 'express';
import { requireLogin } from '../middleware/auth';
import {
  createNewBooking, confirmBooking, getMyBookings, cancelBooking,
} from '../controllers/bookingController';

const router = Router();

// Every booking action needs a logged-in guest
router.use(requireLogin);

router.post('/', createNewBooking);
router.get('/', getMyBookings);
router.post('/:id/confirm', confirmBooking);
router.delete('/:id', cancelBooking);

export default router;