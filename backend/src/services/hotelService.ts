import { z } from 'zod';
import {
  searchHotels, findHotelById, createHotel, updateHotel, updateRoom, deleteHotel,
} from '../modals/hotelModal';

// An error that carries an HTTP status code (404 not found, 400 bad data...)
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ---- The rules ----
const roomSchema = z.object({
  type: z.string().min(1, 'Room type is required'),
  capacity: z.number().int().min(1, 'A room must sleep at least 1 guest'),
  price_per_night: z.number().positive('Price must be more than 0'),
  total_rooms: z.number().int().min(0, 'Number of rooms cannot be negative'),
});

const hotelFields = z.object({
  name: z.string().min(1, 'Hotel name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  stars: z.number().int().min(1, 'Stars must be 1 to 5').max(5, 'Stars must be 1 to 5'),
  facilities: z.array(z.string()).default([]),
  policies: z.string().optional(),
});

const newHotelSchema = hotelFields.extend({
  images: z.array(z.string()).default([]),
  rooms: z.array(roomSchema).min(1, 'Add at least one room type'),
});

const roomUpdateSchema = z.object({
  price_per_night: z.number().positive('Price must be more than 0'),
  total_rooms: z.number().int().min(0, 'Number of rooms cannot be negative'),
});

// Checks data against a rule set, or throws a 400 error with a friendly message
function check<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  return parsed.data;
}

// ---- The actions ----
export function listHotels(query: Record<string, unknown>) {
  const q = String(query.q ?? '');
  const maxPrice = Number(query.maxPrice) || 100000;
  const minStars = Number(query.minStars) || 0;
  const page = Math.max(1, Number(query.page) || 1);
  return searchHotels(q, maxPrice, minStars, page);
}

export async function getHotel(id: number) {
  const hotel = await findHotelById(id);
  if (!hotel) throw new HttpError(404, 'Hotel not found');
  return hotel;
}

export async function addHotel(body: unknown) {
  const data = check(newHotelSchema, body);
  const id = await createHotel(data);
  return { id };
}

export async function editHotel(id: number, body: unknown) {
  const data = check(hotelFields, body);
  const changed = await updateHotel(id, data);
  if (!changed) throw new HttpError(404, 'Hotel not found');
}

export async function editRoom(id: number, body: unknown) {
  const data = check(roomUpdateSchema, body);
  const changed = await updateRoom(id, data.price_per_night, data.total_rooms);
  if (!changed) throw new HttpError(404, 'Room not found');
}

export async function removeHotel(id: number) {
  const removed = await deleteHotel(id);
  if (!removed) throw new HttpError(404, 'Hotel not found');
}