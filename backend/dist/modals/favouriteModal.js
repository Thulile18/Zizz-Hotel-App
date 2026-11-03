"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotelExists = hotelExists;
exports.addFavourite = addFavourite;
exports.removeFavourite = removeFavourite;
exports.listFavourites = listFavourites;
const db_1 = require("../config/db");
// Does this hotel exist? (we check before saving it as a favourite)
async function hotelExists(hotelId) {
    const result = await db_1.pool.query('SELECT 1 FROM hotels WHERE id = $1', [hotelId]);
    return result.rowCount === 1;
}
// Save a hotel as a favourite (saving it twice does nothing)
async function addFavourite(userId, hotelId) {
    await db_1.pool.query('INSERT INTO favourites (user_id, hotel_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, hotelId]);
}
// Remove a favourite
async function removeFavourite(userId, hotelId) {
    await db_1.pool.query('DELETE FROM favourites WHERE user_id = $1 AND hotel_id = $2', [userId, hotelId]);
}
// A guest's favourite hotels, with a cover photo and the cheapest price
async function listFavourites(userId) {
    const result = await db_1.pool.query(`SELECT h.id, h.name, h.city, h.stars,
            (SELECT url FROM hotel_images WHERE hotel_id = h.id ORDER BY display_order ASC LIMIT 1) AS cover,
            (SELECT MIN(price_per_night) FROM rooms WHERE hotel_id = h.id) AS from_price
     FROM favourites f
     JOIN hotels h ON h.id = f.hotel_id
     WHERE f.user_id = $1
     ORDER BY h.name`, [userId]);
    return result.rows;
}
