"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.listNotifications = listNotifications;
const db_1 = require("../config/db");
// Save a message for a user
async function createNotification(userId, message) {
    await db_1.pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [userId, message]);
}
// A user's latest 20 messages, newest first
async function listNotifications(userId) {
    const result = await db_1.pool.query('SELECT id, message, created_at FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT 20', [userId]);
    return result.rows;
}
