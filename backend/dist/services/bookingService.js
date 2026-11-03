"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookRoom = bookRoom;
exports.confirmPayment = confirmPayment;
exports.myBookings = myBookings;
exports.cancelMyBooking = cancelMyBooking;
const zod_1 = require("zod");
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("../config/env");
const hotelService_1 = require("./hotelService");
const bookingModal_1 = require("../modals/bookingModal");
const notificationModal_1 = require("../modals/notificationModal");
const stripe = new stripe_1.default(env_1.env.STRIPE_SECRET_KEY);
// ---- The rules ----
const date = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose valid dates');
const bookingSchema = zod_1.z.object({
    roomId: zod_1.z.number().int(),
    checkIn: date,
    checkOut: date,
    rooms: zod_1.z.number().int().min(1, 'Book at least 1 room'),
    guests: zod_1.z.number().int().min(1, 'At least 1 guest is needed'),
});
// ---- Make a booking and start the payment ----
async function bookRoom(userId, body) {
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success)
        throw new hotelService_1.HttpError(400, parsed.error.issues[0].message);
    const { roomId, checkIn, checkOut, rooms, guests } = parsed.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(checkIn) < today)
        throw new hotelService_1.HttpError(400, 'Check-in cannot be in the past');
    const nights = Math.round((+new Date(checkOut) - +new Date(checkIn)) / 86_400_000);
    if (nights < 1)
        throw new hotelService_1.HttpError(400, 'Check-out must be after check-in');
    const room = await (0, bookingModal_1.findRoomById)(roomId);
    if (!room)
        throw new hotelService_1.HttpError(404, 'Room not found');
    if (guests > room.capacity * rooms) {
        throw new hotelService_1.HttpError(400, `${rooms} room(s) of this type sleep at most ${room.capacity * rooms} guests`);
    }
    // Are enough rooms free on those dates?
    const taken = await (0, bookingModal_1.countBookedRooms)(roomId, checkIn, checkOut);
    if (taken + rooms > room.total_rooms) {
        throw new hotelService_1.HttpError(409, 'Sorry, those rooms are not available on these dates');
    }
    // The price is worked out here, never trusted from the browser
    const total = nights * rooms * Number(room.price_per_night);
    const bookingId = await (0, bookingModal_1.createBooking)(userId, roomId, checkIn, checkOut, rooms, guests, total);
    // Stripe hosts the payment page, so card numbers never touch our server
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'zar',
                    unit_amount: Math.round(total * 100),
                    product_data: { name: `${room.type} room, ${nights} night(s)` },
                },
            },
        ],
        success_url: `${env_1.env.CLIENT_URL}/booking-confirmed?booking=${bookingId}`,
        cancel_url: `${env_1.env.CLIENT_URL}/hotels/${room.hotel_id}`,
    });
    await (0, bookingModal_1.saveStripeSession)(bookingId, session.id);
    return { bookingId, checkoutUrl: session.url };
}
// ---- After the guest returns from Stripe: was it really paid? ----
async function confirmPayment(userId, bookingId) {
    const booking = await (0, bookingModal_1.findBookingById)(bookingId);
    if (!booking)
        throw new hotelService_1.HttpError(404, 'Booking not found');
    // The guest refreshed the page: it is already confirmed, so there is nothing more to do
    if (booking.status === 'confirmed')
        return { status: 'confirmed' };
    if (!booking.stripe_session_id)
        throw new hotelService_1.HttpError(400, 'This booking has no payment to check');
    // Ask Stripe directly, instead of trusting the browser
    const session = await stripe.checkout.sessions.retrieve(booking.stripe_session_id);
    if (session.payment_status !== 'paid') {
        throw new hotelService_1.HttpError(402, 'Payment has not been completed');
    }
    // Only now is the booking confirmed
    await (0, bookingModal_1.setBookingStatus)(bookingId, 'confirmed');
    await (0, notificationModal_1.createNotification)(userId, `Your booking #${bookingId} is confirmed. Thank you!`);
    return { status: 'confirmed' };
}
// ---- A guest's own bookings ----
function myBookings(userId) {
    return (0, bookingModal_1.listBookingsForUser)(userId);
}
async function cancelMyBooking(userId, bookingId) {
    const changed = await (0, bookingModal_1.cancelUserBooking)(bookingId, userId);
    if (!changed)
        throw new hotelService_1.HttpError(404, 'Booking not found');
    await (0, notificationModal_1.createNotification)(userId, `Your booking #${bookingId} was cancelled.`);
}
