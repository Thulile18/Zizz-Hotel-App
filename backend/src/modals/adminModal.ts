import { pool } from '../config/db';

// Every reservation, with the guest, hotel and room details
export async function listAllBookings() {
  const result = await pool.query(
    `SELECT b.id, b.check_in, b.check_out, b.rooms_booked, b.guests, b.total_price, b.status,
            b.checked_in_at, b.checked_out_at,
            u.name AS guest_name, u.email AS guest_email, u.phone AS guest_phone,
            h.name AS hotel, r.type AS room_type
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     JOIN rooms r ON r.id = b.room_id
     JOIN hotels h ON h.id = r.hotel_id
     ORDER BY b.created_at DESC`
  );
  return result.rows;
}

// Rooms already taken on these dates, ignoring the booking we are changing
export async function countBookedRoomsExcluding(
  roomId: number, checkIn: string, checkOut: string, excludeBookingId: number
) {
  const result = await pool.query(
    `SELECT COALESCE(SUM(rooms_booked), 0) AS taken FROM bookings
     WHERE room_id = $1 AND id <> $4
       AND check_in < $3 AND check_out > $2
       AND (status = 'confirmed'
            OR (status = 'pending' AND created_at > now() - interval '30 minutes'))`,
    [roomId, checkIn, checkOut, excludeBookingId]
  );
  return Number(result.rows[0].taken);
}

// Move a booking to new dates and save the new total
export async function updateBookingDates(id: number, checkIn: string, checkOut: string, totalPrice: number) {
  await pool.query(
    'UPDATE bookings SET check_in = $1, check_out = $2, total_price = $3 WHERE id = $4',
    [checkIn, checkOut, totalPrice, id]
  );
}

// The front desk records the moment a guest arrives
export async function markCheckedIn(id: number) {
  await pool.query('UPDATE bookings SET checked_in_at = now() WHERE id = $1', [id]);
}

// ...and the moment they leave
export async function markCheckedOut(id: number) {
  await pool.query('UPDATE bookings SET checked_out_at = now() WHERE id = $1', [id]);
}

// Send one message to every guest (admins do not get promotions)
export async function notifyAllGuests(message: string) {
  const result = await pool.query(
    "INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'user'",
    [message]
  );
  return result.rowCount ?? 0;
}
