import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Adds the logged-in user's details to the request
export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

// Guard 1: you must be logged in
export function requireLogin(req: AuthRequest, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as { id: number; role: string };
    next();
  } catch {
    res.status(401).json({ error: 'Please log in' });
  }
}

// Guard 2: you must be an admin (always used after requireLogin)
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admins only' });
  }
}