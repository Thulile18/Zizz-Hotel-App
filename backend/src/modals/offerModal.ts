import { pool } from '../config/db';

// Shape of input when creating/updating promotional campaigns
export interface OfferInput {
  hotel_id: number;
  title: string;
  description?: string;
  discount_percent: number;
  is_published: boolean;
  booking_start: string; // Format: YYYY-MM-DD
  booking_end: string;   // Format: YYYY-MM-DD
  stay_end: string;      // Format: YYYY-MM-DD
  quantity?: number;     // NULL means infinite coupons available
  used?: number;
}

// READ: Active promotions for the homepage slider (Matches Lovable's exact constraints)
export async function getActiveOffers() {
  const today = new Date().toISOString().slice(0, 10); // Format current date: YYYY-MM-DD

  const result = await pool.query(
    `SELECT 
       o.id,
       o.hotel_id,
       o.title,
       o.description,
       o.discount_percent,
       o.is_published,
       o.booking_start,
       o.booking_end,
       o.stay_end,
       o.quantity,
       o.used,
       o.created_at,
       json_build_object(
         'name', h.name,
         'slug', h.slug,
         'city', h.city,
         'region', h.region,
         'country', h.country,
         'rooms', COALESCE((
            SELECT json_agg(json_build_object('id', r.id, 'price_per_night', r.price_per_night)) 
            FROM rooms r WHERE r.hotel_id = h.id
         ), '[]'::json),
         'hotel_images', COALESCE((
            SELECT json_agg(json_build_object('storage_path', img.url, 'display_order', img.display_order)) 
            FROM hotel_images img WHERE img.hotel_id = h.id
         ), '[]'::json)
       ) AS hotels
     FROM offers o
     JOIN hotels h ON h.id = o.hotel_id
     WHERE o.is_published = true 
       AND o.booking_end >= $1 
       AND o.booking_start <= $1 
       AND o.stay_end > $1
     ORDER BY o.discount_percent DESC`,
    [today]
  );

  // Post-fetch validation filter: drop offers where consumption limits are fully saturated
  return result.rows.filter((o) => o.quantity == null || o.used < o.quantity);
}

// WRITE: Admin adds a new marketing campaign banner
export async function createOffer(o: OfferInput) {
  const result = await pool.query(
    `INSERT INTO offers (hotel_id, title, description, discount_percent, is_published, booking_start, booking_end, stay_end, quantity, used)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      o.hotel_id, o.title, o.description || null, o.discount_percent, o.is_published || false,
      o.booking_start, o.booking_end, o.stay_end, o.quantity ?? null, o.used || 0
    ]
  );
  return result.rows[0].id as number; // Fixed: safely accesses index 0 row object
}

// DELETE: Clear out old campaign assets
export async function deleteOffer(id: number) {
  const result = await pool.query('DELETE FROM offers WHERE id = $1', [id]);
  return result.rowCount;
}
