import { Router } from 'express';
import { requireLogin } from '../middleware/auth';
import { postReview } from '../controllers/reviewController';

const router = Router();

// Writing a review needs a logged-in guest
router.put('/:hotelId', requireLogin, postReview);

export default router;