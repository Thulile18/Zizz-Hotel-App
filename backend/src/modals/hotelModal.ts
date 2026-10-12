import { pool } from '../config/db';

// The shape of the data an admin sends when adding a hotel
export interface HotelInput {
  name: string;
  description?: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  stars: number;
  facilities: string[];
  policies?: string;
  images: string[];
  rooms: { type: string; capacity: number; price_per_night: number; total_rooms: number }[];
}

// READ: the list of hotels, with search and filters, 12 per page
export async function searchHotels(q: string, maxPrice: number, minStars: number, page: number) {
  const result = await pool.query(
    `SELECT h.*, MIN(r.price_per_night) AS from_price,
       (SELECT url FROM hotel_images WHERE hotel_id = h.id LIMIT 1) AS cover,
       (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE hotel_id = h.id) AS rating
     FROM hotels h JOIN rooms r ON r.hotel_id = h.id
     WHERE (h.city ILIKE $1 OR h.name ILIKE $1) AND h.stars >= $2
     GROUP BY h.id
     HAVING MIN(r.price_per_night) <= $3
     ORDER BY h.id LIMIT 12 OFFSET $4`,
    [`%${q}%`, minStars, maxPrice, (page - 1) * 12]
  );
  return result.rows;
}

// READ: one hotel with its photos, rooms and reviews
export async function findHotelById(id: number) {
  const hotel = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);
  if (!hotel.rows[0]) return undefined;

  const images = await pool.query('SELECT url FROM hotel_images WHERE hotel_id = $1', [id]);
  const rooms = await pool.query('SELECT * FROM rooms WHERE hotel_id = $1', [id]);
  const reviews = await pool.query(
    'SELECT r.rating, r.comment, u.name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.hotel_id = $1',
    [id]
  );

  return {
    ...hotel.rows[0],
    images: images.rows.map((row) => row.url),
    rooms: rooms.rows,
    reviews: reviews.rows,
  };
}

// WRITE: add a hotel, then its photos and rooms
export async function createHotel(h: HotelInput) {
  const result = await pool.query(
    `INSERT INTO hotels (name, description, address, city, lat, lng, stars, facilities, policies)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [h.name, h.description, h.address, h.city, h.lat, h.lng, h.stars, h.facilities, h.policies]
  );
  const hotelId = result.rows[0].id;

  for (const url of h.images) {
    await pool.query('INSERT INTO hotel_images (hotel_id, url) VALUES ($1, $2)', [hotelId, url]);
  }
  for (const r of h.rooms) {
    await pool.query(
      'INSERT INTO rooms (hotel_id, type, capacity, price_per_night, total_rooms) VALUES ($1, $2, $3, $4, $5)',
      [hotelId, r.type, r.capacity, r.price_per_night, r.total_rooms]
    );
  }
  return hotelId;
}

// UPDATE: change a hotel's details (returns how many rows changed)
export async function updateHotel(id: number, h: Omit<HotelInput, 'images' | 'rooms'>) {
  const result = await pool.query(
    `UPDATE hotels SET name = $1, description = $2, address = $3, city = $4,
       lat = $5, lng = $6, stars = $7, facilities = $8, policies = $9
     WHERE id = $10`,
    [h.name, h.description, h.address, h.city, h.lat, h.lng, h.stars, h.facilities, h.policies, id]
  );
  return result.rowCount;
}

// UPDATE: change a room's price and how many rooms are available
export async function updateRoom(id: number, pricePerNight: number, totalRooms: number) {
  const result = await pool.query(
    'UPDATE rooms SET price_per_night = $1, total_rooms = $2 WHERE id = $3',
    [pricePerNight, totalRooms, id]
  );
  return result.rowCount;
}

// DELETE: remove a hotel (its photos and rooms go with it)
export async function deleteHotel(id: number) {
  const result = await pool.query('DELETE FROM hotels WHERE id = $1', [id]);
  return result.rowCount;
}