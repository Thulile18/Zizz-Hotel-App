import { pool } from '../config/db';

// Find one user by email (returns undefined if nobody has it)
export async function findUserByEmail(email: string) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

// Save a new user and give back their details (never the password)
export async function createUser(name: string, email: string, passwordHash: string) {
  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
    [name, email, passwordHash]
  );
  return result.rows[0];
}