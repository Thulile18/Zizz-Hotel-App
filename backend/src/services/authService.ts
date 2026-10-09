import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { findUserByEmail, createUser } from '../modals/userModal';

// A login token: proof that the user logged in, valid for 7 days
function makeToken(user: { id: number; role: string }) {
  return jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });
}

export async function registerUser(name: string, email: string, password: string) {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error('That email is already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser(name, email, passwordHash);
  return { user, token: makeToken(user) };
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  const passwordOk = user?.password_hash && (await bcrypt.compare(password, user.password_hash));
  if (!passwordOk) throw new Error('Wrong email or password');

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: makeToken(user),
  };
}