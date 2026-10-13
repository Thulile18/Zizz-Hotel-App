import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { HttpError } from '../services/hotelService';
import { bookRoom, confirmPayment, myBookings, cancelMyBooking } from '../services/bookingService';

// Turns the :id in the web address into a number, or throws a 400 error
function getId(req: AuthRequest) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid id');
  return id;
}

// One place that turns any error into an answer for the website
function sendError(res: Response, err: unknown) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}

// CREATE a booking and start the payment
export async function createNewBooking(req: AuthRequest, res: Response) {
  try {
    res.status(201).json(await bookRoom(req.user!.id, req.body));
  } catch (err) {
    sendError(res, err);
  }
}

// After paying: check with Stripe and confirm the booking
export async function confirmBooking(req: AuthRequest, res: Response) {
  try {
    res.json(await confirmPayment(req.user!.id, getId(req)));
  } catch (err) {
    sendError(res, err);
  }
}

// READ my own bookings
export async function getMyBookings(req: AuthRequest, res: Response) {
  try {
    res.json(await myBookings(req.user!.id));
  } catch (err) {
    sendError(res, err);
  }
}

// CANCEL one of my bookings
export async function cancelBooking(req: AuthRequest, res: Response) {
  try {
    await cancelMyBooking(req.user!.id, getId(req));
    res.status(204).send();
  } catch (err) {
    sendError(res, err);
  }
}