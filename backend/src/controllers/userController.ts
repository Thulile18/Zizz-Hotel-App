import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { HttpError } from '../services/hotelService';
import { getProfile, editProfile, downloadMyData, deleteMyAccount } from '../services/userService';

// One place that turns any error into an answer for the website
function sendError(res: Response, err: unknown) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}

// READ my profile
export async function getMe(req: AuthRequest, res: Response) {
  try {
    res.json(await getProfile(req.user!.id));
  } catch (err) {
    sendError(res, err);
  }
}

// UPDATE my profile
export async function updateMe(req: AuthRequest, res: Response) {
  try {
    res.json(await editProfile(req.user!.id, req.body));
  } catch (err) {
    sendError(res, err);
  }
}

// DOWNLOAD everything we hold about me
export async function exportMe(req: AuthRequest, res: Response) {
  try {
    res.json(await downloadMyData(req.user!.id));
  } catch (err) {
    sendError(res, err);
  }
}

// DELETE my account (anonymise it)
export async function deleteMe(req: AuthRequest, res: Response) {
  try {
    await deleteMyAccount(req.user!.id, req.user!.role);
    res.status(204).send();
  } catch (err) {
    sendError(res, err);
  }
}