import { z } from 'zod';
import Stripe from 'stripe';
import { env } from '../config/env';
import { HttpError } from './hotelService';
import {
    findRoomById, countBookedRooms, createBooking, saveStripeSession,
    findBookingById, setBookingStatus, listBookingsForUser, cancelUserBooking,
} from '../modals/bookingModal';
import { createNotification } from '../modals/notificationModal';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// ---- The rules ----
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose valid dates');

const bookingSchema = z.object({
    roomId: z.number().int(),
    checkIn: date,
    checkOut: date,
    rooms: z.number().int().min(1, 'Book at least 1 room'),
    guests: z.number().int().min(1, 'At least 1 guest is needed'),
});

// ---- Make a booking and start the payment ----
export async function bookRoom(userId: number, body: unknown) {
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
    const { roomId, checkIn, checkOut, rooms, guests } = parsed.data;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(checkIn) < today) throw new HttpError(400, 'Check-in cannot be in the past');

    const nights = Math.round((+new Date(checkOut) - +new Date(checkIn)) / 86_400_000);
    if (nights < 1) throw new HttpError(400, 'Check-out must be after check-in');

    const room = await findRoomById(roomId);
    if (!room) throw new HttpError(404, 'Room not found');
    if (guests > room.capacity * rooms) {
        throw new HttpError(400, `${rooms} room(s) of this type sleep at most ${room.capacity * rooms} guests`);
    }

    // Are enough rooms free on those dates?
    const taken = await countBookedRooms(roomId, checkIn, checkOut);
    if (taken + rooms > room.total_rooms) {
        throw new HttpError(409, 'Sorry, those rooms are not available on these dates');
    }

    // The price is worked out here, never trusted from the browser
    const total = nights * rooms * Number(room.price_per_night);
    const bookingId = await createBooking(userId, roomId, checkIn, checkOut, rooms, guests, total);

    // Stripe hosts the payment page, so card numbers never touch our server
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: Math.round(total * 100),
                    product_data: { name: `${room.type} room, ${nights} night(s)` },
                },
            },
        ],
        success_url: `${env.CLIENT_URL}/booking-confirmed?booking=${bookingId}`,
        cancel_url: `${env.CLIENT_URL}/hotels/${room.hotel_id}`,
    });
    await saveStripeSession(bookingId, session.id);

    return { bookingId, checkoutUrl: session.url };
}

// ---- After the guest returns from Stripe: was it really paid? ----
export async function confirmPayment(userId: number, bookingId: number) {
    const booking = await findBookingById(bookingId);
    if (!booking || booking.user_id !== userId) throw new HttpError(404, 'Booking not found');
    if (booking.status === 'confirmed') return { status: 'confirmed' };
    if (!booking.stripe_session_id) throw new HttpError(400, 'No payment was started for this booking');

    // Ask Stripe directly, instead of trusting the browser
    const session = await stripe.checkout.sessions.retrieve(booking.stripe_session_id);
    if (session.payment_status !== 'paid') {
        throw new HttpError(402, 'Payment has not been completed');
    }

    await setBookingStatus(bookingId, 'confirmed');
    return { status: 'confirmed' };
    await createNotification(userId, `Your booking #${bookingId} is confirmed. Thank you!`);
}

// ---- A guest's own bookings ----
export function myBookings(userId: number) {
    return listBookingsForUser(userId);
}

export async function cancelMyBooking(userId: number, bookingId: number) {
    const changed = await cancelUserBooking(bookingId, userId);
    if (!changed) throw new HttpError(404, 'Booking not found');
    await createNotification(userId, `Your booking #${bookingId} was cancelled.`);
}