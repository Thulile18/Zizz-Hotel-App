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

// Find a user by id (never includes the password)
export async function findUserById(id: number) {
  const result = await pool.query(
    'SELECT id, name, email, phone, role FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

// Change a user's name and phone
export async function updateUserProfile(id: number, name: string, phone: string | null) {
  const result = await pool.query(
    'UPDATE users SET name = $1, phone = $2 WHERE id = $3 RETURNING id, name, email, phone, role',
    [name, phone, id]
  );
  return result.rows[0];
}

// Create a user who signed up with GitHub (they have no password)
export async function createOAuthUser(name: string, email: string) {
  const result = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, role',
    [name, email]
  );
  return result.rows[0];
}