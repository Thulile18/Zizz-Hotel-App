import { Router } from 'express';
import { requireLogin } from '../middleware/auth';
import {
  getFavourites, addToFavourites, removeFromFavourites,
} from '../controllers/favouriteController';

const router = Router();

// Every favourites action needs a logged-in guest
router.use(requireLogin);
router.get('/', getFavourites);
router.put('/:hotelId', addToFavourites);
router.delete('/:hotelId', removeFromFavourites);

export default router;