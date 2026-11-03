import { Router } from 'express';
import { requireLogin, requireAdmin } from '../middleware/auth';
import { getOffersList, createNewOffer, deleteOfferById } from '../controllers/offerController';

const router = Router();

// Public: active promo offers for the homepage
router.get('/', getOffersList);

// Admin only: manage campaigns
router.post('/', requireLogin, requireAdmin, createNewOffer);
router.delete('/:id', requireLogin, requireAdmin, deleteOfferById);

export default router;