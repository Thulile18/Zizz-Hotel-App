import { z } from 'zod';
import { HttpError } from './hotelService';
import { findUserById, updateUserProfile, exportUserData, anonymiseUser } from '../modals/userModal';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
});

export async function getProfile(userId: number) {
  const user = await findUserById(userId);
  if (!user) throw new HttpError(404, 'User not found');
  return user;
}

export async function editProfile(userId: number, body: unknown) {
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  return updateUserProfile(userId, parsed.data.name, parsed.data.phone || null);
}

// Everything we hold about the user
export function downloadMyData(userId: number) {
  return exportUserData(userId);
}

// Anonymise the account (admins are protected, so the site always has an admin)
export async function deleteMyAccount(userId: number, role: string) {
  if (role === 'admin') {
    throw new HttpError(403, 'Admin accounts cannot be deleted here. Ask another admin to change your role first.');
  }
  await anonymiseUser(userId);
}