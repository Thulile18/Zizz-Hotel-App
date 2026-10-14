import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { HttpError } from '../services/hotelService';
import { myFavourites, saveFavourite, deleteFavourite } from '../services/favouriteService';

// Turns the :hotelId in the web address into a number, or throws a 400 error
function getHotelId(req: AuthRequest) {
  const id = Number(req.params.hotelId);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid hotel id');
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

// READ my favourites
export async function getFavourites(req: AuthRequest, res: Response) {
  try {
    res.json(await myFavourites(req.user!.id));
  } catch (err) {
    sendError(res, err);
  }
}

// SAVE a hotel as a favourite
export async function addToFavourites(req: AuthRequest, res: Response) {
  try {
    await saveFavourite(req.user!.id, getHotelId(req));
    res.status(204).send();
  } catch (err) {
    sendError(res, err);
  }
}

// REMOVE a favourite
export async function removeFromFavourites(req: AuthRequest, res: Response) {
  try {
    await deleteFavourite(req.user!.id, getHotelId(req));
    res.status(204).send();
  } catch (err) {
    sendError(res, err);
  }
}