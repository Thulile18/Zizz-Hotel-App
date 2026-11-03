"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRoomById = findRoomById;
exports.countBookedRooms = countBookedRooms;
exports.createBooking = createBooking;
exports.saveStripeSession = saveStripeSession;
exports.findBookingById = findBookingById;
exports.setBookingStatus = setBookingStatus;
exports.listBookingsForUser = listBookingsForUser;
exports.cancelUserBooking = cancelUserBooking;
const db_1 = require("../config/db");
// Find one room (we need its price and capacity)
async function findRoomById(roomId) {
    const result = await db_1.pool.query('SELECT * FROM rooms WHERE id = \$1', [roomId]);
    return result.rows[0]; // Fixed: returns a single object row, not the array
}
// How many rooms of this type are already taken on those dates?
// Confirmed bookings always count. Unpaid ones count for 30 minutes,
// so an abandoned payment page does not block a room forever.
async function countBookedRooms(roomId, checkIn, checkOut) {
    const result = await db_1.pool.query(`SELECT COALESCE(SUM(rooms_booked), 0) AS taken FROM bookings
     WHERE room_id = $1
       AND check_in < $3 AND check_out > $2
       AND (status = 'confirmed'
            OR (status = 'pending' AND created_at > now() - interval '30 minutes'))`, [roomId, checkIn, checkOut]);
    return Number(result.rows[0].taken); // Fixed: reads index 0 correctly
}
// Save a new booking (it starts as 'pending' until it is paid)
async function createBooking(userId, roomId, checkIn, checkOut, roomsBooked, guests, totalPrice) {
    const result = await db_1.pool.query(`INSERT INTO bookings (user_id, room_id, check_in, check_out, rooms_booked, guests, total_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, [userId, roomId, checkIn, checkOut, roomsBooked, guests, totalPrice]);
    return result.rows[0].id; // Fixed: safely reads the returned id integer
}
// Remember which Stripe payment page belongs to this booking
async function saveStripeSession(bookingId, sessionId) {
    await db_1.pool.query('UPDATE bookings SET stripe_session_id = \$1 WHERE id = \$2', [sessionId, bookingId]);
}
// Find one booking
async function findBookingById(id) {
    const result = await db_1.pool.query('SELECT * FROM bookings WHERE id = \$1', [id]);
    return result.rows[0]; // Fixed: returns a single booking row
}
// Change a booking's status (pending, confirmed or cancelled)
async function setBookingStatus(id, status) {
    await db_1.pool.query('UPDATE bookings SET status = \$1 WHERE id = \$2', [status, id]);
}
// A guest's own bookings formatted into nested JSON objects matching Lovable precisely
async function listBookingsForUser(userId) {
    const result = await db_1.pool.query(`SELECT b.id, b.user_id, b.room_id, b.check_in, b.check_out, b.rooms_booked, b.guests,
            b.total_price, b.status, b.created_at, b.checked_in_at, b.checked_out_at,
            h.id AS hotel_id, h.name AS hotel, r.type AS room_type,
            json_build_object('name', h.name, 'city', h.city, 'slug', h.slug) AS hotels,
            json_build_object('room_type', r.type, 'image_path', r.image_path) AS rooms
     FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     JOIN hotels h ON h.id = r.hotel_id
     WHERE b.user_id = $1
     ORDER BY b.check_in DESC`, [userId]);
    return result.rows;
}
// A guest cancels their own booking (returns how many rows changed)
async function cancelUserBooking(id, userId) {
    const result = await db_1.pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = \$1 AND user_id = \$2", [id, userId]);
    return result.rowCount;
}
