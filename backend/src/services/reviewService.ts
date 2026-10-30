import { z } from 'zod';
import { HttpError } from './hotelService';
import { hasConfirmedBooking, saveReview } from '../modals/reviewModal';

const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be 1 to 5').max(5, 'Rating must be 1 to 5'),
  comment: z.string().max(1000, 'Comment can be at most 1000 characters').optional(),
});

export async function reviewHotel(userId: number, hotelId: number, body: unknown) {
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

  if (!(await hasConfirmedBooking(userId, hotelId))) {
    throw new HttpError(403, 'Only guests who have completed a stay can review this hotel');
  }

  await saveReview(userId, hotelId, parsed.data.rating, parsed.data.comment || null);
}