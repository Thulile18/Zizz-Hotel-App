import { z } from 'zod';
import { HttpError } from './hotelService';
import { findBookingById, findRoomById, setBookingStatus } from '../modals/bookingModal';
import { createNotification } from '../modals/notificationModal';
import {
  listAllBookings, countBookedRoomsExcluding, updateBookingDates, notifyAllGuests,
  markCheckedIn, markCheckedOut,
} from '../modals/adminModal';

// ---- The rules ----
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose valid dates');

const changeSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled'], {
    message: 'Status must be pending, confirmed or cancelled',
  }).optional(),
  checkIn: date.optional(),
  checkOut: date.optional(),
  action: z.enum(['check_in', 'check_out'], {
    message: 'Action must be check_in or check_out',
  }).optional(),
});

const promotionSchema = z.object({
  message: z.string().trim().min(1, 'Write a message').max(300, 'Keep the message under 300 characters'),
});

// Turns a database date into "2026-12-10" (in our own time zone)
function dateText(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

// ---- The actions ----
export function allReservations() {
  return listAllBookings();
}

// Front desk: record that a guest has arrived or has left
async function recordStay(bookingId: number, action: 'check_in' | 'check_out') {
  const booking = await findBookingById(bookingId);
  if (!booking) throw new HttpError(404, 'Booking not found');

  if (action === 'check_in') {
    if (booking.status !== 'confirmed') throw new HttpError(409, 'Only confirmed bookings can be checked in');
    if (booking.checked_in_at) throw new HttpError(409, 'This guest is already checked in');
    await markCheckedIn(bookingId);
    await createNotification(booking.user_id, `You are checked in for booking #${bookingId}. Enjoy your stay!`);
  } else {
    if (!booking.checked_in_at) throw new HttpError(409, 'Check the guest in before checking them out');
    if (booking.checked_out_at) throw new HttpError(409, 'This guest is already checked out');
    await markCheckedOut(bookingId);
    await createNotification(
      booking.user_id,
      `You have checked out of booking #${bookingId}. Thank you for staying with VELOUR. You can now leave a review on the hotel's page.`
    );
  }
  return { id: bookingId, action };
}

// Approve, cancel or move a reservation, or check a guest in or out
export async function changeReservation(bookingId: number, body: unknown) {
  const parsed = changeSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const { status, checkIn, checkOut, action } = parsed.data;
  if (!status && !checkIn && !checkOut && !action) throw new HttpError(400, 'Nothing to change');

  if (action) return recordStay(bookingId, action);

  const booking = await findBookingById(bookingId);
  if (!booking) throw new HttpError(404, 'Booking not found');

  // Anything the admin did not send stays as it was
  const newIn = checkIn ?? dateText(booking.check_in);
  const newOut = checkOut ?? dateText(booking.check_out);
  const newStatus = status ?? booking.status;

  const nights = Math.round((+new Date(newOut) - +new Date(newIn)) / 86_400_000);
  if (nights < 1) throw new HttpError(400, 'Check-out must be after check-in');

  const room = await findRoomById(booking.room_id);

  // A booking that stays active needs free rooms on its dates
  if (newStatus !== 'cancelled') {
    const taken = await countBookedRoomsExcluding(booking.room_id, newIn, newOut, bookingId);
    if (taken + booking.rooms_booked > room.total_rooms) {
      throw new HttpError(409, 'Those rooms are not available on these dates');
    }
  }

  if (checkIn || checkOut) {
    const total = nights * booking.rooms_booked * Number(room.price_per_night);
    await updateBookingDates(bookingId, newIn, newOut, total);
  }
  if (status) await setBookingStatus(bookingId, status);

  // Tell the guest what changed
  const changes: string[] = [];
  if (status) changes.push(`the status is now ${status}`);
  if (checkIn || checkOut) changes.push(`the dates are now ${newIn} to ${newOut}`);
  await createNotification(booking.user_id, `Your booking #${bookingId} was updated: ${changes.join(' and ')}.`);

  return { id: bookingId, status: newStatus, checkIn: newIn, checkOut: newOut };
}

// Send a promotion to every guest
export async function sendPromotion(body: unknown) {
  const parsed = promotionSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const sent = await notifyAllGuests(parsed.data.message);
  return { sent };
}
