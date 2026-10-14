import { pool } from '../config/db';

// Save a message for a user
export async function createNotification(userId: number, message: string) {
  await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [userId, message]);
}

// A user's latest 20 messages, newest first
export async function listNotifications(userId: number) {
  const result = await pool.query(
    'SELECT id, message, created_at FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT 20',
    [userId]
  );
  return result.rows;
}