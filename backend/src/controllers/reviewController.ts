import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { HttpError } from '../services/hotelService';
import { reviewHotel } from '../services/reviewService';

// One place that turns any error into an answer for the website
function sendError(res: Response, err: unknown) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}

// Write or update my review of a hotel
export async function postReview(req: AuthRequest, res: Response) {
  try {
    const hotelId = Number(req.params.hotelId);
    if (!Number.isInteger(hotelId)) throw new HttpError(400, 'Invalid hotel id');

    await reviewHotel(req.user!.id, hotelId, req.body);
    res.status(204).send();
  } catch (err) {
    sendError(res, err);
  }
}