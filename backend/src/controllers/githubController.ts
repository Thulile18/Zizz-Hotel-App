import { Request, Response } from 'express';
import { HttpError } from '../services/hotelService';
import { loginWithGitHub } from '../services/githubService';

export async function githubLogin(req: Request, res: Response) {
  try {
    res.json(await loginWithGitHub(req.body));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}