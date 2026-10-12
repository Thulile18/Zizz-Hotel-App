import { Request, Response } from 'express';
import {
  HttpError, listHotels, getHotel, addHotel, editHotel, editRoom, removeHotel,
} from '../services/hotelService';

// Turns the :id in the web address into a number, or throws a 400 error
function getId(req: Request) {
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

// READ the list
export async function getHotels(req: Request, res: Response) {
  try {
    res.json(await listHotels(req.query));
  } catch (err) {
    sendError(res, err);
  }
}

// READ one hotel
export async function getHotelById(req: Request, res: Response) {
  try {
    res.json(await getHotel(getId(req)));
  } catch (err) {
    sendError(res, err);
  }
}

// CREATE a hotel (admin)
export async function createNewHotel(req: Request, res: Response) {
  try {
    res.status(201).json(await addHotel(req.body));
  } catch (err) {
    sendError(res, err);
  }
}

// UPDATE a hotel's details (admin)
export async function updateHotelDetails(req: Request, res: Response) {
  try {
    await editHotel(getId(req), req.body);
    res.json({ message: 'Hotel updated' });
  } catch (err) {
    sendError(res, err);
  }
}

// UPDATE a room's price and availability (admin)
export async function updateRoomDetails(req: Request, res: Response) {
  try {
    await editRoom(getId(req), req.body);
    res.json({ message: 'Room updated' });
  } catch (err) {
    sendError(res, err);
  }
}

// DELETE a hotel (admin)
export async function deleteHotelById(req: Request, res: Response) {
  try {
    await removeHotel(getId(req));
    res.status(204).send();
  } catch (err) {
    sendError(res, err);
  }
}