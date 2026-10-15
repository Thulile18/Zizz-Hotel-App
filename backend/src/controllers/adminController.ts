import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { HttpError } from '../services/hotelService';
import { allReservations, changeReservation, sendPromotion } from '../services/adminService';

// One place that turns any error into an answer for the website
function sendError(res: Response, err: unknown) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}

// READ every reservation
export async function getReservations(_req: AuthRequest, res: Response) {
  try {
    res.json(await allReservations());
  } catch (err) {
    sendError(res, err);
  }
}

// UPDATE a reservation (approve, cancel or move the dates)
export async function updateReservation(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid id');
    res.json(await changeReservation(id, req.body));
  } catch (err) {
    sendError(res, err);
  }
}

// CREATE a promotion for all guests
export async function createPromotion(req: AuthRequest, res: Response) {
  try {
    res.status(201).json(await sendPromotion(req.body));
  } catch (err) {
    sendError(res, err);
  }
}