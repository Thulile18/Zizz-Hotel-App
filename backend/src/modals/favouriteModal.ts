import { pool } from '../config/db';

// Does this hotel exist? (we check before saving it as a favourite)
export async function hotelExists(hotelId: number) {
  const result = await pool.query('SELECT 1 FROM hotels WHERE id = $1', [hotelId]);
  return result.rowCount === 1;
}

// Save a hotel as a favourite (saving it twice does nothing)
export async function addFavourite(userId: number, hotelId: number) {
  await pool.query(
    'INSERT INTO favourites (user_id, hotel_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, hotelId]
  );
}

// Remove a favourite
export async function removeFavourite(userId: number, hotelId: number) {
  await pool.query('DELETE FROM favourites WHERE user_id = $1 AND hotel_id = $2', [userId, hotelId]);
}

// A guest's favourite hotels, with a cover photo and the cheapest price
export async function listFavourites(userId: number) {
  const result = await pool.query(
    `SELECT h.id, h.name, h.city, h.stars,
            (SELECT url FROM hotel_images WHERE hotel_id = h.id ORDER BY display_order ASC LIMIT 1) AS cover,
            (SELECT MIN(price_per_night) FROM rooms WHERE hotel_id = h.id) AS from_price
     FROM favourites f
     JOIN hotels h ON h.id = f.hotel_id
     WHERE f.user_id = $1
     ORDER BY h.name`,
    [userId]
  );
  return result.rows;
}