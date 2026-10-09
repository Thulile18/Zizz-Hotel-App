import { Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser } from '../services/authService';

// The rules for what the website must send us
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  try {
    const { name, email, password } = parsed.data;
    const result = await registerUser(name, email, password);
    res.status(201).json(result);
  } catch (err) {
    res.status(409).json({ error: (err as Error).message });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  try {
    const result = await loginUser(parsed.data.email, parsed.data.password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
}