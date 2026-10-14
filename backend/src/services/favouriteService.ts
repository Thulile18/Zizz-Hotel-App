import { HttpError } from './hotelService';
import { hotelExists, addFavourite, removeFavourite, listFavourites } from '../modals/favouriteModal';

export function myFavourites(userId: number) {
  return listFavourites(userId);
}

export async function saveFavourite(userId: number, hotelId: number) {
  if (!(await hotelExists(hotelId))) throw new HttpError(404, 'Hotel not found');
  await addFavourite(userId, hotelId);
}

export async function deleteFavourite(userId: number, hotelId: number) {
  await removeFavourite(userId, hotelId);
}