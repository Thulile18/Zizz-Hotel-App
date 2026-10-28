import { pool } from '../config/db';

// The shape of the data an admin sends when adding a hotel
export interface HotelInput {
  name: string;
  slug?: string;
  tagline?: string;
  description?: string;
  address: string;
  city: string;
  region?: string;
  country?: string;
  lat?: number;
  lng?: number;
  stars: number;
  is_featured?: boolean;
  property_type?: string;
  tags?: string[];
  facilities: string[];
  policies?: string;
  images: string[];
  rooms: {
    type: string;
    capacity: number;
    price_per_night: number;
    total_rooms: number;
    image_path?: string;
    description?: string;
    amenities?: string[];
  }[];
}

function makeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// READ: the list of hotels, with search and filters
export async function searchHotels(
  q: string, maxPrice: number, minStars: number, page: number, limit = 100
) {
  const result = await pool.query(
    `SELECT
       h.id, h.name, h.slug, h.city, h.region, h.country, h.address, h.tagline,
       h.stars,
       h.stars AS star_rating,
       h.is_featured, h.property_type, h.tags, h.facilities,
       h.lat AS latitude,
       h.lng AS longitude,
       MIN(r.price_per_night) AS from_price,
       (SELECT url FROM hotel_images WHERE hotel_id = h.id ORDER BY display_order ASC LIMIT 1) AS cover,
       (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE hotel_id = h.id) AS rating
     FROM hotels h
     JOIN rooms r ON r.hotel_id = h.id
     WHERE (h.city ILIKE $1 OR h.name ILIKE $1 OR h.region ILIKE $1 OR h.country ILIKE $1)
       AND h.stars >= $2
     GROUP BY h.id, h.name, h.slug, h.city, h.region, h.country, h.address, h.tagline, h.stars, h.is_featured, h.property_type, h.tags, h.facilities, h.lat, h.lng
     HAVING MIN(r.price_per_night) <= $3
     ORDER BY h.name LIMIT $5 OFFSET $4`,
    [`%${q}%`, minStars, maxPrice, (page - 1) * limit, limit]
  );
  return result.rows;
}

// READ: one hotel with its photos, rooms and reviews
export async function findHotelById(id: number) {
  const hotel = await pool.query(
    `SELECT id, name, slug, tagline, description, address, city, region, country,
            lat, lng, lat AS latitude, lng AS longitude,
            stars, stars AS star_rating,
            is_featured, property_type, tags, facilities, policies
     FROM hotels WHERE id = $1`,
    [id]
  );
  if (!hotel.rows[0]) return undefined;

  const images = await pool.query(
    'SELECT id, url AS storage_path, caption, category, display_order FROM hotel_images WHERE hotel_id = $1 ORDER BY display_order ASC',
    [id]
  );

  const rooms = await pool.query(
    `SELECT id, type, type AS room_type, capacity, price_per_night, total_rooms,
            image_path, description, COALESCE(amenities, '{}') AS amenities
     FROM rooms WHERE hotel_id = $1 ORDER BY price_per_night ASC`,
    [id]
  );

  const reviews = await pool.query(
    'SELECT id, user_id, reviewer_name, rating, comment, created_at FROM reviews WHERE hotel_id = $1 ORDER BY created_at DESC',
    [id]
  );

  return {
    ...hotel.rows[0],
    hotel_images: images.rows,
    rooms: rooms.rows,
    reviews: reviews.rows,
  };
}

// WRITE: add a hotel, then its photos and rooms (all or nothing)
export async function createHotel(h: HotelInput) {
  const slug = h.slug || makeSlug(h.name);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO hotels (name, slug, tagline, description, address, city, region, country, lat, lng, stars, is_featured, property_type, tags, facilities, policies)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
      [
        h.name, slug, h.tagline ?? null, h.description ?? null, h.address, h.city, h.region ?? null,
        h.country || 'South Africa', h.lat ?? null, h.lng ?? null, h.stars, h.is_featured ?? false,
        h.property_type ?? null, h.tags ?? [], h.facilities ?? [], h.policies ?? null,
      ]
    );
    const hotelId = result.rows[0].id as number;

    for (let i = 0; i < (h.images ?? []).length; i++) {
      await client.query(
        'INSERT INTO hotel_images (hotel_id, url, display_order) VALUES ($1, $2, $3)',
        [hotelId, h.images[i], i]
      );
    }

    for (const r of h.rooms ?? []) {
      await client.query(
        `INSERT INTO rooms (hotel_id, type, capacity, price_per_night, total_rooms, image_path, description, amenities)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          hotelId, r.type, r.capacity, r.price_per_night, r.total_rooms,
          r.image_path ?? null, r.description ?? null, r.amenities ?? [],
        ]
      );
    }

    await client.query('COMMIT');
    return hotelId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// UPDATE: change a hotel's details (returns how many rows changed).
// Fields the admin form does not send keep their current value.
export async function updateHotel(id: number, h: Omit<HotelInput, 'images' | 'rooms'>) {
  const result = await pool.query(
    `UPDATE hotels SET
       name = $1,
       slug = COALESCE($2::text, slug),
       tagline = COALESCE($3::text, tagline),
       description = $4,
       address = $5,
       city = $6,
       region = COALESCE($7::text, region),
       country = COALESCE($8::text, country),
       lat = $9,
       lng = $10,
       stars = $11,
       is_featured = COALESCE($12::boolean, is_featured),
       property_type = COALESCE($13::text, property_type),
       tags = COALESCE($14::text[], tags),
       facilities = $15,
       policies = $16
     WHERE id = $17`,
    [
      h.name, h.slug ?? null, h.tagline ?? null, h.description ?? null, h.address, h.city,
      h.region ?? null, h.country ?? null, h.lat ?? null, h.lng ?? null, h.stars,
      h.is_featured ?? null, h.property_type ?? null, h.tags ?? null, h.facilities ?? [],
      h.policies ?? null, id,
    ]
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
