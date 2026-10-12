import { Router } from 'express';
import { requireLogin, requireAdmin } from '../middleware/auth';
import {
  getHotels, getHotelById, createNewHotel,
  updateHotelDetails, updateRoomDetails, deleteHotelById,
} from '../controllers/hotelController';

const router = Router();

// Anyone can read
router.get('/', getHotels);
router.get('/:id', getHotelById);

// Only logged-in admins can change things
router.post('/', requireLogin, requireAdmin, createNewHotel);
router.put('/rooms/:id', requireLogin, requireAdmin, updateRoomDetails);
router.put('/:id', requireLogin, requireAdmin, updateHotelDetails);
router.delete('/:id', requireLogin, requireAdmin, deleteHotelById);

export default router;