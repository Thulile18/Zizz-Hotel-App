import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { myNotifications } from '../services/notificationService';

// READ my notifications
export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    res.json(await myNotifications(req.user!.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}