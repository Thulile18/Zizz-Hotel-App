import { pool } from '../config/db';

// Has this guest completed a confirmed stay at this hotel?
// A stay is complete once the front desk checked the guest out,
// or once the check-out date has passed.
export async function hasConfirmedBooking(userId: number, hotelId: number) {
  const result = await pool.query(
    `SELECT 1 FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     WHERE b.user_id = $1 AND r.hotel_id = $2 AND b.status = 'confirmed'
       AND (b.checked_out_at IS NOT NULL OR b.check_out <= CURRENT_DATE)
     LIMIT 1`,
    [userId, hotelId]
  );
  return result.rowCount === 1;
}

// Save a review, or update it if this guest already reviewed the hotel.
// The name shown on the review is taken from the guest's account.
export async function saveReview(userId: number, hotelId: number, rating: number, comment: string | null) {
  await pool.query(
    `INSERT INTO reviews (user_id, hotel_id, reviewer_name, rating, comment)
     SELECT $1::int, $2::int, name, $3::int, $4::text FROM users WHERE id = $1::int
     ON CONFLICT (user_id, hotel_id)
     DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment,
                   reviewer_name = EXCLUDED.reviewer_name, created_at = now()`,
    [userId, hotelId, rating, comment]
  );
}
