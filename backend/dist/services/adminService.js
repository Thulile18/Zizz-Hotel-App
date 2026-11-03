"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allReservations = allReservations;
exports.changeReservation = changeReservation;
exports.sendPromotion = sendPromotion;
const zod_1 = require("zod");
const hotelService_1 = require("./hotelService");
const bookingModal_1 = require("../modals/bookingModal");
const notificationModal_1 = require("../modals/notificationModal");
const adminModal_1 = require("../modals/adminModal");
// ---- The rules ----
const date = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose valid dates');
const changeSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'confirmed', 'cancelled'], {
        message: 'Status must be pending, confirmed or cancelled',
    }).optional(),
    checkIn: date.optional(),
    checkOut: date.optional(),
    action: zod_1.z.enum(['check_in', 'check_out'], {
        message: 'Action must be check_in or check_out',
    }).optional(),
});
const promotionSchema = zod_1.z.object({
    message: zod_1.z.string().trim().min(1, 'Write a message').max(300, 'Keep the message under 300 characters'),
});
// Turns a database date into "2026-12-10" (in our own time zone)
function dateText(value) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
}
// ---- The actions ----
function allReservations() {
    return (0, adminModal_1.listAllBookings)();
}
// Front desk: record that a guest has arrived or has left
async function recordStay(bookingId, action) {
    const booking = await (0, bookingModal_1.findBookingById)(bookingId);
    if (!booking)
        throw new hotelService_1.HttpError(404, 'Booking not found');
    if (action === 'check_in') {
        if (booking.status !== 'confirmed')
            throw new hotelService_1.HttpError(409, 'Only confirmed bookings can be checked in');
        if (booking.checked_in_at)
            throw new hotelService_1.HttpError(409, 'This guest is already checked in');
        await (0, adminModal_1.markCheckedIn)(bookingId);
        await (0, notificationModal_1.createNotification)(booking.user_id, `You are checked in for booking #${bookingId}. Enjoy your stay!`);
    }
    else {
        if (!booking.checked_in_at)
            throw new hotelService_1.HttpError(409, 'Check the guest in before checking them out');
        if (booking.checked_out_at)
            throw new hotelService_1.HttpError(409, 'This guest is already checked out');
        await (0, adminModal_1.markCheckedOut)(bookingId);
        await (0, notificationModal_1.createNotification)(booking.user_id, `You have checked out of booking #${bookingId}. Thank you for staying with VELOUR. You can now leave a review on the hotel's page.`);
    }
    return { id: bookingId, action };
}
// Approve, cancel or move a reservation, or check a guest in or out
async function changeReservation(bookingId, body) {
    const parsed = changeSchema.safeParse(body);
    if (!parsed.success)
        throw new hotelService_1.HttpError(400, parsed.error.issues[0].message);
    const { status, checkIn, checkOut, action } = parsed.data;
    if (!status && !checkIn && !checkOut && !action)
        throw new hotelService_1.HttpError(400, 'Nothing to change');
    if (action)
        return recordStay(bookingId, action);
    const booking = await (0, bookingModal_1.findBookingById)(bookingId);
    if (!booking)
        throw new hotelService_1.HttpError(404, 'Booking not found');
    // Anything the admin did not send stays as it was
    const newIn = checkIn ?? dateText(booking.check_in);
    const newOut = checkOut ?? dateText(booking.check_out);
    const newStatus = status ?? booking.status;
    const nights = Math.round((+new Date(newOut) - +new Date(newIn)) / 86_400_000);
    if (nights < 1)
        throw new hotelService_1.HttpError(400, 'Check-out must be after check-in');
    const room = await (0, bookingModal_1.findRoomById)(booking.room_id);
    // A booking that stays active needs free rooms on its dates
    if (newStatus !== 'cancelled') {
        const taken = await (0, adminModal_1.countBookedRoomsExcluding)(booking.room_id, newIn, newOut, bookingId);
        if (taken + booking.rooms_booked > room.total_rooms) {
            throw new hotelService_1.HttpError(409, 'Those rooms are not available on these dates');
        }
    }
    if (checkIn || checkOut) {
        const total = nights * booking.rooms_booked * Number(room.price_per_night);
        await (0, adminModal_1.updateBookingDates)(bookingId, newIn, newOut, total);
    }
    if (status)
        await (0, bookingModal_1.setBookingStatus)(bookingId, status);
    // Tell the guest what changed
    const changes = [];
    if (status)
        changes.push(`the status is now ${status}`);
    if (checkIn || checkOut)
        changes.push(`the dates are now ${newIn} to ${newOut}`);
    await (0, notificationModal_1.createNotification)(booking.user_id, `Your booking #${bookingId} was updated: ${changes.join(' and ')}.`);
    return { id: bookingId, status: newStatus, checkIn: newIn, checkOut: newOut };
}
// Send a promotion to every guest
async function sendPromotion(body) {
    const parsed = promotionSchema.safeParse(body);
    if (!parsed.success)
        throw new hotelService_1.HttpError(400, parsed.error.issues[0].message);
    const sent = await (0, adminModal_1.notifyAllGuests)(parsed.data.message);
    return { sent };
}
