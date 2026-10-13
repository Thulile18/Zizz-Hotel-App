import { pool } from '../config/db';

// Find one room (we need its price and capacity)
export async function findRoomById(roomId: number) {
  const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
  return result.rows[0];
}

// How many rooms of this type are already taken on those dates?
// Confirmed bookings always count. Unpaid ones count for 30 minutes,
// so an abandoned payment page does not block a room forever.
export async function countBookedRooms(roomId: number, checkIn: string, checkOut: string) {
  const result = await pool.query(
    `SELECT COALESCE(SUM(rooms_booked), 0) AS taken FROM bookings
     WHERE room_id = $1
       AND check_in < $3 AND check_out > $2
       AND (status = 'confirmed'
            OR (status = 'pending' AND created_at > now() - interval '30 minutes'))`,
    [roomId, checkIn, checkOut]
  );
  return Number(result.rows[0].taken);
}

// Save a new booking (it starts as 'pending' until it is paid)
export async function createBooking(
  userId: number, roomId: number, checkIn: string, checkOut: string,
  roomsBooked: number, guests: number, totalPrice: number
) {
  const result = await pool.query(
    `INSERT INTO bookings (user_id, room_id, check_in, check_out, rooms_booked, guests, total_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [userId, roomId, checkIn, checkOut, roomsBooked, guests, totalPrice]
  );
  return result.rows[0].id as number;
}

// Remember which Stripe payment page belongs to this booking
export async function saveStripeSession(bookingId: number, sessionId: string) {
  await pool.query('UPDATE bookings SET stripe_session_id = $1 WHERE id = $2', [sessionId, bookingId]);
}

// Find one booking
export async function findBookingById(id: number) {
  const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
  return result.rows[0];
}

// Change a booking's status (pending, confirmed or cancelled)
export async function setBookingStatus(id: number, status: string) {
  await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, id]);
}

// A guest's own bookings, newest first, with the hotel and room names
export async function listBookingsForUser(userId: number) {
  const result = await pool.query(
    `SELECT b.id, b.check_in, b.check_out, b.rooms_booked, b.guests,
            b.total_price, b.status, h.name AS hotel, r.type AS room_type
     FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     JOIN hotels h ON h.id = r.hotel_id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return result.rows;
}

// A guest cancels their own booking (returns how many rows changed)
export async function cancelUserBooking(id: number, userId: number) {
  const result = await pool.query(
    "UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return result.rowCount;
}