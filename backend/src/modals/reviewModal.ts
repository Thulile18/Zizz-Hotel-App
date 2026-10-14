import { pool } from '../config/db';

// Has this guest got a confirmed booking at this hotel?
export async function hasConfirmedBooking(userId: number, hotelId: number) {
  const result = await pool.query(
    `SELECT 1 FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     WHERE b.user_id = $1 AND r.hotel_id = $2 AND b.status = 'confirmed'
     LIMIT 1`,
    [userId, hotelId]
  );
  return result.rowCount === 1;
}

// Save a review, or update it if this guest already reviewed the hotel
export async function saveReview(userId: number, hotelId: number, rating: number, comment: string | null) {
  await pool.query(
    `INSERT INTO reviews (user_id, hotel_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, hotel_id) DO UPDATE SET rating = $3, comment = $4`,
    [userId, hotelId, rating, comment]
  );
}