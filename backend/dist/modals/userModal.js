"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.createUser = createUser;
exports.findUserById = findUserById;
exports.updateUserProfile = updateUserProfile;
exports.createOAuthUser = createOAuthUser;
exports.exportUserData = exportUserData;
exports.anonymiseUser = anonymiseUser;
const db_1 = require("../config/db");
// Find one user by email (returns undefined if nobody has it)
async function findUserByEmail(email) {
    const result = await db_1.pool.query('SELECT * FROM users WHERE email = \$1', [email]);
    return result.rows[0];
}
// Save a new user and give back their details (never the password)
async function createUser(name, email, passwordHash) {
    const result = await db_1.pool.query(`INSERT INTO users (name, email, password_hash, consented_at)
     VALUES ($1, $2, $3, now()) RETURNING id, name, email, role`, [name, email, passwordHash]);
    return result.rows[0];
}
// Find a user by id (never includes the password)
async function findUserById(id) {
    const result = await db_1.pool.query('SELECT id, name, email, phone, role FROM users WHERE id = \$1', [id]);
    return result.rows[0];
}
// Change a user's name and phone
async function updateUserProfile(id, name, phone) {
    const result = await db_1.pool.query('UPDATE users SET name = \$1, phone = \$2 WHERE id = \$3 RETURNING id, name, email, phone, role', [name, phone, id]);
    return result.rows[0];
}
// Create a user who signed up with GitHub (they have no password)
async function createOAuthUser(name, email) {
    const result = await db_1.pool.query(`INSERT INTO users (name, email, consented_at)
     VALUES ($1, $2, now()) RETURNING id, name, email, role`, [name, email]);
    return result.rows[0];
}
// Everything we hold about one user, for the "download my data" button
async function exportUserData(id) {
    const profile = await db_1.pool.query('SELECT id, name, email, phone, role, created_at, consented_at FROM users WHERE id = \$1', [id]);
    const bookings = await db_1.pool.query(`SELECT 
       b.id, b.user_id, b.room_id, b.check_in, b.check_out, b.rooms_booked, b.guests, b.total_price,
       b.status, b.created_at,
       json_build_object(
         'name', h.name,
         'city', h.city,
         'slug', h.slug
       ) AS hotels,
       json_build_object(
         'room_type', r.type,
         'image_path', r.image_path
       ) AS rooms
     FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     JOIN hotels h ON h.id = r.hotel_id
     WHERE b.user_id = $1 ORDER BY b.check_in DESC`, [id]);
    const favourites = await db_1.pool.query('SELECT h.name, h.city FROM favourites f JOIN hotels h ON h.id = f.hotel_id WHERE f.user_id = \$1', [id]);
    const reviews = await db_1.pool.query('SELECT h.name AS hotel, rv.rating, rv.comment FROM reviews rv JOIN hotels h ON h.id = rv.hotel_id WHERE rv.user_id = \$1', [id]);
    const notifications = await db_1.pool.query('SELECT message, created_at FROM notifications WHERE user_id = \$1 ORDER BY id', [id]);
    return {
        profile: profile.rows[0],
        bookings: bookings.rows,
        favourites: favourites.rows,
        reviews: reviews.rows,
        notifications: notifications.rows,
    };
}
// "Delete" an account: wipe the personal details, keep the booking records.
// One statement does everything, so it either all happens or none of it does.
async function anonymiseUser(id) {
    await db_1.pool.query(`WITH f AS (DELETE FROM favourites WHERE user_id = $1),
          n AS (DELETE FROM notifications WHERE user_id = $1),
          r AS (UPDATE reviews SET reviewer_name = 'Deleted guest' WHERE user_id = $1)
     UPDATE users
     SET name = 'Deleted guest',
         email = 'deleted-' || id || '@deleted.invalid',
         phone = NULL,
         password_hash = NULL,
         consented_at = NULL
     WHERE id = $1`, [id]);
}
